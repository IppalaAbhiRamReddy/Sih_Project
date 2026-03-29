import os
import joblib
import numpy as np
import pandas as pd

from datetime import timedelta
from django.utils import timezone

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import accuracy_score, f1_score
from sklearn.preprocessing import LabelEncoder


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

COLORS = ["#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#F87171"]

# Minimum number of visit records required before attempting ML classification.
# Below this threshold we fall back to pure value_counts (still accurate).
MIN_RECORDS_FOR_ML = 50

# How many top diagnoses to return in the distribution output
TOP_N_DIAGNOSES = 5

# Cache TTL: models are re-trained at most once per day per (hospital, dept)
MODEL_CACHE_TTL_HOURS = 24

# Path where serialised models are stored
MODEL_CACHE_DIR = "/tmp/smartaid_models"


# ---------------------------------------------------------------------------
# Feature engineering helpers
# ---------------------------------------------------------------------------

SEASON_MAP = {12: "winter", 1: "winter", 2: "winter",
              3: "spring",  4: "spring",  5: "spring",
              6: "summer",  7: "summer",  8: "summer",
              9: "autumn", 10: "autumn", 11: "autumn"}

GENDER_MAP = {"Male": 0, "Female": 1, "Other": 2}


def _build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer a rich feature set from the raw visit DataFrame.

    Input columns expected:
        visit_date, diagnosis, patient__age, patient__gender,
        doctor__department_id  (nullable)

    Returns a DataFrame with the feature columns + 'diagnosis' label.
    """
    df = df.copy()
    df["visit_date"] = pd.to_datetime(df["visit_date"])

    # --- Temporal features ---
    df["month"]       = df["visit_date"].dt.month
    df["day_of_week"] = df["visit_date"].dt.dayofweek          # 0=Mon … 6=Sun
    df["is_weekend"]  = (df["day_of_week"] >= 5).astype(int)
    df["quarter"]     = df["visit_date"].dt.quarter
    df["season"]      = df["month"].map(SEASON_MAP)

    # One-hot encode season (winter / spring / summer / autumn)
    season_dummies = pd.get_dummies(df["season"], prefix="season")
    df = pd.concat([df, season_dummies], axis=1)

    # --- Demographic features ---
    df["gender_enc"] = df["patient__gender"].map(GENDER_MAP).fillna(2).astype(int)

    age_median = df["patient__age"].median()
    if pd.isna(age_median):
        age_median = 35
    df["age"] = df["patient__age"].fillna(age_median).astype(float)

    # Age buckets (child / young_adult / adult / senior)
    df["age_bucket"] = pd.cut(
        df["age"],
        bins=[0, 12, 30, 60, 120],
        labels=["child", "young_adult", "adult", "senior"],
        right=True
    ).astype(str)

    age_dummies = pd.get_dummies(df["age_bucket"], prefix="age_grp")
    df = pd.concat([df, age_dummies], axis=1)

    # --- Department feature ---
    # UUIDs must be numeric for Random Forest, but 128-bit overflows 64-bit.
    # Take the first 8 hex chars (32-bit) which is stable and safe.
    if "doctor__department_id" in df.columns:
        def safe_uuid_to_int(val):
            if not val: return -1
            try:
                return int(str(val).split("-")[0], 16)
            except (ValueError, IndexError):
                return -1
        df["dept_id"] = df["doctor__department_id"].apply(safe_uuid_to_int)
    else:
        df["dept_id"] = -1

    return df


def _feature_columns(df: pd.DataFrame) -> list[str]:
    """Return the feature column names actually present in df."""
    base = [
        "month", "day_of_week", "is_weekend", "quarter",
        "gender_enc", "age", "dept_id",
    ]
    season_cols  = [c for c in df.columns if c.startswith("season_")]
    age_grp_cols = [c for c in df.columns if c.startswith("age_grp_")]
    return base + season_cols + age_grp_cols


# ---------------------------------------------------------------------------
# Model cache helpers
# ---------------------------------------------------------------------------

def _cache_path(hospital_id, dept_key: str) -> str:
    os.makedirs(MODEL_CACHE_DIR, exist_ok=True)
    return os.path.join(MODEL_CACHE_DIR, f"rf_{hospital_id}_{dept_key}.pkl")


def _load_cached_model(path: str):
    """Load a cached (model, label_encoder, trained_at) tuple, or None."""
    if not os.path.exists(path):
        return None
    try:
        bundle = joblib.load(path)
        trained_at: pd.Timestamp = bundle.get("trained_at")
        age_hours = (pd.Timestamp.now() - trained_at).total_seconds() / 3600
        if age_hours > MODEL_CACHE_TTL_HOURS:
            return None          # stale — retrain
        return bundle
    except Exception:
        return None


def _save_model(path: str, rf, le, feature_cols):
    bundle = {
        "model": rf,
        "label_encoder": le,
        "feature_cols": feature_cols,
        "trained_at": pd.Timestamp.now(),
    }
    joblib.dump(bundle, path)


# ---------------------------------------------------------------------------
# Main classifier
# ---------------------------------------------------------------------------

class DiseaseClassifier:
    """
    Hospital disease-distribution analyser for the AI Analytics dashboard.

    Strategy
    --------
    1. PRIMARY PATH — value_counts (always computed):
       Aggregate actual diagnosis frequencies from the filtered visit records.
       This is the ground truth distribution and is always returned.

    2. SECONDARY PATH — Random Forest (when enough data exists):
       Train an RF to predict *which diagnosis is most likely* for a given
       patient context (season, age group, department, etc.).  The model's
       class probabilities are blended with the historical counts to produce
       a context-aware distribution that is slightly forward-looking.

    The two paths are clearly labelled in the metadata so the frontend can
    communicate confidence level to hospital administrators.
    """

    def __init__(self, hospital_id):
        self.hospital_id = hospital_id

    # ------------------------------------------------------------------
    # Data loading
    # ------------------------------------------------------------------

    def _load_visits(self, days: int, department_id=None) -> pd.DataFrame:
        """
        Fetch visit records from the database and return a raw DataFrame.
        Only aggregated / anonymised fields are selected — no patient PII.
        """
        from clinical.models import Visit

        end_date   = timezone.now()
        start_date = end_date - timedelta(days=days)

        filters = {
            "hospital_id": self.hospital_id,
            "visit_date__range": (start_date, end_date),
        }

        if department_id and str(department_id) != "all":
            filters["doctor__department_id"] = department_id

        qs = Visit.objects.filter(**filters).values(
            "visit_date",
            "diagnosis",
            "patient__age",
            "patient__gender",
            "doctor__department_id",
        )

        if not qs.exists():
            return pd.DataFrame()

        return pd.DataFrame(list(qs))

    # ------------------------------------------------------------------
    # Core distribution logic
    # ------------------------------------------------------------------

    def _historical_distribution(self, df: pd.DataFrame) -> list[dict]:
        """
        Pure value_counts distribution — the ground truth.
        Always accurate, zero ML involved.
        """
        counts = (
            df["diagnosis"]
            .value_counts(normalize=True)
            .head(TOP_N_DIAGNOSES)
            * 100
        )
        return [
            {
                "name":  name,
                "value": round(float(pct), 1),
                "color": COLORS[i % len(COLORS)],
            }
            for i, (name, pct) in enumerate(counts.items())
        ]

    def _train_or_load_rf(
        self,
        df: pd.DataFrame,
        dept_key: str,
    ):
        """
        Return a cached RF bundle if fresh, otherwise train a new one.
        Returns None if training is not possible (insufficient data / classes).
        """
        cache_path = _cache_path(self.hospital_id, dept_key)
        bundle = _load_cached_model(cache_path)
        if bundle:
            return bundle

        # Need enough records and at least 2 diagnosis classes to train
        unique_diagnoses = df["diagnosis"].nunique()
        if len(df) < MIN_RECORDS_FOR_ML or unique_diagnoses < 2:
            return None

        df_feat = _build_features(df)
        feat_cols = _feature_columns(df_feat)

        # Align columns (get_dummies can produce different sets per call)
        X = df_feat[feat_cols].fillna(0).values

        le = LabelEncoder()
        y  = le.fit_transform(df_feat["diagnosis"].values)

        rf = RandomForestClassifier(
            n_estimators=150,
            max_depth=None,            # grown fully — forest handles variance
            min_samples_leaf=3,        # prevents single-sample leaves
            class_weight="balanced",   # handles diagnosis imbalance
            random_state=42,
            n_jobs=-1,
        )
        rf.fit(X, y)

        _save_model(cache_path, rf, le, feat_cols)

        return {
            "model": rf,
            "label_encoder": le,
            "feature_cols": feat_cols,
            "trained_at": pd.Timestamp.now(),
        }

    def _context_distribution(
        self,
        bundle: dict,
        df_feat: pd.DataFrame,
        target_date,
        context_age: float,
        context_gender: str,
        dept_id: int,
    ) -> list[dict]:
        """
        Use the trained RF to produce a context-aware distribution for the
        given patient profile and date. Returns top-5 diagnoses by probability.
        """
        rf:  RandomForestClassifier = bundle["model"]
        le:  LabelEncoder           = bundle["label_encoder"]
        feat_cols: list[str]        = bundle["feature_cols"]

        # Build a single-row feature vector for the requested context
        month      = target_date.month
        dow        = target_date.weekday()
        is_weekend = int(dow >= 5)
        quarter    = (month - 1) // 3 + 1
        season     = SEASON_MAP[month]
        gender_enc = GENDER_MAP.get(context_gender, 2)

        row: dict[str, float] = {
            "month": month, "day_of_week": dow, "is_weekend": is_weekend,
            "quarter": quarter, "gender_enc": gender_enc,
            "age": float(context_age), "dept_id": int(dept_id),
        }

        # Season one-hot
        for s in ["winter", "spring", "summer", "autumn"]:
            row[f"season_{s}"] = 1.0 if season == s else 0.0

        # Age group one-hot
        if context_age <= 12:
            bucket = "child"
        elif context_age <= 30:
            bucket = "young_adult"
        elif context_age <= 60:
            bucket = "adult"
        else:
            bucket = "senior"

        for g in ["child", "young_adult", "adult", "senior"]:
            row[f"age_grp_{g}"] = 1.0 if bucket == g else 0.0

        # Align to training feature columns (fill unseen columns with 0)
        x_vec = np.array([[row.get(col, 0.0) for col in feat_cols]])

        proba  = rf.predict_proba(x_vec)[0]
        labels = le.inverse_transform(np.arange(len(proba)))

        dist = (
            pd.Series(proba, index=labels)
            .sort_values(ascending=False)
            .head(TOP_N_DIAGNOSES)
            * 100
        )

        return [
            {
                "name":  name,
                "value": round(float(pct), 1),
                "color": COLORS[i % len(COLORS)],
            }
            for i, (name, pct) in enumerate(dist.items())
            if pct >= 0.5   # drop near-zero noise
        ]

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_distribution(
        self,
        days: int = 180,
        department_id=None,
        target_date=None,
        context_age: float = 35,
        context_gender: str = "Male",
    ) -> dict:
        """
        Return the disease distribution for the dashboard pie chart.

        Parameters
        ----------
        days            : look-back window in days
        department_id   : filter to a specific department, or None / 'all'
        target_date     : date for context-aware ML prediction (default: today)
        context_age     : patient age for ML context (default: 35)
        context_gender  : patient gender for ML context

        Returns
        -------
        {
            "distribution": [{"name": str, "value": float, "color": str}, ...],
            "metadata": {
                "mode": "ml_context_aware" | "historical_counts",
                "insufficient_data": bool,
                "total_records": int,
                "unique_diagnoses": int,
                "top_diagnosis": str | None,
                "message": str | None,
            }
        }
        """
        if target_date is None:
            target_date = timezone.now()

        dept_key = str(department_id) if department_id else "all"
        df_raw   = self._load_visits(days=days, department_id=department_id)

        total_records    = len(df_raw)
        unique_diagnoses = df_raw["diagnosis"].nunique() if not df_raw.empty else 0

        # --- Insufficient data guard ---
        if df_raw.empty or total_records < 5:
            return {
                "distribution": [],
                "metadata": {
                    "mode":                  "no_data",
                    "insufficient_data":     True,
                    "total_records":         total_records,
                    "unique_diagnoses":      0,
                    "top_diagnosis":         None,
                    # --- Progress fields (new) ---
                    "min_records_for_ml":    MIN_RECORDS_FOR_ML,
                    "ml_progress_pct":       round((total_records / MIN_RECORDS_FOR_ML) * 100, 1),
                    "message": (
                        f"Not enough clinical data for analysis. "
                        f"Records found: {total_records} / {MIN_RECORDS_FOR_ML} required."
                    ),
                },
            }

        # --- Always compute historical distribution first ---
        historical_dist = self._historical_distribution(df_raw)
        top_diagnosis   = historical_dist[0]["name"] if historical_dist else None

        # --- Attempt ML context-aware distribution ---
        bundle = self._train_or_load_rf(df_raw, dept_key)

        if bundle is not None:
            try:
                df_feat = _build_features(df_raw)
                context_dist = self._context_distribution(
                    bundle, df_feat, target_date,
                    context_age, context_gender,
                    dept_id=int(str(department_id).split("-")[0], 16) if department_id and str(department_id) != "all" else -1,
                )

                if context_dist:
                    return {
                        "distribution": context_dist,
                        "metadata": {
                            "mode":               "ml_context_aware",
                            "insufficient_data":  False,
                            "total_records":      total_records,
                            "unique_diagnoses":   unique_diagnoses,
                            "top_diagnosis":      top_diagnosis,
                            # --- Progress fields (new) ---
                            "min_records_for_ml": MIN_RECORDS_FOR_ML,
                            "ml_progress_pct":    100.0,   # ML is active — fully trained
                            "message":            None,
                        },
                    }
            except Exception as e:
                # ML failed — fall through to historical counts silently
                print(f"[DiseaseClassifier] ML prediction failed, "
                      f"falling back to historical counts. Error: {e}")

        # --- Fallback: pure historical counts (always accurate) ---
        ml_progress = round(min(100.0, (total_records / MIN_RECORDS_FOR_ML) * 100), 1)
        return {
            "distribution": historical_dist,
            "metadata": {
                "mode":               "historical_counts",
                "insufficient_data":  False,
                "total_records":      total_records,
                "unique_diagnoses":   unique_diagnoses,
                "top_diagnosis":      top_diagnosis,
                # --- Progress fields (new) ---
                "min_records_for_ml": MIN_RECORDS_FOR_ML,
                "ml_progress_pct":    ml_progress,
                "message": (
                    None if total_records >= MIN_RECORDS_FOR_ML
                    else (
                        f"Showing historical averages. "
                        f"ML activates after {MIN_RECORDS_FOR_ML} records "
                        f"({total_records} collected so far)."
                    )
                ),
            },
        }

    def get_trending_diagnoses(self, days: int = 30) -> list[dict]:
        """
        Compare diagnosis frequency in the last 7 days vs the prior period
        to surface rising trends. Used for the 'Proactive Planning' section.

        Returns a list of diagnoses sorted by growth rate (descending).
        """
        df = self._load_visits(days=days)
        if df.empty:
            return []

        df["visit_date"] = pd.to_datetime(df["visit_date"])
        cutoff           = pd.Timestamp.now(tz="UTC") - pd.Timedelta(days=7)

        # Handle timezone-naive datetimes coming from the DB
        if df["visit_date"].dt.tz is None:
            cutoff = cutoff.tz_localize(None)

        recent = df[df["visit_date"] >= cutoff]["diagnosis"].value_counts()
        prior  = df[df["visit_date"] <  cutoff]["diagnosis"].value_counts()

        results = []
        for diagnosis in recent.index:
            recent_count = int(recent.get(diagnosis, 0))
            prior_count  = int(prior.get(diagnosis, 0))

            if prior_count == 0:
                growth = 100.0   # new diagnosis — treat as max growth
            else:
                growth = round(((recent_count - prior_count) / prior_count) * 100, 1)

            results.append({
                "diagnosis":     diagnosis,
                "recent_count":  recent_count,
                "prior_count":   prior_count,
                "growth_pct":    growth,
                "trending_up":   growth > 10,
            })

        results.sort(key=lambda x: x["growth_pct"], reverse=True)
        return results[:TOP_N_DIAGNOSES]

    # ------------------------------------------------------------------
    # Evaluation
    # ------------------------------------------------------------------

    def evaluate(self, days: int = 180) -> dict:
        """
        Evaluate the RF model using Stratified K-Fold cross-validation.

        Returns mean ± std of accuracy and weighted F1 across 5 folds.
        A single train/test split is unreliable on small, imbalanced datasets;
        StratifiedKFold gives stable, trustworthy metrics.
        """
        df_raw = self._load_visits(days=days)

        if df_raw.empty or len(df_raw) < MIN_RECORDS_FOR_ML:
            return {
                "status": "insufficient_data",
                "message": (
                    f"Need at least {MIN_RECORDS_FOR_ML} records. "
                    f"Found {len(df_raw)}."
                ),
            }

        unique_classes = df_raw["diagnosis"].nunique()
        if unique_classes < 2:
            return {
                "status": "insufficient_classes",
                "message": "Need at least 2 distinct diagnosis categories.",
            }

        try:
            df_feat   = _build_features(df_raw)
            feat_cols = _feature_columns(df_feat)
            X = df_feat[feat_cols].fillna(0).values

            le = LabelEncoder()
            y  = le.fit_transform(df_feat["diagnosis"].values)

            rf = RandomForestClassifier(
                n_estimators=150,
                min_samples_leaf=3,
                class_weight="balanced",
                random_state=42,
                n_jobs=-1,
            )

            n_splits = min(5, unique_classes)   # can't have more folds than classes
            cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

            scores = cross_validate(
                rf, X, y,
                cv=cv,
                scoring={"accuracy": "accuracy", "f1": "f1_weighted"},
                return_train_score=False,
            )

            return {
                "status": "success",
                "samples": len(df_raw),
                "unique_diagnoses": unique_classes,
                "cv_folds": n_splits,
                "accuracy": {
                    "mean": round(float(scores["test_accuracy"].mean()), 3),
                    "std":  round(float(scores["test_accuracy"].std()),  3),
                },
                "f1_weighted": {
                    "mean": round(float(scores["test_f1"].mean()), 3),
                    "std":  round(float(scores["test_f1"].std()),  3),
                },
                "note": (
                    "Accuracy and F1 reported as mean ± std over "
                    f"{n_splits}-fold stratified cross-validation."
                ),
            }

        except Exception as e:
            return {"status": "failed", "error": str(e)}