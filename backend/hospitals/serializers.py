from rest_framework import serializers
from .models import Hospital, Department
from users.models import Profile

class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    head = serializers.CharField(source='head_name', required=False, allow_blank=True)
    doctors = serializers.IntegerField(read_only=True)
    staff = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Department
        fields = ('id', 'dept_code', 'name', 'head', 'doctors', 'staff', 'status', 'created_at')
