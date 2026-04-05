import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sih_backend.settings')
django.setup()

from hospitals.models import Hospital
from users.models import Profile

print("Listing all Hospital records in DB:")
hospitals = Hospital.objects.all()
if not hospitals.exists():
    print("No hospitals found.")
else:
    for h in hospitals:
        print(f"ID: {h.id}, Name: {h.name}")

print("\nListing all Profiles in DB:")
profiles = Profile.objects.all()
if not profiles.exists():
    print("No profiles found.")
else:
    for p in profiles:
        print(f"ID: {p.id}, Full Name: {p.full_name}, Email: {p.email}, Role: {p.role}, Hospital ID: {p.hospital_id}")
