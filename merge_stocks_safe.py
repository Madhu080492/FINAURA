
import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data" / "processed"

OLD_FILE = DATA_DIR / "nse_stocks_processed.csv"
LATEST_FILE = DATA_DIR / "latest_stocks_processed.csv"
OUTPUT_FILE = DATA_DIR / "nse_stocks_combined.csv"

# Load datasets
old = pd.read_csv(OLD_FILE, low_memory=False)
latest = pd.read_csv(LATEST_FILE, low_memory=False)

# Standardize dates
old["date"] = pd.to_datetime(old["date"])
latest["date"] = pd.to_datetime(latest["date"])

# Validate stock symbols
if set(old["symbol"].unique()) != set(latest["symbol"].unique()):
    raise ValueError("Stock symbols do not match!")

# Keep only records after the old dataset's latest date
cutoff_date = old["date"].max()
new = latest[latest["date"] > cutoff_date].copy()

if new.empty:
    raise ValueError("No new stock records found!")

# Validate new records
if new.duplicated(["symbol", "date"]).any():
    raise ValueError("Duplicate records found in new data!")

if new.isna().any().any():
    raise ValueError("Missing values found in new records!")

# Combine without deleting historical records
combined = pd.concat([old, new], ignore_index=True, sort=False)

# Final validation
if combined.duplicated(["symbol", "date"]).any():
    raise ValueError("Duplicate keys found after merging!")

combined = combined.sort_values(
    ["symbol", "date"]
).reset_index(drop=True)

# Save to a NEW file; originals remain untouched
combined.to_csv(OUTPUT_FILE, index=False)

# Verification
print("\n===== STOCK MERGE SUCCESSFUL =====")
print("Old rows:", len(old))
print("New rows:", len(new))
print("Combined rows:", len(combined))
print("Date range:", combined["date"].min(), "to", combined["date"].max())
print("Duplicate keys:", combined.duplicated(["symbol", "date"]).sum())
print("\nRows per stock:")
print(combined.groupby("symbol").size().to_string())
print("\nSaved file:", OUTPUT_FILE)
