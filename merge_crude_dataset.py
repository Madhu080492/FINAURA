
import pandas as pd
from pathlib import Path

MASTER_PATH = Path("data/processed/finaura_master_dataset.csv")
CRUDE_PATH = Path("data/processed/indian_basket_crude_processed.csv")
BACKUP_PATH = Path("data/processed/finaura_master_before_crude.csv")

master = pd.read_csv(MASTER_PATH)
crude = pd.read_csv(CRUDE_PATH)

master["date"] = pd.to_datetime(master["date"])
crude["date"] = pd.to_datetime(crude["date"])

# Identify crude asset
crude["symbol"] = "INDIAN_BASKET_CRUDE"
crude["asset_class"] = "COMMODITY"
crude["source"] = "Historical Indian Basket Crude Dataset"

# Map equivalent common fields
crude["close"] = crude["crude_oil_price"]
crude["adj_close"] = crude["crude_oil_price"]
crude["previous_close"] = crude["previous_crude_price"]
crude["change"] = crude["crude_price_change"]
crude["change_pct"] = crude["crude_return"] * 100
crude["daily_return"] = crude["crude_return"]

# Do not map monthly indicators to daily indicators.
# Preserve all original crude-specific columns.

# Create backup only once
if not BACKUP_PATH.exists():
    master.to_csv(BACKUP_PATH, index=False)

# Safe to rerun
master = master[master["symbol"] != "INDIAN_BASKET_CRUDE"]

# Concatenate using union of columns to preserve crude features
updated = pd.concat(
    [master, crude],
    ignore_index=True,
    sort=False
)

updated = updated.drop_duplicates(
    subset=["date", "symbol"],
    keep="last"
)

updated = updated.sort_values(
    ["date", "symbol"]
).reset_index(drop=True)

updated.to_csv(MASTER_PATH, index=False)

print("\nCRUDE MERGE SUCCESSFUL")
print("Total rows:", len(updated))
print("Crude rows:", (updated["symbol"] == "INDIAN_BASKET_CRUDE").sum())
print("Total assets:", updated["symbol"].nunique())
print("Total columns:", len(updated.columns))
print("Crude date range:",
      crude["date"].min().date(), "to", crude["date"].max().date())
print("Saved:", MASTER_PATH)
print("Backup:", BACKUP_PATH)
