
import pandas as pd
from pathlib import Path

MASTER_PATH = Path("data/processed/finaura_master_dataset.csv")
VIX_PATH = Path("data/processed/india_vix_processed.csv")
BACKUP_PATH = Path("data/processed/finaura_master_before_vix.csv")

master = pd.read_csv(MASTER_PATH)
vix = pd.read_csv(VIX_PATH)

master["date"] = pd.to_datetime(master["date"])
vix["date"] = pd.to_datetime(vix["date"])

# Identify India VIX
vix["symbol"] = "INDIA_VIX"
vix["asset_class"] = "VOLATILITY_INDEX"
vix["source"] = "Historical India VIX Dataset"

# Add master columns missing from VIX
for column in ["previous_close", "change", "change_pct", "fetched_at"]:
    if column not in vix.columns:
        vix[column] = pd.NA

# Match master structure
vix = vix.reindex(columns=master.columns)

# Create backup only once
if not BACKUP_PATH.exists():
    master.to_csv(BACKUP_PATH, index=False)

# Make script safe to rerun
master = master[master["symbol"] != "INDIA_VIX"]

# Merge
updated = pd.concat([master, vix], ignore_index=True)

updated = updated.drop_duplicates(
    subset=["date", "symbol"],
    keep="last"
)

updated = updated.sort_values(
    ["date", "symbol"]
).reset_index(drop=True)

updated.to_csv(MASTER_PATH, index=False)

print("\nINDIA VIX MERGE SUCCESSFUL")
print("Total rows:", len(updated))
print("VIX rows:", (updated["symbol"] == "INDIA_VIX").sum())
print("Total assets:", updated["symbol"].nunique())
print("VIX date range:",
      vix["date"].min().date(), "to", vix["date"].max().date())
print("Saved:", MASTER_PATH)
print("Backup:", BACKUP_PATH)
