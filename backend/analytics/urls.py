from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIAnalyticsViewSet

router = DefaultRouter()
router.register(r'trends', AIAnalyticsViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
