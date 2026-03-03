import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from hospitals.models import Hospital, Department
from users.models import Profile
from clinical.models import Visit
from django.contrib.auth.models import User
import uuid

class Command(BaseCommand):
    help = 'Seeds historical visit data for AI analytics testing'

    def handle(self, *args, **options):
        self.stdout.write("Seeding analytics data...")
        
        hospitals = Hospital.objects.all()
        if not hospitals.exists():
            self.stdout.write(self.style.ERROR("No hospitals found. Please create a hospital first."))
            return

        # Ensure we have some patients
        patients = Profile.objects.filter(role='patient')
        if not patients.exists():
            self.stdout.write("No patients found. Creating 50 dummy patients...")
            for i in range(50):
                user_id = uuid.uuid4()
                user = User.objects.create_user(
                    username=f"patient_{user_id.hex[:8]}",
                    email=f"patient_{i}@example.com",
                    password="password123"
                )
                Profile.objects.create(
                    id=user_id,
                    user=user,
                    role='patient',
                    full_name=f"Patient {i}",
                    age=random.randint(5, 85),
                    gender=random.choice(['Male', 'Female', 'Other']),
                    blood_group=random.choice(['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'])
                )
            patients = Profile.objects.filter(role='patient')

        # Ensure we have some doctors
        doctors = Profile.objects.filter(role='doctor')
        if not doctors.exists():
            self.stdout.write(self.style.ERROR("No doctors found. Please register at least one doctor."))
            return

        # Common diagnoses for KNN simulation
        diagnoses = [
            "Fever & Common Cold",
            "Hypertension Checkup",
            "Acute Bronchitis",
            "Type 2 Diabetes Routine",
            "Osteoarthritis Pain",
            "Allergic Rhinitis",
            "Gastritis",
            "Lower Back Pain",
            "Migraine Headaches",
            "Urinary Tract Infection"
        ]

        # Generate visits for the last 180 days
        end_date = timezone.now()
        start_date = end_date - timedelta(days=180)
        
        current_date = start_date
        total_visits = 0

        while current_date <= end_date:
            # For each hospital and its departments
            for hospital in hospitals:
                depts = Department.objects.filter(hospital=hospital)
                if not depts.exists():
                    continue

                for dept in depts:
                    # Random load: some departments busier than others
                    # Also add a "weekly" cycle: weekends quieter
                    is_weekend = current_date.weekday() >= 5
                    base_load = random.randint(5, 15) if not is_weekend else random.randint(2, 6)
                    
                    # Add some seasonality/random spikes
                    if random.random() > 0.95:
                        base_load *= 2 # Spike

                    for _ in range(base_load):
                        patient = random.choice(patients)
                        doctor = random.choice(doctors.filter(hospital=hospital) or [random.choice(doctors)])
                        
                        visit = Visit.objects.create(
                            hospital=hospital,
                            patient=patient,
                            doctor=doctor,
                            diagnosis=random.choice(diagnoses),
                            visit_date=current_date
                        )
                        # Avoid auto_now_add override issues if any, but visit_date is usually set at creation
                        # If Visit.visit_date has auto_now_add=True, we might need to manually update after save
                        # Let's check model again... yes, visit_date = models.DateTimeField(auto_now_add=True)
                        Visit.objects.filter(id=visit.id).update(visit_date=current_date, created_at=current_date)
                        total_visits += 1

            current_date += timedelta(days=1)
            if total_visits % 100 == 0:
                self.stdout.write(f"Generated {total_visits} visits...")

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {total_visits} visits across 180 days."))
