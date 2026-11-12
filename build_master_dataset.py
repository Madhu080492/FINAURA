
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")

OUTPUT_FILE = os.path.join(
    PROCESSED_DIR,
    "finaura_master_dataset.csv"
)

STOCK_FILE = os.path.join(
    PROCESSED_DIR,
    "nse_stocks_processed.csv"
)

USD_FILE = os.path.join(
    PROCESSED_DIR,
    "usd_inr_processed.csv"
)


def load_stocks():
    df = pd.read_csv(STOCK_FILE)

    df["date"] = pd.to_datetime(df["date"])
    df["asset_class"] = "EQUITY"

    df["source"] = "Historical NSE Dataset"

    return df


def load_usd_inr():
    df = pd.read_csv(USD_FILE)

    df["date"] = pd.to_datetime(df["date"])
    df["symbol"] = "USDINR"
    df["asset_class"] = "FOREX"

    df["source"] = "Historical USD INR Dataset"

    return df


def build_master_dataset():

    print("Loading NSE stocks...")
    stocks = load_stocks()

    print("Loading USD/INR...")
    usd_inr = load_usd_inr()

    print("Combining datasets...")

    master = pd.concat(
        [stocks, usd_inr],
        ignore_index=True,
        sort=False
    )

    master = master.sort_values(
        ["date", "asset_class", "symbol"]
    )

    master = master.drop_duplicates(
        subset=["date", "symbol"],
        keep="last"
    )

    master = master.reset_index(drop=True)

    master["fetched_at"] = pd.NA

    master.to_csv(OUTPUT_FILE, index=False)

    print("\nMASTER DATASET CREATED")
    print("File:", OUTPUT_FILE)
    print("Total rows:", len(master))
    print("Total columns:", len(master.columns))

    print("\nAsset classes:")
    print(master["asset_class"].value_counts())

    print("\nAssets:")
    print(sorted(master["symbol"].unique()))

    print("\nDate range:")
    print(master["date"].min(), "to", master["date"].max())


if __name__ == "__main__":
    build_master_dataset()
