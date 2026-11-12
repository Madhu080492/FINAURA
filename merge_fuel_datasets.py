
import pandas as pd
import os

MASTER_FILE = "data/processed/finaura_master_dataset.csv"

PETROL_FILE = "data/processed/delhi_petrol_processed.csv"
DIESEL_FILE = "data/processed/delhi_diesel_processed.csv"

BACKUP_FILE = "data/processed/finaura_master_before_fuel.csv"

# Load existing master dataset
master = pd.read_csv(MASTER_FILE)

# Create backup before modifying master
master.to_csv(BACKUP_FILE, index=False)

def prepare_fuel(file_path, symbol, price_column, previous_column, change_column, return_column):
    df = pd.read_csv(file_path)

    df["date"] = pd.to_datetime(df["date"])

    # Common FINAURA columns
    df["symbol"] = symbol
    df["asset_class"] = "FUEL"
    df["source"] = "Historical Delhi Fuel Dataset"

    df["close"] = df[price_column]
    df["adj_close"] = df[price_column]
    df["previous_close"] = df[previous_column]
    df["change"] = df[change_column]
    df["change_pct"] = df[return_column] * 100
    df["daily_return"] = df[return_column]

    return df


# Prepare petrol
petrol = prepare_fuel(
    PETROL_FILE,
    "DELHI_PETROL",
    "petrol_price",
    "previous_petrol_price",
    "petrol_price_change",
    "petrol_return"
)

# Prepare diesel
diesel = prepare_fuel(
    DIESEL_FILE,
    "DELHI_DIESEL",
    "diesel_price",
    "previous_diesel_price",
    "diesel_price_change",
    "diesel_return"
)

# Remove old fuel rows if script is run again
master = master[
    ~master["symbol"].isin(["DELHI_PETROL", "DELHI_DIESEL"])
].copy()

master["date"] = pd.to_datetime(master["date"])

# Combine all columns without losing existing data
combined = pd.concat(
    [master, petrol, diesel],
    ignore_index=True,
    sort=False
)

# Remove duplicate date-symbol combinations
combined = combined.drop_duplicates(
    subset=["date", "symbol"],
    keep="last"
)

# Sort dataset
combined = combined.sort_values(
    ["date", "symbol"]
).reset_index(drop=True)

# Save updated master
combined.to_csv(MASTER_FILE, index=False)

print("\n===== FUEL DATA INTEGRATION COMPLETE =====")
print("Master shape:", combined.shape)
print("Total assets:", combined["symbol"].nunique())

print("\nFuel records:")
print(combined[
    combined["symbol"].isin(["DELHI_PETROL", "DELHI_DIESEL"])
].groupby("symbol").size())

print("\nLatest fuel dates:")
print(
    combined[
        combined["symbol"].isin(["DELHI_PETROL", "DELHI_DIESEL"])
    ].groupby("symbol")["date"].max()
)

print("\nBackup saved:", BACKUP_FILE)
print("Updated master:", MASTER_FILE)

