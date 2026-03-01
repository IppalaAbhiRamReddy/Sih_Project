from django.urls import path
from .views import LoginView, PasswordResetRequestView, PasswordResetConfirmView


urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]
