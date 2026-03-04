from rest_framework import viewsets, response
from rest_framework.decorators import action
from .models import AIAnalytics
from .serializers import AIAnalyticsSerializer
from .ml_models import ARIMAForecaster, DiseaseClassifier
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
        
        forecast_data = forecaster.forecast_by_department(steps=7)
        load_status = forecaster.get_department_load_status()
        
        return response.Response({
            "forecast": forecast_data,
            "status": load_status
        })

    @action(detail=False, methods=['get'])
    def disease_distribution(self, request):
        hospital_id = self.get_hospital_id()
        if not hospital_id:
            return response.Response({"error": "Hospital ID not found for user"}, status=400)
        
        classifier = DiseaseClassifier(hospital_id=hospital_id)
        distribution = classifier.predict_distribution()
        
        return response.Response(distribution)

    @action(detail=False, methods=['get'])
    def evaluate_models(self, request):
        hospital_id = self.get_hospital_id()
        if not hospital_id:
            return response.Response({"error": "Hospital ID not found for user"}, status=400)

        forecaster = ARIMAForecaster(hospital_id=hospital_id)
        classifier = DiseaseClassifier(hospital_id=hospital_id)

        metrics = {
            "arima_forecasting": forecaster.evaluate(),
            "disease_classification": classifier.evaluate()
        }

        return response.Response(metrics)
