"""
Profile models for the SIH Medical Project.
Handles user roles, hospital affiliations, and patient Electronic Health Records (EHR).
"""
from django.db import models
from django.contrib.auth.models import User
from hospitals.models import Hospital, Department
import uuid

class Profile(models.Model):
    """
    Extended user profile that stores role-based data and links to hospitals/departments.
    Supports Admin, Hospital Admin, Doctor, Staff, and Patient roles.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', null=True, blank=True)
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('hospital_admin', 'Hospital Admin'),
        ('doctor', 'Doctor'),
        ('staff', 'Staff'),
        ('patient', 'Patient'),
    ]

    # Identity & Authorization
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True) # Linked to Supabase Auth ID if available
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, db_index=True)
    
    # Institutional Linking
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='profiles')
    
    # Personal Info
    full_name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True, db_index=True)
    contact_number = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    join_date = models.DateField(auto_now_add=True)

    # Doctor-Specific Fields
    specialization = models.TextField(blank=True, null=True)

    # Patient-Specific Fields (EHR Data)
    health_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    gender = models.CharField(max_length=50, blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    emergency_contact = models.JSONField(blank=True, null=True)
    allergies = models.JSONField(default=list, blank=True)
    chronic_conditions = models.JSONField(default=list, blank=True)

    # Tracking & Meta
    registered_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        """Returns the string representation of the profile."""
        return f"{self.full_name} ({self.role})"

    class Meta:
        db_table = 'profiles'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'


# --- Synchronization Signals ---
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Profile)
def sync_profile_to_user(sender, instance, **kwargs):
    """
    Ensure the Django User's is_active status stays in sync with its Profile.
    """
    if instance.user:
        user = instance.user
        if user.is_active != instance.is_active:
            # Using update() avoids triggering the post_save signal on User again
            User.objects.filter(pk=user.pk).update(is_active=instance.is_active)

@receiver(post_save, sender=User)
def sync_user_to_profile(sender, instance, **kwargs):
    """
    Ensure the Profile's is_active status stays in sync with its Django User.
    """
    # Use filter().update() to avoid infinite recursion and Profile.DoesNotExist errors
    Profile.objects.filter(user=instance).exclude(is_active=instance.is_active).update(is_active=instance.is_active)
