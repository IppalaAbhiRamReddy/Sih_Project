import uuid
import secrets
import string
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import viewsets, status, views, mixins
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Hospital
from .serializers import HospitalSerializer
from users.models import Profile

class HospitalViewSet(mixins.ListModelMixin, 
                     mixins.RetrieveModelMixin, 
                     mixins.UpdateModelMixin,
                     viewsets.GenericViewSet):

    queryset = Hospital.objects.all().order_by('-created_at')
    serializer_class = HospitalSerializer

    def perform_update(self, serializer):
        instance = self.get_object()
        old_email = instance.contact_email
        
        try:
            with transaction.atomic():
                serializer.save()
                new_email = serializer.instance.contact_email
                
                if old_email != new_email:
                    # Sync email change to ALL Profiles associated with this specific hospital authority
                    profiles = Profile.objects.filter(hospital=instance, role='hospital_admin')
                    for profile in profiles:
                        profile.email = new_email
                        profile.save()
                        if profile.user:
                            user = profile.user
                            user.email = new_email
                            user.username = new_email
                            user.save()
        except Exception as e:
            from django.db import IntegrityError
            if isinstance(e, IntegrityError) or "unique constraint" in str(e).lower():
                raise serializer.ValidationError({"contact_email": "A user with this email already exists."})
            raise serializer.ValidationError({"error": str(e)})


    @action(detail=False, methods=['get'])
    def system_stats(self, request):
        hospitals_count = Hospital.objects.count()
        total_users = Profile.objects.exclude(role='admin').count()
        doctors = Profile.objects.filter(role='doctor').count()
        staff = Profile.objects.filter(role='staff').count()
        patients = Profile.objects.filter(role='patient').count()

        return Response({
            'hospitals': hospitals_count,
            'totalUsers': total_users,
            'doctors': doctors,
            'staff': staff,
            'patients': patients
        })

class HospitalRegistrationView(views.APIView):
    def post(self, request):
        data = request.data
        email = data.get('email')
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=email).exists():
            return Response({'error': 'A user with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # 1. Create Hospital
                hospital = Hospital.objects.create(
                    name=data.get('name'),
                    address=data.get('address'),
                    contact_email=email,
                    contact_phone=data.get('phone')
                )
                
                # 2. Generate Random Temp Password
                alphabet = string.ascii_letters + string.digits
                temp_password = ''.join(secrets.choice(alphabet) for i in range(12))
                
                # 3. Create Django User
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=temp_password
                )
                
                # 4. Create Profile
                Profile.objects.create(
                    id=uuid.uuid4(),
                    user=user,
                    hospital=hospital,
                    full_name=f"{data.get('name')} Admin",
                    email=email,
                    role='hospital_admin',
                    is_active=True
                )
                
                return Response({
                    'hospital': HospitalSerializer(hospital).data,
                    'email': email,
                    'temp_password': temp_password,
                    'message': 'Hospital and Admin account created successfully.'
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
