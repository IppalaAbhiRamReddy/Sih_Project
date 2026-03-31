from rest_framework import serializers
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class UserProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name', default='—')
    # Aliases to match frontend expectations without rewriting frontend logic
    name = serializers.ReadOnlyField(source='full_name')
    dept_id = serializers.ReadOnlyField(source='department_id')
    active = serializers.ReadOnlyField(source='is_active')
    spec = serializers.ReadOnlyField(source='specialization')
    join = serializers.ReadOnlyField(source='join_date')

    class Meta:
        model = Profile
        fields = [
            'id', 'role', 'full_name', 'name', 'email', 'hospital_id', 
            'department', 'department_id', 'dept_id', 'department_name', 
            'specialization', 'spec', 'is_active', 'active', 'join_date', 'join',
            'health_id', 'age', 'gender', 'blood_group', 'contact_number', 
            'address', 'emergency_contact', 'allergies', 'chronic_conditions', 'created_at'
        ]
        read_only_fields = ['department_id', 'dept_id', 'department_name', 'hospital_id', 'role', 'join_date', 'join', 'health_id', 'created_at']

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=8)
    token = serializers.CharField()
    uidb64 = serializers.CharField()
