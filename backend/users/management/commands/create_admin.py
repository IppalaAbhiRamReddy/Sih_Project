import uuid
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from users.models import Profile

class Command(BaseCommand):
    help = 'Create a super admin user and its corresponding profile'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, required=True, help='Admin email')
        parser.add_argument('--password', type=str, required=True, help='Admin password')
        parser.add_argument('--name', type=str, required=True, help='Admin full name')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        name = options['name']

        if User.objects.filter(username=email).exists():
            self.stdout.write(self.style.ERROR(f'User with email {email} already exists.'))
            return

        # 1. Create Django User
        user = User.objects.create_user(username=email, email=email, password=password)
        user.is_staff = True
        user.is_superuser = True
        user.save()

        # 2. Create Profile
        Profile.objects.create(
            id=uuid.uuid4(),
            user=user,
            full_name=name,
            email=email,
            role='admin',
            is_active=True
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully created admin: {email}'))
