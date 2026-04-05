import os
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Profile
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .serializers import (
    LoginSerializer, UserProfileSerializer, 
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)

class LoginView(views.APIView):
    """
    Authenticates a user and returns a JWT token pair and user profile.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        """
        Supports authentication by email for all roles (including Patients with Health ID usernames).
        """
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            # Find the user by username OR email field to handle different registration patterns
            user_obj = User.objects.filter(username=email).first() or \
                      User.objects.filter(email=email).first()
            
            if user_obj:
                # Authenticate using the USERNAME found in the DB (which might be a Health ID)
                user = authenticate(username=user_obj.username, password=password)
                
                if user:
                    try:
                        profile = Profile.objects.select_related('user', 'hospital', 'department').get(user=user)
                    except Profile.DoesNotExist:
                        return Response({'error': 'Profile not found. Please contact support.'}, status=status.HTTP_404_NOT_FOUND)
                    
                    refresh = RefreshToken.for_user(user)
                    
                    return Response({
                        'user': UserProfileSerializer(profile).data,
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                    })

            # Check if account is disabled for the correct user/password combination
            if user_obj and user_obj.check_password(password) and not user_obj.is_active:
                return Response({
                    'error': 'This account has been disabled. Please contact your administrator for reactivation.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(views.APIView):
    """
    Initiates the password reset process by generating a token and sending an email.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        """
        Expects 'email'. Returns a success message regardless of user existence (security best practice).
        """
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            # Safely fetch the user. Prioritize username match since login uses 'authenticate(username=email)'
            user = User.objects.filter(username=email).first() or User.objects.filter(email=email).first()
            
            if user:
                # Generate reset token and encoded UID
                token = default_token_generator.make_token(user)
                uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
                
                # Pick the appropriate frontend URL from settings
                from django.conf import settings
                # If FRONTEND_URL is a string (legacy) or a list, handle both
                frontend_urls = getattr(settings, 'FRONTEND_URL', ['http://localhost:5173'])
                if isinstance(frontend_urls, str):
                    frontend_urls = [url.strip() for url in frontend_urls.split(',') if url.strip()]
                
                # Default to the first one, but try to match the requester's Origin
                origin = request.headers.get('Origin')
                frontend_url = origin if origin in frontend_urls else (frontend_urls[0] if frontend_urls else 'http://localhost:5173')
                
                reset_link = f"{frontend_url.rstrip('/')}/reset-password?uidb64={uidb64}&token={token}"
                
                from .utils import send_async_email
                
                subject = "Password Reset Request – SIH Medical"
                html_body = f"""
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <p>Dear User,</p>

                    <p>We received a request to reset your password for your SIH Medical account.</p>

                    <p>Please click the button below to reset your password:</p>

                    <p>
                        <a href="{reset_link}" 
                           style="background-color: #007BFF; color: #ffffff; padding: 10px 20px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                           Reset Password
                        </a>
                    </p>

                    <p>If you did not request this, please ignore this email.</p>

                    <p>Best regards,<br>SIH Medical Team</p>
                </body>
                </html>
                """
                send_async_email(subject, html_body, [email])
            
            # Security best practice: Always return 200/success message even if the user didn't exist
            return Response({'message': 'If an account exists with this email, a reset link has been sent.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(views.APIView):
    """
    Completes the password reset process using the UID and Token from the email.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        """
        Expects 'uidb64', 'token', and 'new_password'.
        """
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            uidb64 = serializer.validated_data['uidb64']
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            try:
                # Decode UID and fetch user
                uid = force_str(urlsafe_base64_decode(uidb64))
                user = User.objects.get(pk=uid)
                
                # Validate token
                if default_token_generator.check_token(user, token):
                    user.set_password(new_password)
                    user.save()
                    return Response({'message': 'Password reset successfully.'}, status=status.HTTP_200_OK)
                else:
                    return Response({'error': 'The reset link is invalid or has expired.'}, status=status.HTTP_400_BAD_REQUEST)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response({'error': 'Invalid reset request.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
