from django.contrib import admin
from .models import Profile

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'hospital', 'department', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'hospital', 'department')
    search_fields = ('email', 'full_name')
    ordering = ('-created_at',)
