"""
Views for the Hospitals app.
Handles Hospital Authority management, Department creation, User (Doctor/Staff) registration,
and Patient registration by authorized workforce members.
"""
import uuid
import secrets
import string
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import viewsets, status, views, mixins, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Count, Q, Subquery, OuterRef
from .models import Hospital, Department
from .serializers import HospitalSerializer, DepartmentSerializer
from users.models import Profile
from users.serializers import ProfileSerializer, UserProfileSerializer
from rest_framework import permissions
from clinical.models import Visit, LabReport, Vaccination
from clinical.serializers import (
    DetailedVisitSerializer, LabReportSerializer, VaccinationSerializer
)
from django.utils import timezone
from datetime import timedelta

class HospitalViewSet(mixins.ListModelMixin, 
                     mixins.RetrieveModelMixin, 
                     mixins.UpdateModelMixin,
                     viewsets.GenericViewSet):
    """
    Manages existing Hospital records. 
    Includes custom actions for system-wide and dashboard-specific statistics.
    """

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
        # Consolidate multiple Profile count() calls into a single aggregate query (SQL efficiency)
        stats = Profile.objects.exclude(role='admin').aggregate(
            totalUsers=Count('id'),
            doctors=Count('id', filter=Q(role='doctor')),
            staff=Count('id', filter=Q(role='staff')),
            patients=Count('id', filter=Q(role='patient'))
        )

        return Response({
            'hospitals': hospitals_count,
            'totalUsers': stats['totalUsers'],
            'doctors': stats['doctors'],
            'staff': stats['staff'],
            'patients': stats['patients']
        })

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        try:
            profile = request.user.profile
            hospital = profile.hospital
            if not hospital:
                return Response({'error': 'No hospital associated with this user.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Consolidate multiple count() calls into a single aggregate query (SQL efficiency)
            stats = Profile.objects.filter(hospital=hospital, is_active=True).aggregate(
                doctors_count=Count('id', filter=Q(role='doctor')),
                staff_count=Count('id', filter=Q(role='staff'))
            )
            
            doctors_count = stats['doctors_count']
            staff_count = stats['staff_count']
            active_count = doctors_count + staff_count

            return Response({
                'doctors': doctors_count,
                'staff': staff_count,
                'active': active_count
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def staff_stats(self, request):
        try:
            profile = request.user.profile
            hospital = profile.hospital
            if not hospital:
                return Response({'error': 'No hospital associated.'}, status=400)
            
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)
            
            # Count patient registrations at this hospital
            stats = Profile.objects.filter(hospital=hospital, role='patient').aggregate(
                today=Count('id', filter=Q(created_at__gte=today_start)),
                week=Count('id', filter=Q(created_at__gte=week_ago)),
                month=Count('id', filter=Q(created_at__gte=month_ago)),
                total=Count('id')
            )
            return Response(stats)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=False, methods=['get'])
    def dashboard_overview(self, request):
        """
        Consolidated endpoint for the hospital dashboard to avoid multiple parallel calls.
        Returns: stats, departments, doctors (recent), and staff (recent).
        """
        try:
            profile = request.user.profile
            hospital = profile.hospital
            if not hospital:
                return Response({'error': 'Hospital not found'}, status=400)

            from django.db.models import Count, Q, Value
            from django.db.models.functions import Coalesce

            # 1. Dashboard Stats (Admin Stats)
            stats = Profile.objects.filter(hospital=hospital, is_active=True).aggregate(
                doctors_count=Count('id', filter=Q(role='doctor')),
                staff_count=Count('id', filter=Q(role='staff'))
            )
            
            # 2. Departments with efficient counts
            departments = Department.objects.filter(hospital=hospital).annotate(
                doctors=Coalesce(Count('profiles', filter=Q(profiles__role='doctor', profiles__is_active=True)), Value(0)),
                staff=Coalesce(Count('profiles', filter=Q(profiles__role='staff', profiles__is_active=True)), Value(0))
            ).order_by('created_at')

            # 3. Doctors & Staff
            base_profiles = Profile.objects.filter(hospital=hospital).select_related('user', 'department', 'hospital').order_by('-created_at')
            doctors = base_profiles.filter(role='doctor')[:50]
            staff_list = base_profiles.filter(role='staff')[:50]

            from .serializers import DepartmentSerializer
            from users.serializers import UserProfileSerializer

            return Response({
                'stats': {
                    'doctors': stats['doctors_count'],
                    'staff': stats['staff_count'],
                    'active': stats['doctors_count'] + stats['staff_count']
                },
                'departments': DepartmentSerializer(departments, many=True).data,
                'doctors': UserProfileSerializer(doctors, many=True).data,
                'staff': UserProfileSerializer(staff_list, many=True).data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class HospitalRegistrationView(views.APIView):
    """
    Creates a new Hospital account along with a Hospital Admin user and Profile.
    Generates a temporary password for the new admin.
    """
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
    """
    Manages User Profiles (Doctors, Staff, Patients).
    Filters results based on the logged-in user's role and hospital association.
    """
    def get_serializer_class(self):
        # Use a lightweight serializer for bulk listings to reduce payload size.
        if self.action == 'list':
            return UserProfileSerializer
        return ProfileSerializer

    def get_queryset(self):
        try:
            profile = self.request.user.profile
            base_qs = Profile.objects.all().select_related('user', 'hospital', 'department')
            if profile.role == 'admin':
                return base_qs
            if profile.hospital:
                qs = base_qs.filter(hospital=profile.hospital)
                role = self.request.query_params.get('role')
                if role:
                    qs = qs.filter(role=role)
                return qs
        except:
            return Profile.objects.none()

    @action(detail=False, methods=['get'])
    def medical_history(self, request):
        health_id = request.query_params.get('health_id')
        patient_id = request.query_params.get('patient_id')
        include = request.query_params.get('include', 'profile,visits,lab_reports,vaccinations').split(',')
        
        if not health_id and not patient_id:
            return Response({'error': 'health_id or patient_id is required'}, status=400)
            
        try:
            if health_id:
                patient = Profile.objects.get(health_id=health_id, role='patient')
            else:
                patient = Profile.objects.get(id=patient_id, role='patient')
            response_data = {}

            if 'profile' in include:
                response_data['profile'] = ProfileSerializer(patient).data
            
            if 'visits' in include:
                visits = Visit.objects.filter(patient=patient)\
                    .select_related('doctor', 'hospital', 'patient')\
                    .order_by('-visit_date')
                response_data['visits'] = DetailedVisitSerializer(visits, many=True).data
            
            if 'lab_reports' in include:
                lab_reports = LabReport.objects.filter(patient=patient)\
                    .select_related('hospital')\
                    .order_by('-report_date')
                response_data['lab_reports'] = LabReportSerializer(lab_reports, many=True).data
            
            if 'vaccinations' in include:
                vaccinations = Vaccination.objects.filter(patient=patient)\
                    .order_by('-administered_date')
                response_data['vaccinations'] = VaccinationSerializer(vaccinations, many=True).data
            
            return Response(response_data)
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

            # Restriction: Only Admin and Hospital Admin can re-enable accounts
            profile = self.request.user.profile
            if not old_status and new_status and profile.role not in ['admin', 'hospital_admin']:
                raise permissions.exceptions.PermissionDenied("You don't have access to activate the account")

            # Sync is_active status to the associated Django User
            if new_instance.user:
                user = new_instance.user
                if user.is_active != new_status:
                    user.is_active = new_status
                    user.save(update_fields=['is_active'])

class DepartmentViewSet(viewsets.ModelViewSet):
    """
    CRUD for Hospital Departments.
    Automatically restricts access to departments within the user's specific hospital.
    """
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Using Subqueries to fetch counts avoids complex JOIN/GROUP BY errors in PostgreSQL.
        profile = self.request.user.profile
        
        # Subquery for doctor count
        doctors_sq = Profile.objects.filter(
            department=OuterRef('pk'),
            role='doctor',
            is_active=True
        ).values('department').annotate(count=Count('id')).values('count')
        
        # Subquery for staff count
        staff_sq = Profile.objects.filter(
            department=OuterRef('pk'),
            role='staff',
            is_active=True
        ).values('department').annotate(count=Count('id')).values('count')
        
        # We handle nulls from Subquery (0 when no profiles found)
        from django.db.models.functions import Coalesce
        from django.db.models import Value
        
        base_qs = Department.objects.all().order_by('created_at').annotate(
            doctors=Coalesce(Subquery(doctors_sq), Value(0)),
            staff=Coalesce(Subquery(staff_sq), Value(0))
        )
        
        if profile.role == 'admin':
            return base_qs
        if profile.hospital:
            return base_qs.filter(hospital=profile.hospital)
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
    """
    Enables Hospital Admins to register Doctors and Staff members.
    Automates Django User creation and Profile linking.
    """
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
    """
    Enables Doctors, Staff, and Hospital Admins to register new Patients.
    Generates a unique Health ID and creates a secure patient account.
    Supports initial vaccination record syncing during registration.
    """
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
                if isinstance(vaccinations_data, list) and vaccinations_data:
                    from clinical.models import Vaccination
                    from clinical.serializers import VaccinationSerializer
                    
                    vaccinations_to_create = []
                    for v in vaccinations_data:
                        if not v.get('name'):
                            continue
                            
                        # Map frontend keys to internal names and include profile ID
                        ser_data = {
                            'vaccine_name': v.get('name'),
                            'administered_date': v.get('date') or None,
                            'next_due_date': v.get('nextDue') or None,
                            'patient': str(profile.id)
                        }
                        
                        ser = VaccinationSerializer(data=ser_data)
                        ser.is_valid(raise_exception=True)
                        vaccinations_to_create.append(Vaccination(**ser.validated_data))
                        
                    if vaccinations_to_create:
                        Vaccination.objects.bulk_create(vaccinations_to_create)
                
                return Response({
                    'user_id': str(profile.id),
                    'health_id': health_id,
                    'temp_password': temp_password,
                    'message': 'Patient registered successfully.'
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
