
import json
import joblib
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "notebooks" / "models" / "finaura_extra_trees.pkl"
METADATA_PATH = BASE_DIR / "notebooks" / "models" / "finaura_model_metadata.json"
DATA_PATH = BASE_DIR / "data" / "processed" / "finaura_master_dataset.csv"

SYMBOL = "RELIANCE"

# Load trained model
model = joblib.load(MODEL_PATH)

# Load model metadata
with open(METADATA_PATH, "r") as file:
    metadata = json.load(file)

feature_columns = metadata["feature_columns"]

# Load master dataset
df = pd.read_csv(DATA_PATH, low_memory=False)

df["date"] = pd.to_datetime(df["date"], errors="coerce")

# Filter selected stock
stock_data = df[
    (df["symbol"] == SYMBOL) &
    (df["asset_class"] == "EQUITY")
].copy()

stock_data = stock_data.sort_values("date")

if stock_data.empty:
    raise ValueError(f"No data found for {SYMBOL}")

# Verify model features
missing_features = [
    col for col in feature_columns
    if col not in stock_data.columns
]

if missing_features:
    raise ValueError(
        f"Missing model features: {missing_features}"
    )

# Select latest row with complete features
latest_row = stock_data.dropna(
    subset=feature_columns
).tail(1)

if latest_row.empty:
    raise ValueError("No complete feature row available")

X_latest = latest_row[feature_columns]

# Generate prediction
prediction = float(model.predict(X_latest)[0])

threshold = metadata["high_volatility_threshold"]

latest_date = latest_row["date"].iloc[0].date()

print("\n===== FINAURA FINAL RISK FORECAST =====")

print("Stock:", SYMBOL)
print("Latest date:", latest_date)
print("Forecast horizon:", metadata["forecast_horizon"])

print(f"Annualized volatility: {prediction:.4f}")
print(f"Percentage equivalent: {prediction * 100:.2f}%")
print(f"High volatility threshold: {threshold:.4f}")

if prediction >= threshold:
    print("Risk Status: HIGH VOLATILITY")
else:
    print("Risk Status: BELOW HIGH-VOLATILITY THRESHOLD")

print("\nModel: Extra Trees Regressor")
print("Note: Model estimate, not a guarantee.")
