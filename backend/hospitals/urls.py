from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HospitalViewSet, HospitalRegistrationView

router = DefaultRouter()
router.register(r'', HospitalViewSet, basename='hospital')

urlpatterns = [
    path('register/', HospitalRegistrationView.as_view(), name='register-hospital'),
    path('', include(router.urls)),
]
