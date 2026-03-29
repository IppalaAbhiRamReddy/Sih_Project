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

    class Meta:
        model = Profile
        fields = [
            'id', 'role', 'full_name', 'email', 'hospital_id', 
            'department', 'department_id', 'department_name', 'specialization', 
            'is_active', 'join_date', 'health_id', 'age', 'gender', 
            'blood_group', 'contact_number', 'address', 'emergency_contact', 
            'allergies', 'chronic_conditions', 'created_at'
        ]
        read_only_fields = ['department_id', 'department_name', 'hospital_id', 'role', 'join_date', 'health_id', 'created_at']

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=8)
    token = serializers.CharField()
    uidb64 = serializers.CharField()
