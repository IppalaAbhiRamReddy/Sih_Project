"""
Views for the Users app.
Handles Authentication (Login, JWT Refresh) and Password Management.
"""
from rest_framework import views, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Profile
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
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
        Expects 'email' and 'password'. 
        Returns {user, access, refresh} on success.
        """
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            
            # Authenticate against Django's User model
            user = authenticate(username=email, password=password)
            
            if user:
                try:
                    profile = Profile.objects.get(email=email)
                except Profile.DoesNotExist:
                    return Response({'error': 'Profile not found. Please contact support.'}, status=status.HTTP_404_NOT_FOUND)
                
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'user': UserProfileSerializer(profile).data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                })
            
            # Additional check for disabled accounts (security: ONLY reveal this if password is correct)
            # authenticate() returns None for inactive users by default.
            from django.contrib.auth import get_user_model
            User = get_user_model()
            potential_user = User.objects.filter(username=email).first() or \
                            User.objects.filter(email=email).first()
                            
            if potential_user and potential_user.check_password(password) and not potential_user.is_active:
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
                
                # In development, use localhost. Production should use environment variables.
                reset_link = f"http://localhost:5173/reset-password?uidb64={uidb64}&token={token}"
                
                try:
                    send_mail(
                        "Password Reset Request | SIH Medical",
                        f"Please click the link below to reset your password:\n\n{reset_link}\n\nIf you did not request this, ignore this email.",
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                        fail_silently=False,
                    )
                except Exception as e:
                    return Response({'error': f'Failed to send email. Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
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
