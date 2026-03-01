from django.db import models
from django.contrib.auth.models import User
from hospitals.models import Hospital, Department
import uuid

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', null=True, blank=True)
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('hospital_admin', 'Hospital Admin'),
        ('doctor', 'Doctor'),
        ('staff', 'Staff'),
        ('patient', 'Patient'),
    ]

    id = models.UUIDField(primary_key=True, editable=False) # Maps to auth.users id
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    contact_number = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    join_date = models.DateField(auto_now_add=True)

    # Doctor-Specific
    specialization = models.TextField(blank=True, null=True)

    # Patient-Specific
    health_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    gender = models.CharField(max_length=50, blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    emergency_contact = models.JSONField(blank=True, null=True)
    allergies = models.JSONField(default=list, blank=True)
    chronic_conditions = models.JSONField(default=list, blank=True)

    registered_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'profiles'

    def __str__(self):
        return f"{self.full_name} ({self.role})"
