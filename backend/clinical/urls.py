from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VisitViewSet, PrescriptionViewSet, LabReportViewSet, VaccinationViewSet

router = DefaultRouter()
router.register(r'visits', VisitViewSet)
router.register(r'prescriptions', PrescriptionViewSet)
router.register(r'lab-reports', LabReportViewSet)
router.register(r'vaccinations', VaccinationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
