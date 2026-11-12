
import pandas as pd
from pathlib import Path

MASTER_PATH = Path("data/processed/finaura_master_dataset.csv")
GOLD_PATH = Path("data/processed/gold_processed.csv")
BACKUP_PATH = Path("data/processed/finaura_master_before_gold.csv")

master = pd.read_csv(MASTER_PATH)
gold = pd.read_csv(GOLD_PATH)

# Standardize dates
master["date"] = pd.to_datetime(master["date"])
gold["date"] = pd.to_datetime(gold["date"])

# Add Gold identification
gold["symbol"] = "GOLD"
gold["asset_class"] = "COMMODITY"
gold["source"] = "Historical Gold Dataset"

# Add columns that do not exist in Gold
extra_columns = [
    "previous_close",
    "change",
    "change_pct",
    "fetched_at"
]

for column in extra_columns:
    if column not in gold.columns:
        gold[column] = pd.NA

# Match the exact master dataset structure
gold = gold.reindex(columns=master.columns)

# Backup existing master dataset
if not BACKUP_PATH.exists():
    master.to_csv(BACKUP_PATH, index=False)

# Remove existing Gold rows to avoid duplicates on reruns
master = master[master["symbol"] != "GOLD"]

# Merge datasets
updated_master = pd.concat([master, gold], ignore_index=True)

# Remove duplicate date-symbol combinations
updated_master = updated_master.drop_duplicates(
    subset=["date", "symbol"],
    keep="last"
)

updated_master = updated_master.sort_values(
    ["date", "symbol"]
).reset_index(drop=True)

# Save updated master dataset
updated_master.to_csv(MASTER_PATH, index=False)

print("\nGOLD MERGE SUCCESSFUL")
print("Total rows:", len(updated_master))
print("Gold rows:", (updated_master["symbol"] == "GOLD").sum())
print("Total assets:", updated_master["symbol"].nunique())
print("Gold date range:",
      gold["date"].min().date(), "to", gold["date"].max().date())
print("Saved:", MASTER_PATH)
print("Backup:", BACKUP_PATH)
