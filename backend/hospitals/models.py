from django.db import models
import uuid

class Hospital(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=50, blank=True, null=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hospitals'

    def __str__(self):
        return self.name

class Department(models.Model):
    id = models.CharField(primary_key=True, max_length=50)  # Manual ID from frontend
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=255)
    head_name = models.CharField(max_length=255, blank=True, null=True)
    doctor_count = models.IntegerField(default=0)
    staff_count = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'departments'

    def __str__(self):
        return f"{self.name} ({self.hospital.name})"
