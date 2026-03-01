from rest_framework import serializers
from .models import Hospital, Department
from users.models import Profile

class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    doctor_count = serializers.SerializerMethodField()
    staff_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = '__all__'
        read_only_fields = ('hospital', 'doctor_count', 'staff_count')

    def get_doctor_count(self, obj):
        return Profile.objects.filter(department=obj, role='doctor', is_active=True).count()

    def get_staff_count(self, obj):
        return Profile.objects.filter(department=obj, role='staff', is_active=True).count()
