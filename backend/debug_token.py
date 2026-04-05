import os
import django
from django.conf import settings

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sih_backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

def test_token_logic(email):
    print(f"Testing token logic for email: {email}")
    user = User.objects.filter(username=email).first() or User.objects.filter(email=email).first()
    
    if not user:
        print("User not found.")
        return

    print(f"User found: {user.username} (PK: {user.pk})")
    
    # Generate token
    token = default_token_generator.make_token(user)
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    
    print(f"Generated UIDB64: {uidb64}")
    print(f"Generated Token: {token}")
    
    # Simulate confirmation
    uid = force_str(urlsafe_base64_decode(uidb64))
    user_confirm = User.objects.get(pk=uid)
    
    is_valid = default_token_generator.check_token(user_confirm, token)
    print(f"Token is valid: {is_valid}")

if __name__ == "__main__":
    # Get any user email to test with
    test_user = User.objects.first()
    if test_user:
        test_token_logic(test_user.email or test_user.username)
    else:
        print("No users found in database.")
