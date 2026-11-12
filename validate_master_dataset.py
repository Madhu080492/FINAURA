
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(
    BASE_DIR, "data", "processed",
    "finaura_master_dataset.csv"
)

df = pd.read_csv(FILE)

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

print("DATASET SHAPE:", df.shape)

print("\nDUPLICATE DATE-SYMBOL ROWS:")
print(df.duplicated(["date", "symbol"]).sum())

print("\nMODEL FEATURE CHECK:")
for col in features:
    if col in df.columns:
        print(col, "-> Available")
    else:
        print(col, "-> MISSING")

print("\nMISSING VALUES IN STOCK FEATURES:")
stocks = df[df["asset_class"] == "EQUITY"]
print(stocks[features].isnull().sum())

print("\nASSET COUNTS:")
print(df["symbol"].value_counts())

print("\nLATEST DATE PER ASSET:")
print(df.groupby("symbol")["date"].max())
