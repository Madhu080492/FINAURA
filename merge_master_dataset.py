
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")

MASTER_FILE = os.path.join(
    PROCESSED_DIR, "finaura_master_dataset.csv"
)

LATEST_FILE = os.path.join(
    PROCESSED_DIR, "latest_stocks_processed.csv"
)

master = pd.read_csv(MASTER_FILE)
latest = pd.read_csv(LATEST_FILE)

master["date"] = pd.to_datetime(master["date"])
latest["date"] = pd.to_datetime(latest["date"])

# Keep only latest stock records newer than historical stock data
stock_symbols = latest["symbol"].unique()

historical_stocks = master[
    master["symbol"].isin(stock_symbols)
]

last_date = historical_stocks["date"].max()

new_rows = latest[
    latest["date"] > last_date
].copy()

new_rows["asset_class"] = "EQUITY"
new_rows["source"] = "Yahoo Finance"

# Preserve other assets, including USDINR
master = master[
    ~master["symbol"].isin(stock_symbols)
]

updated = pd.concat(
    [master, historical_stocks, new_rows],
    ignore_index=True,
    sort=False
)

updated = updated.drop_duplicates(
    subset=["date", "symbol"],
    keep="last"
)

updated = updated.sort_values(
    ["date", "asset_class", "symbol"]
).reset_index(drop=True)

updated.to_csv(MASTER_FILE, index=False)

print("MASTER DATASET UPDATED")
print("Total rows:", len(updated))
print("Assets:", sorted(updated["symbol"].unique()))
print("Date range:", updated["date"].min(), "to", updated["date"].max())
print("New stock rows added:", len(new_rows))
