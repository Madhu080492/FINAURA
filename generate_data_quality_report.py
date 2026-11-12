
import pandas as pd
import os

FILE = "data/processed/finaura_master_dataset.csv"
OUTPUT = "data/processed/data_quality_report.csv"

df = pd.read_csv(FILE, low_memory=False)

df["date"] = pd.to_datetime(df["date"], errors="coerce")

print("\n========== FINAURA DATA QUALITY REPORT ==========")

print("\n1. MASTER DATASET")
print("Total records:", len(df))
print("Total columns:", len(df.columns))
print("Total assets:", df["symbol"].nunique())
print("Duplicate rows:", df.duplicated(["date", "symbol"]).sum())

print("\n2. ASSET-WISE DATA QUALITY")

report = []

for symbol, group in df.groupby("symbol"):

    group = group.sort_values("date")

    latest_date = group["date"].max()

    missing_close = group["close"].isna().sum()
    missing_return = group["daily_return"].isna().sum()

    report.append({
        "symbol": symbol,
        "records": len(group),
        "first_date": group["date"].min(),
        "latest_date": latest_date,
        "missing_close": missing_close,
        "missing_daily_return": missing_return
    })

report_df = pd.DataFrame(report)

print(report_df.to_string(index=False))

report_df.to_csv(OUTPUT, index=False)

print("\n3. CORE MODEL FEATURES")

features = [
    "daily_return",
    "log_return",
    "intraday_return",
    "price_range",
    "ma_5",
    "ma_10",
    "ma_20",
    "ma_50",
    "volatility_5d",
    "volatility_10d",
    "volatility_20d",
    "momentum_5d",
    "momentum_20d",
    "drawdown"
]

for feature in features:
    if feature in df.columns:
        print(feature, "-> Missing:", df[feature].isna().sum())

print("\nReport saved:", OUTPUT)
print("\n========== REPORT COMPLETE ==========")
