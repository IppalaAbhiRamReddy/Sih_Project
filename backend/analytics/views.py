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

    def get_cached_result(self, metric_name, hospital_id, validity_hours=6):
        six_hours_ago = timezone.now() - timezone.timedelta(hours=validity_hours)
        return AIAnalytics.objects.filter(
            hospital_id=hospital_id,
            metric_name=metric_name,
            calculated_at__gte=six_hours_ago
        ).order_by('-calculated_at').first()

    def set_cached_result(self, metric_name, hospital_id, value):
        AIAnalytics.objects.create(
            hospital_id=hospital_id,
            metric_name=metric_name,
            metric_date=timezone.now().date(),
            value=value
        )

    @action(detail=False, methods=['get'])
    def forecast(self, request):
        hospital_id = self.get_hospital_id()
        if not hospital_id:
            return response.Response({"error": "Hospital ID not found for user"}, status=400)

        time_range = request.query_params.get('range', '7d')
        cache_key = f"forecast_{time_range}"
        
        cached = self.get_cached_result(cache_key, hospital_id)
        if cached:
            return response.Response(cached.value)

        forecaster = ARIMAForecaster(hospital_id=hospital_id)
        
        # Support dynamic steps based on range (default 7 days)
        steps_map = {'7d': 7, '30d': 30, '90days': 30, '3m': 30}
        steps = steps_map.get(time_range, 7)
        
        forecast_data = forecaster.forecast_by_department(steps=steps)
        load_status = forecaster.get_department_load_status()
        
        result = {
            "forecast": forecast_data,
            "status": load_status
        }
        
        self.set_cached_result(cache_key, hospital_id, result)
        return response.Response(result)

    @action(detail=False, methods=['get'])
    def disease_distribution(self, request):
        hospital_id = self.get_hospital_id()
        if not hospital_id:
            return response.Response({"error": "Hospital ID not found for user"}, status=400)
        
        time_range = request.query_params.get('range', '30days')
        department_id = request.query_params.get('dept', 'all')
        cache_key = f"disease_dist_{time_range}_{department_id}"
        
        cached = self.get_cached_result(cache_key, hospital_id)
        if cached:
            return response.Response(cached.value)

        classifier = DiseaseClassifier(hospital_id=hospital_id)
        
        # Convert range string to days
        days_map = {'7days': 7, '30days': 30, '90days': 90, '7d': 7, '30d': 30, '3m': 90, '6m': 180}
        days = days_map.get(time_range, 30)
        
        distribution = classifier.predict_distribution(days=days, department_id=department_id)
        
        self.set_cached_result(cache_key, hospital_id, distribution)
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
