import pandas as pd
import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from clinical.models import Visit
from django.utils import timezone
from datetime import timedelta

class KNNClassifier:
    def __init__(self, hospital_id):
        self.hospital_id = hospital_id

    def get_distribution_data(self, days=90):
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        visits = Visit.objects.filter(
            hospital_id=self.hospital_id,
            visit_date__range=(start_date, end_date)
        ).values('visit_date', 'diagnosis')
        
        if not visits:
            return pd.DataFrame()

        df = pd.DataFrame(list(visits))
        df['visit_date'] = pd.to_datetime(df['visit_date'])
        
        # Features for KNN: Month, Day of Week
        df['month'] = df['visit_date'].dt.month
        df['day_of_week'] = df['visit_date'].dt.dayofweek
        
        return df

    def predict_distribution(self, target_date=None):
        if target_date is None:
            target_date = timezone.now()
            
        df = self.get_distribution_data()
        if df.empty or len(df) < 20: # Minimum data threshold
            return self.get_default_distribution()

        try:
            # Simple approach: Find K nearest days in history and average their distributions
            # X: [Month, DayOfWeek], y: Diagnosis
            X = df[['month', 'day_of_week']].values
            y = df['diagnosis'].values
            
            # Use KNN to find nearest neighbors for the target date context
            target_month = target_date.month
            target_dow = target_date.dayofweek
            
            k = min(5, len(df))
            knn = KNeighborsClassifier(n_neighbors=k)
            knn.fit(X, y)
            
            # Find the K nearest neighbors for the current context
            distances, indices = knn.kneighbors([[target_month, target_dow]])
            
            # Aggregate diagnoses from these neighbors
            nearby_diagnoses = df.iloc[indices[0]]['diagnosis']
            dist = nearby_diagnoses.value_counts(normalize=True) * 100
            
            # Format for frontend
            colors = ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F87171']
            result = []
            for i, (name, value) in enumerate(dist.items()):
                if i >= 5: break # Only top 5
                result.append({
                    'name': name,
                    'value': round(float(value), 1),
                    'color': colors[i % len(colors)]
                })
            
            return result
        except Exception as e:
            print(f"KNN Prediction Error: {e}")
            return self.get_default_distribution()

    def get_default_distribution(self):
        return [
            { "name": 'Fever', "value": 40, "color": '#60A5FA' },
            { "name": 'Hypertension', "value": 30, "color": '#34D399' },
            { "name": 'Diabetes', "value": 20, "color": '#FBBF24' },
            { "name": 'OTHERS', "value": 10, "color": '#A78BFA' },
        ]
