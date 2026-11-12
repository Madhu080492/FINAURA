
import pandas as pd
import numpy as np
import shutil
import os

from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent

RAW_FILE = BASE_DIR / "data" / "raw" / "tejhq_nse_latest.csv"
MASTER_FILE = BASE_DIR / "data" / "processed" / "finaura_master_dataset.csv"

FEATURE_COLUMNS = [
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
    "drawdown",
    "volume_ma_20",
    "volume_ratio",
    "target_5d_volatility"
]

print("===== FINAURA MASTER DATASET UPDATE =====")

if not RAW_FILE.exists() or not MASTER_FILE.exists():
    raise FileNotFoundError("Required dataset file not found.")

raw = pd.read_csv(RAW_FILE)
master = pd.read_csv(MASTER_FILE, low_memory=False)

original_columns = master.columns.tolist()
original_symbols = set(master["symbol"].dropna().unique())

required = ["date", "symbol", "open", "high", "low", "close", "volume"]

for col in required:
    if col not in raw.columns or col not in master.columns:
        raise ValueError(f"Missing required column: {col}")

raw["date"] = pd.to_datetime(raw["date"], errors="coerce")
master["date"] = pd.to_datetime(master["date"], errors="coerce")

for col in ["open", "high", "low", "close", "volume"]:
    raw[col] = pd.to_numeric(raw[col], errors="coerce")
    master[col] = pd.to_numeric(master[col], errors="coerce")

raw["symbol"] = raw["symbol"].astype(str).str.upper()
master["symbol"] = master["symbol"].astype(str).str.upper()

raw = raw.dropna(subset=required)
raw = raw.drop_duplicates(
    subset=["symbol", "date"],
    keep="last"
)

invalid = (
    (raw["open"] <= 0) |
    (raw["high"] <= 0) |
    (raw["low"] <= 0) |
    (raw["close"] <= 0) |
    (raw["volume"] < 0) |
    (raw["high"] < raw[["open", "close", "low"]].max(axis=1)) |
    (raw["low"] > raw[["open", "close"]].min(axis=1))
)

if invalid.any():
    raise ValueError(f"Invalid OHLCV rows found: {invalid.sum()}")

new_records = []

for symbol in sorted(raw["symbol"].unique()):

    print(f"\nProcessing {symbol}...")

    existing = master[
        master["symbol"] == symbol
    ].copy()

    if existing.empty:
        print("SKIPPED: No historical records found.")
        continue

    latest_existing = existing["date"].max()

    new_data = raw[
        (raw["symbol"] == symbol) &
        (raw["date"] > latest_existing)
    ].copy()

    if new_data.empty:
        print("No new dates available.")
        continue

    historical = existing[
        ["date", "open", "high", "low", "close", "volume"]
    ].copy()

    historical["_is_new"] = False
    new_data["_is_new"] = True

    combined = pd.concat(
        [historical, new_data],
        ignore_index=True
    )

    combined = combined.sort_values("date")
    combined = combined.drop_duplicates(
        subset=["date"],
        keep="last"
    ).reset_index(drop=True)

    close = combined["close"]
    log_return = np.log(close / close.shift(1))

    combined["daily_return"] = close.pct_change()
    combined["log_return"] = log_return

    combined["intraday_return"] = (
        (combined["close"] - combined["open"])
        / combined["open"]
    )

    combined["price_range"] = (
        (combined["high"] - combined["low"])
        / combined["close"]
    )

    for window in [5, 10, 20, 50]:
        combined[f"ma_{window}"] = (
            close.rolling(window).mean()
        )

    for window in [5, 10, 20]:
        combined[f"volatility_{window}d"] = (
            log_return.rolling(window).std()
            * np.sqrt(252)
        )

    combined["momentum_5d"] = (
        close / close.shift(5) - 1
    )

    combined["momentum_20d"] = (
        close / close.shift(20) - 1
    )

    combined["drawdown"] = (
        close / close.cummax() - 1
    )

    combined["volume_ma_20"] = (
        combined["volume"].rolling(20).mean()
    )

    combined["volume_ratio"] = (
        combined["volume"] / combined["volume_ma_20"]
    )

    future_returns = pd.concat(
        [
            log_return.shift(-i).rename(f"future_{i}")
            for i in range(1, 6)
        ],
        axis=1
    )

    complete_future = future_returns.notna().all(axis=1)

    combined["target_5d_volatility"] = (
        future_returns.std(axis=1) * np.sqrt(252)
    ).where(complete_future)

    # Only genuinely new dates are selected
    latest_rows = combined[
        combined["_is_new"].fillna(False)
    ].copy()

    for _, row in latest_rows.iterrows():

        record = {
            col: np.nan for col in original_columns
        }

        for col in [
            "date", "symbol", "open", "high",
            "low", "close", "volume"
        ]:
            record[col] = row[col]

        record["adj_close"] = np.nan
        record["asset_class"] = "EQUITY"
        record["source"] = "TejHQ"

        previous_close = combined.loc[
            row.name - 1, "close"
        ] if row.name > 0 else np.nan

        record["previous_close"] = previous_close

        if pd.notna(previous_close):
            record["change"] = row["close"] - previous_close
            record["change_pct"] = (
                (row["close"] / previous_close - 1) * 100
            )

        for col in FEATURE_COLUMNS:
            record[col] = row[col]

        if "fetched_at_utc" in raw.columns:
            fetched = raw[
                (raw["symbol"] == symbol) &
                (raw["date"] == row["date"])
            ]["fetched_at_utc"]

            if not fetched.empty:
                record["fetched_at"] = fetched.iloc[-1]

        elif "fetched_at" in raw.columns:
            fetched = raw[
                (raw["symbol"] == symbol) &
                (raw["date"] == row["date"])
            ]["fetched_at"]

            if not fetched.empty:
                record["fetched_at"] = fetched.iloc[-1]

        new_records.append(record)

    print(
        f"SUCCESS | {symbol} | "
        f"Added {len(latest_rows)} records | "
        f"Latest: {latest_rows['date'].max().date()}"
    )

if not new_records:
    print("\nNo new records found. Master dataset unchanged.")
    raise SystemExit(0)

new_df = pd.DataFrame(new_records, columns=original_columns)

updated = pd.concat(
    [master, new_df],
    ignore_index=True
)

updated["date"] = pd.to_datetime(
    updated["date"], errors="coerce"
).dt.strftime("%Y-%m-%d")

updated = updated.drop_duplicates(
    subset=["date", "symbol"],
    keep="first"
)

# Validation
if updated.columns.tolist() != original_columns:
    raise ValueError("Master dataset schema changed!")

if updated.duplicated(["date", "symbol"]).any():
    raise ValueError("Duplicate date-symbol records found!")

if set(updated["symbol"].dropna().unique()) != original_symbols:
    raise ValueError("Asset symbols changed unexpectedly!")

if len(updated.columns) != 70:
    raise ValueError(
        f"Expected 70 columns, found {len(updated.columns)}"
    )

# Create backup before saving
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

backup_file = MASTER_FILE.with_name(
    f"finaura_master_dataset_backup_{timestamp}.csv"
)

shutil.copy2(MASTER_FILE, backup_file)

# Save to temporary file and verify
temp_file = MASTER_FILE.with_name(
    "finaura_master_dataset_temp.csv"
)

updated.to_csv(temp_file, index=False)

check = pd.read_csv(temp_file, low_memory=False)

if check.shape != updated.shape:
    raise ValueError("Saved dataset verification failed!")

os.replace(temp_file, MASTER_FILE)

print("\n===== UPDATE COMPLETED =====")
print("New records:", len(new_df))
print("Old rows:", len(master))
print("Updated rows:", len(updated))
print("Columns:", len(updated.columns))
print("Backup:", backup_file)
print("Master:", MASTER_FILE)

print("\nLatest NSE stock dates:")

print(
    updated[
        updated["asset_class"] == "EQUITY"
    ].groupby("symbol")["date"].max().to_string()
)
