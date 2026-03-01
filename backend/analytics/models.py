from django.db import models
from hospitals.models import Hospital
import uuid

class AIAnalytics(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE)
    metric_name = models.CharField(max_length=255)
    metric_date = models.DateField()
    value = models.JSONField()
    calculated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_analytics'

    def __str__(self):
        return f"{self.metric_name} - {self.hospital.name}"
