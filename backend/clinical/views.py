from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Visit, Prescription, LabReport, Vaccination
from .serializers import (
    VisitSerializer, DetailedVisitSerializer, PrescriptionSerializer, 
    LabReportSerializer, VaccinationSerializer
)

class VisitViewSet(viewsets.ModelViewSet):
    queryset = Visit.objects.all()
    serializer_class = VisitSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def doctor_stats(self, request):
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response({'error': 'doctor_id is required'}, status=400)
        
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        base_qs = Visit.objects.filter(doctor_id=doctor_id)
        
        return Response({
            'today': base_qs.filter(visit_date__gte=today_start).count(),
            'week': base_qs.filter(visit_date__gte=week_ago).count(),
            'month': base_qs.filter(visit_date__gte=month_ago).count(),
            'total': base_qs.count(),
        })

    @action(detail=False, methods=['get'])
    def recent_visits(self, request):
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id:
            return Response({'error': 'doctor_id is required'}, status=400)
            
        visits = Visit.objects.filter(doctor_id=doctor_id).order_by('-visit_date')[:50]
        serializer = DetailedVisitSerializer(visits, many=True)
        return Response(serializer.data)

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer

class LabReportViewSet(viewsets.ModelViewSet):
    queryset = LabReport.objects.all()
    serializer_class = LabReportSerializer

class VaccinationViewSet(viewsets.ModelViewSet):
    queryset = Vaccination.objects.all()
    serializer_class = VaccinationSerializer
