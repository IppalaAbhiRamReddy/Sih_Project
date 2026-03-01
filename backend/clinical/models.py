from django.db import models
from hospitals.models import Hospital
from users.models import Profile
import uuid

class Visit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE)
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='patient_visits')
    doctor = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='doctor_visits')
    diagnosis = models.TextField()
    prescription_text = models.TextField(blank=True, null=True)
    clinical_notes = models.TextField(blank=True, null=True)
    visit_date = models.DateTimeField(auto_now_add=True)
    next_visit_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'visits'

class Prescription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, null=True, blank=True)
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='patient_prescriptions')
    doctor = models.ForeignKey(Profile, on_delete=models.CASCADE, null=True, blank=True, related_name='doctor_prescriptions')
    medicine_name = models.CharField(max_length=255)
    dosage = models.CharField(max_length=255, blank=True, null=True)
    duration = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prescriptions'

class LabReport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='lab_reports')
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True)
    report_name = models.CharField(max_length=255)
    file_url = models.TextField()
    report_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=50, default='Normal')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'lab_reports'

class Vaccination(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='vaccinations')
    vaccine_name = models.CharField(max_length=255)
    administered_date = models.DateField(auto_now_add=True)
    next_due_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'vaccinations'
