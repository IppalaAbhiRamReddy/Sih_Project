"""
Views for the Clinical app.
Manages Medical Visits, Prescriptions, Lab Reports, and Vaccinations.
"""
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Q
from .models import Visit, Prescription, LabReport, Vaccination
from .serializers import (
    VisitSerializer, DetailedVisitSerializer, PrescriptionSerializer, 
    LabReportSerializer, VaccinationSerializer
)

class VisitViewSet(viewsets.ModelViewSet):
    """
    CRUD for Medical Visits. Optimized with select_related to prevent N+1 queries.
    """
    queryset = Visit.objects.all().select_related('hospital', 'patient', 'doctor')
    serializer_class = VisitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        """Returns DetailedVisitSerializer for read operations to include nested names."""
        if self.action in ['retrieve', 'recent_visits']:
            return DetailedVisitSerializer
        return VisitSerializer

    def perform_update(self, serializer):
        instance = self.get_object()
        from django.utils import timezone
        if instance.visit_date.date() < timezone.now().date():
            from rest_framework import serializers
            raise serializers.ValidationError("Records can only be edited on the same day.")
        serializer.save()

    @action(detail=False, methods=['get'])
    def doctor_stats(self, request):
        """
        Calculates daily, weekly, and monthly visit counts for a specific doctor.
        Used for dashboard stats cards.
        """
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response({'error': 'doctor_id is required'}, status=400)
        
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        stats = Visit.objects.filter(doctor_id=doctor_id).aggregate(
            today=Count('id', filter=Q(visit_date__gte=today_start)),
            week=Count('id', filter=Q(visit_date__gte=week_ago)),
            month=Count('id', filter=Q(visit_date__gte=month_ago)),
            total=Count('id')
        )
        
        return Response(stats)

    @action(detail=False, methods=['get'])
    def recent_visits(self, request):
        """Fetches the unique recent patients for a doctor."""
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response({'error': 'doctor_id is required'}, status=400)
            
        # Optimization: Fetch most recent visit ID per patient for this doctor
        # Using PostgreSQL specific distinct
        visits = Visit.objects.filter(doctor_id=doctor_id)\
            .order_by('patient_id', '-visit_date')\
            .distinct('patient_id')
        
        # Sort in memory so the overall most recent patients appear first
        sorted_visits = sorted(list(visits), key=lambda x: x.visit_date, reverse=True)[:50]
        
        serializer = DetailedVisitSerializer(sorted_visits, many=True)
        return Response(serializer.data)

class PrescriptionViewSet(viewsets.ModelViewSet):
    """CRUD for Prescriptions."""
    queryset = Prescription.objects.all().select_related('visit', 'patient', 'doctor')
    serializer_class = PrescriptionSerializer

class LabReportViewSet(viewsets.ModelViewSet):
    """CRUD for Lab Reports."""
    queryset = LabReport.objects.all().select_related('patient', 'hospital')
    serializer_class = LabReportSerializer

class VaccinationViewSet(viewsets.ModelViewSet):
    """
    CRUD for Vaccinations. Includes a bulk_update action for efficiency.
    """
    queryset = Vaccination.objects.all().select_related('patient')
    serializer_class = VaccinationSerializer

    @action(detail=False, methods=['post'], url_path='bulk_update')
    def bulk_update(self, request):
        """
        Replaces all vaccination records for a patient in one atomic transaction.
        Prevents multiple sequential network calls from the frontend.
        """
        patient_id = request.data.get('patient')
        vaccinations_data = request.data.get('vaccinations', [])

        if not patient_id:
            return Response({'error': 'patient ID is required'}, status=400)

        valid_data = []
        for v in vaccinations_data:
            if v.get('vaccine_name'):
                # Pass patient ID so serializer can validate the model instance completely
                ser = VaccinationSerializer(data={**v, 'patient': patient_id})
                ser.is_valid(raise_exception=True)
                valid_data.append(ser.validated_data)

        with transaction.atomic():
            # Atomically delete and recreate to keep the list in sync
            Vaccination.objects.filter(patient_id=patient_id).delete()
            if valid_data:
                Vaccination.objects.bulk_create([Vaccination(**d) for d in valid_data])

        return Response({'status': 'success', 'count': len(valid_data)})
