from rest_framework import viewsets, response
from rest_framework.decorators import action
from .models import AIAnalytics
from .serializers import AIAnalyticsSerializer
from .ml_models import ARIMAForecaster, KNNClassifier
from django.utils import timezone
from users.models import Profile # To get hospital_id from user profile

class AIAnalyticsViewSet(viewsets.ModelViewSet):
    queryset = AIAnalytics.objects.all()
    serializer_class = AIAnalyticsSerializer

    def get_hospital_id(self):
        # Helper to get hospital_id from the logged-in user's profile
        user = self.request.user
        try:
            profile = user.profile
            return profile.hospital_id
        except:
            return None

    @action(detail=False, methods=['get'])
    def forecast(self, request):
        hospital_id = self.get_hospital_id()
        if not hospital_id:
            return response.Response({"error": "Hospital ID not found for user"}, status=400)

        forecaster = ARIMAForecaster(hospital_id=hospital_id)
        # We can either return cached results from AIAnalytics model 
        # or calculate on the fly for small datasets/testing.
        # For now, let's calculate on the fly to see it working.
        forecast_data = forecaster.forecast_by_department(steps=7)
        
        return response.Response(forecast_data)

    @action(detail=False, methods=['get'])
    def disease_distribution(self, request):
        hospital_id = self.get_hospital_id()
        if not hospital_id:
            return response.Response({"error": "Hospital ID not found for user"}, status=400)
        
        classifier = KNNClassifier(hospital_id=hospital_id)
        distribution = classifier.predict_distribution()
        
        return response.Response(distribution)
