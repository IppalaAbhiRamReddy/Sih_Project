from rest_framework import viewsets
from .models import AIAnalytics
from .serializers import AIAnalyticsSerializer

class AIAnalyticsViewSet(viewsets.ModelViewSet):
    queryset = AIAnalytics.objects.all()
    serializer_class = AIAnalyticsSerializer
