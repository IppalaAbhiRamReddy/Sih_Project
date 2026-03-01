from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HospitalViewSet, HospitalRegistrationView, DepartmentViewSet, UserRegistrationView, DeleteUserView, PatientRegistrationView, ProfileViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'', HospitalViewSet, basename='hospital')

urlpatterns = [
    path('register/', HospitalRegistrationView.as_view(), name='register-hospital'),
    path('register-user/', UserRegistrationView.as_view(), name='register-user'),
    path('register-patient/', PatientRegistrationView.as_view(), name='register-patient'),
    path('delete-user/<uuid:profile_id>/', DeleteUserView.as_view(), name='delete-user'),
    path('', include(router.urls)),
]
