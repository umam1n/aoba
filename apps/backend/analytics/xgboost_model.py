import os
import logging
from typing import Tuple, Dict, Any, Optional

import pandas as pd
import xgboost as xgb
import shap
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

logger = logging.getLogger(__name__)

# Minimum attrition events needed to activate the ML model
MIN_ATTRITION_EVENTS_THRESHOLD = 50

# Features used for the XGBoost model
MODEL_FEATURES = [
    "tenure_risk", "compensation_ratio", "promotion_velocity",
    "manager_change_recency", "team_attrition_exposure", 
    "time_since_role_change", "leave_anomaly",
    "onboarding_completion"
]
TARGET_VARIABLE = "attrited_within_90d"

from django.conf import settings

def get_model_path(company_id: str) -> str:
    """Return the filesystem path for the tenant's model artifact."""
    # In MVP this uses local file system, later moves to Supabase Storage
    path = settings.BASE_DIR / "models" / str(company_id)
    os.makedirs(path, exist_ok=True)
    return str(path / "attrition_xgb_v1.json")

def load_or_train_model(df: pd.DataFrame, company_id: str) -> Tuple[Optional[xgb.XGBClassifier], Optional[shap.TreeExplainer]]:
    """Load existing model from disk if available, otherwise train a new one."""
    model_path = get_model_path(company_id)
    
    # Check if we should activate threshold
    if not check_activation_threshold(df):
        logger.info(f"[{company_id}] Insufficient attrition events to train ML model. Falling back to rule-based scoring.")
        return None, None
        
    if os.path.exists(model_path):
        try:
            model = xgb.XGBClassifier()
            model.load_model(model_path)
            explainer = shap.TreeExplainer(model)
            logger.info(f"[{company_id}] Loaded existing XGBoost model from {model_path}")
            return model, explainer
        except Exception as e:
            logger.warning(f"[{company_id}] Failed to load model from {model_path}: {e}. Retraining...")
            
    return build_attrition_model(df, company_id)

def check_activation_threshold(df: pd.DataFrame) -> bool:
    """Check if the dataset has enough historical attrition events to train an XGBoost model."""
    if TARGET_VARIABLE not in df.columns:
        return False
    positive_events = len(df[df[TARGET_VARIABLE] == 1])
    return positive_events >= MIN_ATTRITION_EVENTS_THRESHOLD

def build_attrition_model(df: pd.DataFrame, company_id: str) -> Tuple[Optional[xgb.XGBClassifier], Optional[shap.TreeExplainer]]:
    """
    Train an XGBoost Classifier on tenant-scoped data.
    NEVER cross-tenant. NEVER include protected characteristics.
    """
    if not check_activation_threshold(df):
        logger.info(f"[{company_id}] Insufficient attrition events to train ML model. Falling back to rule-based scoring.")
        return None, None

    # Filter out missing features for safety
    available_features = [f for f in MODEL_FEATURES if f in df.columns]
    
    if len(available_features) < len(MODEL_FEATURES):
        logger.warning(f"[{company_id}] Missing features in dataset: {set(MODEL_FEATURES) - set(available_features)}")
    
    X = df[available_features]
    y = df[TARGET_VARIABLE]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # Handle class imbalance natively via ratio calculation
    negative_cases = len(y_train[y_train == 0])
    positive_cases = len(y_train[y_train == 1])
    pos_weight = negative_cases / positive_cases if positive_cases > 0 else 1.0

    model = xgb.XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        scale_pos_weight=pos_weight,
        eval_metric="auc",
        early_stopping_rounds=15,
        random_state=42
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )
    
    predictions = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, predictions)
    
    # TreeExplainer is highly optimized for tree ensembles
    explainer = shap.TreeExplainer(model)

    # Save artifact namespaced to company
    model_path = get_model_path(company_id)
    model.save_model(model_path)

    logger.info(f"[{company_id}] XGBoost Model trained. AUC: {auc:.3f}")
    return model, explainer

def predict_attrition(model: xgb.XGBClassifier, explainer: shap.TreeExplainer, employee_features: pd.DataFrame) -> Dict[str, Any]:
    """Generate risk probability and SHAP explanations for a single employee or batch."""
    # Predict probability of attrition (class 1)
    probabilities = model.predict_proba(employee_features)[:, 1]
    
    # Generate SHAP values for explainability
    shap_values = explainer.shap_values(employee_features)
    
    return {
        "probabilities": probabilities,
        "shap_values": shap_values,
        "features": employee_features.columns.tolist()
    }
