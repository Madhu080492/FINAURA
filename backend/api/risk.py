
import json
import joblib
import pandas as pd

from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[2]

DATA_FILE = BASE_DIR / "data" / "processed" / "finaura_master_dataset.csv"

MODEL_FILE = BASE_DIR / "notebooks" / "models" / "finaura_extra_trees.pkl"

METADATA_FILE = BASE_DIR / "notebooks" / "models" / "finaura_model_metadata.json"


# Load model metadata
with open(METADATA_FILE, "r") as file:
    metadata = json.load(file)

FEATURES = metadata["features"]

HIGH_VOLATILITY_THRESHOLD = metadata["high_volatility_threshold"]

# Load trained model
model = joblib.load(MODEL_FILE)

# Load master dataset
df = pd.read_csv(DATA_FILE, low_memory=False)

df["date"] = pd.to_datetime(df["date"], errors="coerce")


@router.get("/risk/{symbol}")
def predict_risk(symbol: str):

    symbol = symbol.upper()

    asset = df[df["symbol"].str.upper() == symbol].copy()

    if asset.empty:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    # Keep only rows with all required model features
    asset = asset.dropna(subset=FEATURES)

    if asset.empty:
        raise HTTPException(
            status_code=400,
            detail="Risk prediction is currently supported only for the 8 NSE stocks"
        )

    # Get latest available stock data
    latest = asset.sort_values("date").iloc[-1]

    input_data = pd.DataFrame(
        [[latest[feature] for feature in FEATURES]],
        columns=FEATURES
    )

    # Generate prediction
    prediction = float(model.predict(input_data)[0])

    risk_status = (
        "High"
        if prediction >= HIGH_VOLATILITY_THRESHOLD
        else "Below high-volatility threshold"
    )

    return {
        "symbol": symbol,
        "model": metadata["model_name"],
        "forecast_horizon": metadata["forecast_horizon"],
        "data_date": latest["date"].strftime("%Y-%m-%d"),
        "predicted_annualized_volatility": round(prediction, 4),
        "predicted_volatility_percentage": round(prediction * 100, 2),
        "high_volatility_threshold": round(
            HIGH_VOLATILITY_THRESHOLD, 4
        ),
        "risk_status": risk_status
    }
