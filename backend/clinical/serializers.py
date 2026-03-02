from rest_framework import serializers
from .models import Visit, Prescription, LabReport, Vaccination

from users.models import Profile

class VisitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visit
        fields = '__all__'

class PatientDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['full_name', 'health_id', 'age', 'gender']

class DetailedVisitSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    specialization = serializers.CharField(source='doctor.specialization', read_only=True)
    patient_details = PatientDetailsSerializer(source='patient', read_only=True)
    
    class Meta:
        model = Visit
        fields = [
            'id', 'patient', 'doctor', 'hospital', 'diagnosis', 
            'prescription_text', 'clinical_notes', 'visit_date', 
            'next_visit_date', 'created_at', 'doctor_name', 
            'hospital_name', 'specialization', 'patient_details'
        ]

class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = '__all__'

class LabReportSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    
    class Meta:
        model = LabReport
        fields = [
            'id', 'patient', 'hospital', 'hospital_name', 'report_name', 
            'file_url', 'report_date', 'status', 'created_at'
        ]

class VaccinationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vaccination
        fields = '__all__'
