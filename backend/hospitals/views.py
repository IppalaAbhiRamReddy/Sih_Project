import uuid
import secrets
import string
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import viewsets, status, views, mixins, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Hospital, Department
from .serializers import HospitalSerializer, DepartmentSerializer
from users.models import Profile
from users.serializers import ProfileSerializer
from rest_framework import permissions
from clinical.models import Visit, LabReport, Vaccination
from clinical.serializers import (
    DetailedVisitSerializer, LabReportSerializer, VaccinationSerializer
)

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

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        try:
            profile = request.user.profile
            hospital = profile.hospital
            if not hospital:
                return Response({'error': 'No hospital associated with this user.'}, status=status.HTTP_400_BAD_REQUEST)
            
            doctors_count = Profile.objects.filter(hospital=hospital, role='doctor', is_active=True).count()
            staff_count = Profile.objects.filter(hospital=hospital, role='staff', is_active=True).count()
            # Active today should be sum of active doctors and staff
            active_count = doctors_count + staff_count

            return Response({
                'doctors': doctors_count,
                'staff': staff_count,
                'active': active_count
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

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

class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            profile = self.request.user.profile
            if profile.role == 'admin':
                return Profile.objects.all()
            if profile.hospital:
                qs = Profile.objects.filter(hospital=profile.hospital)
                role = self.request.query_params.get('role')
                if role:
                    qs = qs.filter(role=role)
                return qs
        except:
            return Profile.objects.none()

    @action(detail=False, methods=['get'])
    def medical_history(self, request):
        health_id = request.query_params.get('health_id')
        if not health_id:
            return Response({'error': 'health_id is required'}, status=400)
            
        try:
            patient = Profile.objects.get(health_id=health_id, role='patient')
            
            # Fetch related clinical data
            visits = Visit.objects.filter(patient=patient).order_by('-visit_date')
            lab_reports = LabReport.objects.filter(patient=patient).order_by('-report_date')
            vaccinations = Vaccination.objects.filter(patient=patient).order_by('-administered_date')
            
            return Response({
                'profile': ProfileSerializer(patient).data,
                'visits': DetailedVisitSerializer(visits, many=True).data,
                'lab_reports': LabReportSerializer(lab_reports, many=True).data,
                'vaccinations': VaccinationSerializer(vaccinations, many=True).data,
            })
        except Profile.DoesNotExist:
            return Response({'error': 'Patient not found'}, status=404)

    def perform_update(self, serializer):
        with transaction.atomic():
            # Get current instance before saving
            instance = self.get_object()
            old_status = instance.is_active
            
            # Save the new state
            new_instance = serializer.save()
            new_status = new_instance.is_active

            # Restriction: Hospital Authority cannot re-enable accounts
            # If status changes from False to True and user is not superuser/admin
            profile = self.request.user.profile
            if not old_status and new_status and profile.role != 'admin':
                raise permissions.exceptions.PermissionDenied("You don't have access to activate the account")

            # Sync is_active status to the associated Django User
            if new_instance.user:
                user = new_instance.user
                if user.is_active != new_status:
                    user.is_active = new_status
                    user.save(update_fields=['is_active'])

class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show departments for the hospital associated with the logged-in user
        try:
            profile = self.request.user.profile
            if profile.role == 'admin':
                return Department.objects.all()
            if profile.hospital:
                return Department.objects.filter(hospital=profile.hospital)
            return Department.objects.none()
        except:
            return Department.objects.none()

    def perform_create(self, serializer):
        # Automatically associate the department with the user's hospital
        try:
            profile = self.request.user.profile
            if profile.hospital:
                serializer.save(hospital=profile.hospital)
            else:
                raise serializers.ValidationError({"error": "User is not associated with any hospital."})
        except Profile.DoesNotExist:
            raise serializers.ValidationError({"error": "User profile not found."})

class UserRegistrationView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            admin_profile = request.user.profile
            if admin_profile.role != 'hospital_admin':
                 return Response({'error': 'Unauthorized. Only hospital admins can register users.'}, status=status.HTTP_403_FORBIDDEN)
            
            data = request.data
            email = data.get('email')
            name = data.get('full_name')
            role = data.get('role') # 'doctor' or 'staff'
            dept_id = data.get('department_id')
            spec = data.get('specialization', '')

            if not email or not name or not role:
                return Response({'error': 'Email, name, and role are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            if User.objects.filter(username=email).exists():
                return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                # 1. Generate temp password
                alphabet = string.ascii_letters + string.digits
                temp_password = ''.join(secrets.choice(alphabet) for i in range(12))

                # 2. Create Django User
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=temp_password
                )

                # 3. Get Department
                dept = None
                if dept_id:
                    dept = Department.objects.get(id=dept_id)

                # 4. Create Profile
                Profile.objects.create(
                    id=uuid.uuid4(),
                    user=user,
                    hospital=admin_profile.hospital,
                    department=dept,
                    full_name=name,
                    email=email,
                    role=role,
                    specialization=spec if role == 'doctor' else None,
                    is_active=True
                )

                return Response({
                    'message': f'{role.capitalize()} registered successfully.',
                    'temp_password': temp_password,
                    'email': email,
                    'name': name,
                    'role': role.capitalize()
                }, status=status.HTTP_201_CREATED)

        except Department.DoesNotExist:
            return Response({'error': f'Department {dept_id} not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DeleteUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, profile_id):
        try:
            admin_profile = request.user.profile
            if admin_profile.role != 'hospital_admin':
                 return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
            profile = Profile.objects.get(id=profile_id, hospital=admin_profile.hospital)
            user = profile.user
            
            with transaction.atomic():
                # Soft delete: deactive the user account
                if user:
                    user.is_active = False
                    user.save()
                
                profile.is_active = False
                profile.save()
            
            return Response({'message': 'User deactivated successfully.'}, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PatientRegistrationView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            creator_profile = request.user.profile
            if creator_profile.role not in ['staff', 'hospital_admin', 'doctor']:
                 return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
            data = request.data
            email = data.get('email')
            if not email:
                email = f"p_{uuid.uuid4().hex[:8]}@patient.local"
                
            full_name = data.get('full_name')
            hospital_id = data.get('hospital_id')
            
            # Simple unique HID generation logic
            import random
            health_id = f"HID-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
            
            with transaction.atomic():
                alphabet = string.ascii_letters + string.digits
                temp_password = ''.join(secrets.choice(alphabet) for i in range(12))
                
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=temp_password
                )
                
                profile = Profile.objects.create(
                    id=uuid.uuid4(),
                    user=user,
                    role='patient',
                    hospital_id=hospital_id or creator_profile.hospital.id,
                    full_name=full_name,
                    email=email,
                    health_id=health_id,
                    age=data.get('age'),
                    gender=data.get('gender'),
                    blood_group=data.get('blood_group'),
                    contact_number=data.get('contact_number'),
                    address=data.get('address'),
                    emergency_contact=data.get('emergency_contact'),
                    allergies=data.get('allergies', []),
                    chronic_conditions=data.get('chronic_conditions', []),
                    registered_by=creator_profile,
                    is_active=True
                )
                
                # 3. Create Vaccinations
                vaccinations_data = data.get('vaccinations', [])
                print(f"DEBUG: Vaccinations data received: {vaccinations_data}")
                if isinstance(vaccinations_data, list):
                    from clinical.models import Vaccination
                    for v in vaccinations_data:
                        vac = Vaccination.objects.create(
                            patient=profile,
                            vaccine_name=v.get('name'),
                            administered_date=v.get('date') or None,
                            next_due_date=v.get('nextDue') or None
                        )
                        print(f"DEBUG: Created Vaccination: {vac.vaccine_name} for patient {profile.full_name}, ID: {vac.id}")
                
                return Response({
                    'user_id': str(profile.id),
                    'health_id': health_id,
                    'temp_password': temp_password,
                    'message': 'Patient registered successfully.'
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
