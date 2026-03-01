from rest_framework import serializers
from .models import AIAnalytics

class AIAnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAnalytics
        fields = '__all__'
