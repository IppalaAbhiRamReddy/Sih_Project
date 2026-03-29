# ML Models Documentation - Hospital Analytics Engine

This document provides a detailed overview of the Machine Learning models used in the Digital Health Care Record System for predictive analytics and hospital management.

---

## 1. Patient Load Forecasting (ARIMA)

### Overview

The Patient Load Forecaster predicts the number of patient visits for each department and the hospital as a whole. This helps in resource allocation, staff scheduling, and identifying potential bottlenecks.

### Complete Workflow

1.  **Data Extraction**: Historical visit data is fetched from the `clinical.Visit` model (up to 180 days).
2.  **Aggregation**: Visits are grouped by date and floor-clamped to midnight to create a daily time series of visit counts.
3.  **Preprocessing**: Missing dates are filled with zero-counts to ensure a continuous time series, which is a requirement for ARIMA.
4.  **Modeling**:
    - **Core Model**: ARIMA (AutoRegressive Integrated Moving Average).
    - **Parameters**: `order=(7, 1, 1)`.
      - `p=7`: Uses the last 7 days of data (weekly seasonality).
      - `d=1`: Differencing once to make the data stationary.
      - `q=1`: A moving average window of 1 day to smooth out noise.
5.  **Forecasting**: The model generates a point forecast for the next $N$ days (e.g., 7 days or 30 days).
6.  **Safety Guard**: Forecasted values are rounded and clamped to a minimum of 0 (since negative visits are impossible).
7.  **Output**: Formatted as JSON for the frontend to render in line charts and load status indicators.

### Why ARIMA for Patient Load?

While many ML models can predict numbers, ARIMA was chosen because patient visit data is a **Classical Time-Series**.

- **Sequential Dependency**: Unlike standard regression where data points are independent, patient load today is heavily influenced by the load from previous days. ARIMA is mathematically built to handle this "Autocorrelation".
- **Stationarity**: Hospital data often has trends (e.g., growing patient base). ARIMA's "Integrated" (d) component handles this by looking at the _change_ between days rather than just raw numbers.
- **Data Efficiency**: We don't have the millions of rows needed for Deep Learning (LSTMs). ARIMA provides high accuracy with just 6 months of historical daily data.

### Model Metrics & Meanings

When evaluating the forecaster via the `/evaluate_models/` endpoint, the following metrics are used:

| Metric   | Full Name                      | Meaning                                                                                        |
| :------- | :----------------------------- | :--------------------------------------------------------------------------------------------- |
| **MAE**  | Mean Absolute Error            | The average absolute difference between predicted and actual visits. Smaller is better.        |
| **RMSE** | Root Mean Square Error         | Similar to MAE but penalizes larger errors more heavily. Useful for identifying "huge misses". |
| **MAPE** | Mean Absolute Percentage Error | The average percentage error. A MAPE of 10% means the model is, on average, 90% accurate.      |

---

## 2. Disease Distribution Prediction (Random Forest)

### Overview

The Disease Classifier analyzes patient demographics and visit timing to predict the likely distribution of diseases/diagnoses. This enables "Disease Trend Distribution" analytics.

### Complete Workflow

1.  **Data Collection**: Collects `diagnosis`, `patient__age`, `patient__gender`, and `visit_date`.
2.  **Feature Engineering**:
    - `month`: Captures seasonal disease trends (e.g., Flu in winter).
    - `day_of_week`: Captures daily patterns.
    - `age`: Numerical feature for demographic correlation.
    - `gender_enc`: Encodes gender (Male=0, Female=1, Other=2) as a categorical feature.
3.  **Modeling**:
    - **Model**: RandomForestClassifier with 100 estimators.
    - **Logic**: Instead of a single "hard" prediction, the model uses `predict_proba` to calculate the probability distribution across all known diagnoses in a specific context (Age, Gender, Month).
4.  **Output**: Returns the top 5 predicted diseases as a percentage distribution for the frontend pie charts.

### Why Random Forest for Disease Trends?

Predicting diseases based on age and gender is a **Feature-Based Classification** problem, not a time-series one.

- **Non-Linear Relationships**: Diseases don't follow a straight line. For example, "Fever" might spike in both small children (age 0-5) and the elderly (age 70+). Random Forest handles these complex, "wiggly" patterns by branching its decision trees.
- **Interdependency**: A disease might be common in "Males in Winter" but not "Females in Winter". Random Forest naturally captures these interactions between features (Gender + Month).
- **Handling Categorical Data**: We deal with genders and diagnoses (text). Random Forest is robust at handling these once encoded, unlike models like SVM which are very sensitive to how data is scaled.

### Model Metrics & Meanings

| Metric       | Meaning                                                                                                                                             |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Accuracy** | The percentage of diagnoses the model correctly predicted during the test split.                                                                    |
| **F1-Score** | The harmonic mean of Precision and Recall. It is more reliable than Accuracy when some diseases are much more common than others (imbalanced data). |
| **Samples**  | The total number of historical records used to train and test the model.                                                                            |

---

## 3. Core Libraries: The Tech Stack

The analytics engine relies on the industry-standard "Python Data Science Stack". Below is a detailed breakdown of why each library was chosen and how it is used.

### 📊 Pandas

**Purpose**: Data Manipulation & Time-Series Alignment.

- **Why we use it**: Raw data from the Django database comes in a record-format (list of dictionaries). ML models, however, require structured arrays or DataFrames.
- **Key Usage**:
  - **Resampling**: Converting individual hospital visits into a daily count series using `df.groupby()`.
  - **Reindexing**: Ensuring every single day in a 180-day window exists (even if there were 0 visits) using `pd.date_range()`. This is critical for the ARIMA model as it cannot handle "time gaps".
  - **Timezone Handling**: Safe conversion between Django's UTC timestamps and localized dates.

### 🤖 Scikit-Learn

**Purpose**: Machine Learning Framework & Utilities.

- **Why we use it**: It is the gold standard for traditional machine learning. It provides consistent APIs for training, predicting, and evaluating models.
- **Key Usage**:
  - **RandomForestClassifier**: Used for disease classification. It manages the "ensemble" logic (grouping 100 decision trees) automatically.
  - **Train-Test Split**: The `train_test_split` utility ensures we validly evaluate the disease model on data it hasn't seen during training.
  - **Evaluation Metrics**: Provides the built-in logic for `accuracy_score` and `f1_score`, ensuring mathematical precision in our reports.

### 📈 Statsmodels

**Purpose**: Advanced Statistical Modeling.

- **Why we use it**: While Scikit-Learn focuses on general ML, `statsmodels` is specialized for statistical tests and time-series analysis like ARIMA.
- **Key Usage**:
  - **ARIMA Implementation**: Provides the complex mathematical solver for the AutoRegressive (p), Integrated (d), and Moving Average (q) components of the patient load forecast.
  - **Statistical Fitting**: It calculates the "coefficients" for the 7-day seasonality window used in our department forecasts.

### 🔢 NumPy

**Purpose**: High-Performance Numerical Operations.

- **Why we use it**: Most ML libraries (like Scikit-Learn and Pandas) are built on top of NumPy. It allows us to perform mathematical operations on huge datasets with C-level speed.
- **Key Usage**:
  - **Vectorized Math**: Calculating MAE (Mean Absolute Error) and RMSE (Root Mean Square Error) using `np.mean()`, `np.abs()`, and `np.sqrt()`.
  - **Data Shapes**: Managing the multi-dimensional arrays required by the Random Forest model's `predict_proba()` function.

---

## 4. System Integration & Caching

### API Endpoint: `/api/analytics/forecast/`

- **Caching**: Predictions are cached for 6 hours in the `AIAnalytics` model. This prevents expensive re-training of models on every page load.
- **Dynamic Range**: Supports different time horizons (`7d`, `30d`, `90d`) which adjusts the model's forecasting "steps".
- **Department Filtering**: The engine can run $N$ independent models (one per department) to provide granular insights.

### Load Status Logic

The system translates raw forecasts into actionable statuses:

- **High (Red)**: > 80% Capacity
- **Moderate (Yellow)**: > 60% Capacity
- **Normal (Green)**: < 60% Capacity
- _Capacity is calculated as: `Active Doctors _ 15 patients/day`.\*
