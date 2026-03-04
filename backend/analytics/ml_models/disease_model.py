import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
from clinical.models import Visit
from django.utils import timezone
from datetime import timedelta

class DiseaseClassifier:
    def __init__(self, hospital_id):
        self.hospital_id = hospital_id

    def get_distribution_data(self, days=180):
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        visits = Visit.objects.filter(
            hospital_id=self.hospital_id,
            visit_date__range=(start_date, end_date)
        ).values('visit_date', 'diagnosis', 'patient__age', 'patient__gender')
        
        if not visits:
            return pd.DataFrame()

        df = pd.DataFrame(list(visits))
        df['visit_date'] = pd.to_datetime(df['visit_date'])
        
        # Features: Month, Day of Week, Age, Gender
        df['month'] = df['visit_date'].dt.month
        df['day_of_week'] = df['visit_date'].dt.dayofweek
        
        # Encode Gender: Male=0, Female=1, Other=2
        gender_map = {'Male': 0, 'Female': 1, 'Other': 2}
        df['gender_enc'] = df['patient__gender'].map(gender_map).fillna(2)
        df['age'] = df['patient__age'].fillna(df['patient__age'].mean() if not df['patient__age'].isnull().all() else 30)
        
        return df

    def predict_distribution(self, target_date=None, context_age=30, context_gender='Male'):
        """
        Predict distribution based on date context and optional demographics.
        """
        if target_date is None:
            target_date = timezone.now()
            
        df = self.get_distribution_data()
        if df.empty or len(df) < 20:
            return self.get_default_distribution()

        try:
            # Features for RF
            features = ['month', 'day_of_week', 'gender_enc', 'age']
            X = df[features].values
            y = df['diagnosis'].values
            
            rf = RandomForestClassifier(n_estimators=100, random_state=42)
            rf.fit(X, y)
            
            # Predict context
            target_month = target_date.month
            target_dow = target_date.dayofweek
            gender_enc = {'Male': 0, 'Female': 1, 'Other': 2}.get(context_gender, 2)
            
            # For the distribution, we want to see what's likely in this context
            # We can predict probabilities for the classes
            probs = rf.predict_proba([[target_month, target_dow, gender_enc, context_age]])[0]
            classes = rf.classes_
            
            # Combine and sort
            dist = pd.Series(probs, index=classes).sort_values(ascending=False) * 100
            
            # Format for frontend
            colors = ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F87171']
            result = []
            for i, (name, value) in enumerate(dist.items()):
                if i >= 5 or value < 0.1: break # Only top 5 and non-zero
                result.append({
                    'name': name,
                    'value': round(float(value), 1),
                    'color': colors[i % len(colors)]
                })
            
            return result
        except Exception as e:
            print(f"Disease Prediction Error: {e}")
            return self.get_default_distribution()

    def evaluate(self):
        """
        Evaluate the Random Forest model using train/test split.
        """
        df = self.get_distribution_data(days=180)
        if df.empty or len(df) < 30:
            return {"error": "Insufficient data for evaluation"}

        try:
            features = ['month', 'day_of_week', 'gender_enc', 'age']
            X = df[features].values
            y = df['diagnosis'].values

            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

            rf = RandomForestClassifier(n_estimators=100, random_state=42)
            rf.fit(X_train, y_train)

            y_pred = rf.predict(X_test)
            
            accuracy = accuracy_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred, average='weighted')

            return {
                "accuracy": round(float(accuracy), 2),
                "f1_score": round(float(f1), 2),
                "samples": len(df),
                "status": "Success"
            }
        except Exception as e:
            return {"error": str(e), "status": "Failed"}

    def get_default_distribution(self):
        return [
            { "name": 'Fever', "value": 40, "color": '#60A5FA' },
            { "name": 'Hypertension', "value": 30, "color": '#34D399' },
            { "name": 'Diabetes', "value": 20, "color": '#FBBF24' },
            { "name": 'OTHERS', "value": 10, "color": '#A78BFA' },
        ]
