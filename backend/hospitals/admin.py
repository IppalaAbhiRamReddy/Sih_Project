from django.contrib import admin
from .models import Hospital, Department

@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'contact_email', 'active', 'created_at')
    list_filter = ('active',)
    search_fields = ('name', 'contact_email')

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'hospital', 'head_name', 'doctor_count', 'staff_count', 'status')
    list_filter = ('hospital', 'status')
    search_fields = ('id', 'name', 'head_name')
