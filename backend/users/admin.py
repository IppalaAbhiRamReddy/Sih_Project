from django import forms
from django.contrib import admin
from django.contrib.auth.models import User
from .models import Profile

class ProfileAdminForm(forms.ModelForm):
    # Added password field to the admin form (not the model)
    password = forms.CharField(
        widget=forms.PasswordInput(),
        required=False,
        help_text="Set or change the account login password."
    )

    class Meta:
        model = Profile
        fields = '__all__'

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    form = ProfileAdminForm
    list_display = ('email', 'full_name', 'role', 'hospital', 'department', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'hospital', 'department')
    search_fields = ('email', 'full_name')
    ordering = ('-created_at',)

    def save_model(self, request, obj, form, change):
        password = form.cleaned_data.get('password')
        
        # Ensure we have a linked Django User for login
        if not obj.user and obj.email:
            # Using email as username for consistency with the frontend login
            user, created = User.objects.get_or_create(
                username=obj.email, 
                email=obj.email
            )
            obj.user = user
        
        # Save the Profile instance first
        super().save_model(request, obj, form, change)

        # Update the linked User's password if one was provided
        if password and obj.user:
            obj.user.set_password(password)
            obj.user.save()
