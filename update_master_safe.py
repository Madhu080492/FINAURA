import pandas as pd
import shutil
from pathlib import Path
from datetime import datetime

BASE = Path("data/processed")
MASTER_FILE = BASE / "finaura_master_dataset.csv"
OUTPUT_FILE = BASE / "finaura_master_dataset_candidate.csv"

ASSETS = {
    "GOLD": ("gold_processed.csv", "COMMODITY", "Historical Gold Dataset"),
    "INDIA_VIX": ("india_vix_processed.csv", "VOLATILITY_INDEX", "Historical India VIX Dataset"),
    "USDINR": ("usd_inr_processed.csv", "FOREX", "Historical USD INR Dataset"),
    "NIFTY50": ("nifty50_processed.csv", "INDEX", "Historical NIFTY 50 Dataset"),
}

def main():
    master = pd.read_csv(MASTER_FILE, low_memory=False)
    master["date"] = pd.to_datetime(master["date"]).dt.strftime("%Y-%m-%d")

    original_rows = len(master)
    additions = []

    print("Starting safe master merge...")
    print("Original master rows:", original_rows)

    for symbol, (filename, asset_class, source) in ASSETS.items():
        file_path = BASE / filename

        if not file_path.exists():
            raise FileNotFoundError(f"Missing file: {file_path}")

        data = pd.read_csv(file_path, low_memory=False)
        data["date"] = pd.to_datetime(data["date"]).dt.strftime("%Y-%m-%d")

        data["symbol"] = symbol
        data["asset_class"] = asset_class
        data["source"] = source

        existing = master[master["symbol"] == symbol]

        if len(existing):
            latest_date = existing["date"].max()
            new_data = data[data["date"] > latest_date].copy()
        else:
            latest_date = None
            new_data = data.copy()

        new_data = new_data.drop_duplicates(
            subset=["symbol", "date"],
            keep="last"
        )

        additions.append(new_data)

        print(
            f"{symbol}: existing latest={latest_date}, "
            f"new rows={len(new_data)}, "
            f"new latest={new_data['date'].max() if len(new_data) else 'No new rows'}"
        )

    combined = pd.concat([master] + additions, ignore_index=True, sort=False)

    combined["date"] = pd.to_datetime(combined["date"]).dt.strftime("%Y-%m-%d")
    combined = combined.sort_values(
        ["symbol", "date"]
    ).reset_index(drop=True)

    duplicate_count = combined.duplicated(["symbol", "date"]).sum()

    if duplicate_count:
        raise ValueError(
            f"Merge stopped: {duplicate_count} duplicate symbol-date rows found."
        )

    if len(combined) < original_rows:
        raise ValueError("Merge stopped: original master rows were lost.")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = BASE / f"finaura_master_backup_{timestamp}.csv"

    shutil.copy2(MASTER_FILE, backup_file)
    combined.to_csv(OUTPUT_FILE, index=False)

    print("\nMERGE CANDIDATE CREATED")
    print("Original rows:", original_rows)
    print("Candidate rows:", len(combined))
    print("Rows added:", len(combined) - original_rows)
    print("Duplicate keys:", duplicate_count)
    print("Backup:", backup_file)
    print("Candidate:", OUTPUT_FILE)
    print("\nOriginal master has NOT been modified.")

if __name__ == "__main__":
    main()
