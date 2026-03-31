"""
Views for the Analytics app.
Provides AI-driven forecasting and disease distribution analytics.
Utilizes ARIMA and classification models to generate hospital-specific metrics.
"""
from rest_framework import viewsets, response, permissions
from rest_framework.decorators import action
from .models import AIAnalytics
from .serializers import AIAnalyticsSerializer
from .ml_models import ARIMAForecaster, DiseaseClassifier
from django.utils import timezone
from users.models import Profile # To get hospital_id from user profile

class AIAnalyticsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for AI Analytics results.
    Includes custom actions for forcasting and disease distribution analysis.
    Implements a simple caching mechanism using the AIAnalytics model.
    """
    queryset = AIAnalytics.objects.all()
    serializer_class = AIAnalyticsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_hospital_id(self):
        # Helper to get hospital_id from the logged-in user's profile
        user = self.request.user
        try:
            profile = user.profile
            return profile.hospital_id
        except:
            return None

    def _parse_range(self, range_param, default_days=7):
        """
        Safely parses range strings into integers.
        Supports '7days', '30d', '30days', '7', etc.
        """
        if not range_param:
            return default_days
        
        # Hardcoded mappings for consistency
        VALID_RANGES = {
            '7d': 7, '7days': 7,
            '30d': 30, '30days': 30,
            '90d': 90, '90days': 90, '3m': 90,
            '180d': 180, '180days': 180, '6m': 180
        }
        
        if range_param in VALID_RANGES:
            return VALID_RANGES[range_param]
            
        # Regex-style fallback for mixed strings like "14days"
        import re
        match = re.search(r'(\d+)', str(range_param))
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                pass
                
        return default_days

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
        """
        Generates volume forecasts by department using the ARIMAForecaster.
        Supports '7d', '30d', and other ranges via query parameters.
        Includes robust validation and error handling as per diagnostic report.
        """
        try:
            hospital_id = self.get_hospital_id()
            if not hospital_id:
                return response.Response({"error": "Hospital ID not found for user session."}, status=401)

            range_param = request.query_params.get('range', '7days')
            days = self._parse_range(range_param, default_days=7)
            
            # Absolute bounds for forecast range (7 days to 1 year)
            days = max(7, min(365, days))

            cache_key = f"forecast_{days}days"
            
            # Check cache to avoid heavy forecasting computations
            cached = self.get_cached_result(cache_key, hospital_id)
            if cached:
                return response.Response(cached.value)

            forecaster = ARIMAForecaster(hospital_id=hospital_id)
            
            # Core computation
            forecast_results = forecaster.forecast_by_department(steps=days)
            
            # Handle cases with no data safely (return 200 with empty forecast instead of 500)
            if forecast_results is None or not forecast_results.get('forecast'):
                return response.Response({
                    "forecast": [], 
                    "status": [],
                    "metadata": {
                        "confidence": 0,
                        "is_learning": True,
                        "message": "No historical data available for analysis"
                    }
                }, status=200)

            # Analyze load status (capacity vs expected volume)
            load_status = forecaster.get_department_load_status(forecast_data=forecast_results)
            
            result = {
                "forecast": forecast_results['forecast'],
                "status": load_status,
                "metadata": forecast_results['metadata']
            }
            
            self.set_cached_result(cache_key, hospital_id, result)
            return response.Response(result)
            
        except Exception as e:
            import traceback
            print(f"[AIAnalyticsViewSet] Forecast failed: {str(e)}")
            traceback.print_exc()
            return response.Response({
                "error": "Failed to generate AI analytics forecast",
                "details": str(e)
            }, status=500)

    @action(detail=False, methods=['get'])
    def disease_distribution(self, request):
        """
        Analyzes and predicts disease distribution within the hospital.
        Optionally filters results by department.
        """
        try:
            hospital_id = self.get_hospital_id()
            if not hospital_id:
                return response.Response({"error": "Hospital ID not found for user"}, status=400)
            
            range_param = request.query_params.get('range', '30days')
            department_id = request.query_params.get('dept', 'all')
            cache_key = f"disease_dist_{range_param}_{department_id}"
            
            cached = self.get_cached_result(cache_key, hospital_id)
            if cached:
                return response.Response(cached.value)

            classifier = DiseaseClassifier(hospital_id=hospital_id)
            
            # Use the new robust parser
            days = self._parse_range(range_param, default_days=30)
            
            result = classifier.get_distribution(days=days, department_id=department_id)
            
            self.set_cached_result(cache_key, hospital_id, result)
            return response.Response(result)
        except Exception as e:
            return response.Response({"error": f"Analysis failed: {str(e)}"}, status=500)

    @action(detail=False, methods=['get'])
    def evaluate_models(self, request):
        """
        Returns performance evaluation metrics (RMSE, Accuracy, etc.) for the ML models.
        """
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
