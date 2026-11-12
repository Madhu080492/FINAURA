
import os
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

INPUT_DIR = os.path.join(
    BASE_DIR, "data", "raw", "latest_market"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR, "data", "processed"
)

INPUT_FILE = os.path.join(
    INPUT_DIR, "all_stocks_latest.csv"
)

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR, "latest_stocks_processed.csv"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)

df = pd.read_csv(INPUT_FILE)

df.columns = df.columns.str.lower()

df["date"] = pd.to_datetime(df["date"])

df = df.sort_values(["symbol", "date"]).copy()

# Exclude today's potentially incomplete market candle
today = pd.Timestamp.now().normalize()
df = df[df["date"] < today].copy()

# Calculate features separately for each stock
df["daily_return"] = (
    df.groupby("symbol")["close"].pct_change()
)

df["log_return"] = (
    df.groupby("symbol")["close"].transform(
        lambda x: np.log(x / x.shift(1))
    )
)

df["intraday_return"] = (
    (df["close"] - df["open"]) / df["open"]
)

df["price_range"] = (
    (df["high"] - df["low"]) / df["close"]
)

for window in [5, 10, 20, 50]:
    df[f"ma_{window}"] = (
        df.groupby("symbol")["close"].transform(
            lambda x: x.rolling(window).mean()
        )
    )

for window in [5, 10, 20]:
    df[f"volatility_{window}d"] = (
        df.groupby("symbol")["log_return"].transform(
            lambda x: x.rolling(window).std() * np.sqrt(252)
        )
    )

df["momentum_5d"] = (
    df.groupby("symbol")["close"].transform(
        lambda x: x / x.shift(5) - 1
    )
)

df["momentum_20d"] = (
    df.groupby("symbol")["close"].transform(
        lambda x: x / x.shift(20) - 1
    )
)

df["running_max"] = (
    df.groupby("symbol")["close"].cummax()
)

df["drawdown"] = (
    df["close"] / df["running_max"] - 1
)

df.drop(columns=["running_max"], inplace=True)

df["volume_ma_20"] = (
    df.groupby("symbol")["volume"].transform(
        lambda x: x.rolling(20).mean()
    )
)

df["volume_ratio"] = (
    df["volume"] / df["volume_ma_20"]
)

df.to_csv(OUTPUT_FILE, index=False)

print("LATEST STOCK DATA PROCESSED")
print("Rows:", len(df))
print("Assets:", sorted(df["symbol"].unique()))
print("Date range:", df["date"].min(), "to", df["date"].max())
print("Saved:", OUTPUT_FILE)
