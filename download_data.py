
import yfinance as yf
import pandas as pd
import os
import shutil

from pathlib import Path
from datetime import date, timedelta, datetime

# ==========================================
# FINAURA - SAFE INCREMENTAL DATA DOWNLOADER
# ==========================================

RAW_DIR = Path("data/raw")
RAW_DIR.mkdir(parents=True, exist_ok=True)

START_DATE = "2017-01-01"

# Yahoo end date is exclusive, so use tomorrow.
END_DATE = (date.today() + timedelta(days=1)).isoformat()


# ==========================================
# HELPER: STANDARDIZE DATA
# ==========================================

def standardize_data(data, ticker=None):

    data = data.reset_index()

    if isinstance(data.columns, pd.MultiIndex):
        data.columns = [
            col[0] for col in data.columns
        ]

    data.columns = [str(c) for c in data.columns]

    if "Datetime" in data.columns and "Date" not in data.columns:
        data.rename(columns={"Datetime": "Date"}, inplace=True)

    if "date" in data.columns:
        data.rename(columns={"date": "Date"}, inplace=True)

    if "symbol" in data.columns:
        data.rename(columns={"symbol": "Symbol"}, inplace=True)

    if "Date" not in data.columns:
        raise ValueError("Date column missing")

    data["Date"] = pd.to_datetime(
        data["Date"], errors="coerce", utc=True
    ).dt.strftime("%Y-%m-%d")

    data = data.dropna(subset=["Date"])

    if ticker:
        data["Symbol"] = ticker

    return data


# ==========================================
# HELPER: SAFE INCREMENTAL SAVE
# ==========================================

def save_incremental(new_data, filename, keys):

    filepath = RAW_DIR / filename

    if new_data is None or new_data.empty:
        print(f"No new data for {filename}. Existing file preserved.")
        return False

    new_data = new_data.copy()

    if filepath.exists():

        old_data = pd.read_csv(filepath, low_memory=False)

        if "date" in old_data.columns:
            old_data.rename(
                columns={"date": "Date"}, inplace=True
            )

        if "symbol" in old_data.columns:
            old_data.rename(
                columns={"symbol": "Symbol"}, inplace=True
            )

        if "Date" in old_data.columns:
            old_data["Date"] = pd.to_datetime(
                old_data["Date"], errors="coerce", utc=True
            ).dt.strftime("%Y-%m-%d")

        combined = pd.concat(
            [old_data, new_data],
            ignore_index=True,
            sort=False
        )

    else:
        combined = new_data

    combined = combined.dropna(subset=keys)

    combined = combined.drop_duplicates(
        subset=keys,
        keep="last"
    )

    combined = combined.sort_values(keys)

    # Timestamped backup before replacing existing file.
    if filepath.exists():

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        backup = filepath.with_name(
            filepath.stem + "_backup_" +
            timestamp + filepath.suffix
        )

        shutil.copy2(filepath, backup)
        print("Backup:", backup)

    # Save to temporary file and replace atomically.
    temp_path = filepath.with_suffix(".tmp")

    combined.to_csv(temp_path, index=False)
    os.replace(temp_path, filepath)

    print(f"Saved: {filepath}")
    print("Total rows:", len(combined))
    print("Latest date:", combined["Date"].max())

    return True


# ==========================================
# HELPER: DOWNLOAD YAHOO DATA
# ==========================================

def download_yahoo_data(ticker, filename):

    print(f"\nDownloading {ticker}...")

    try:

        data = yf.download(
            ticker,
            start=START_DATE,
            end=END_DATE,
            auto_adjust=False,
            progress=False,
            threads=False
        )

        if data.empty:
            print("No data received. Existing file preserved.")
            return False

        data = standardize_data(data)

        return save_incremental(
            data,
            filename,
            ["Date"]
        )

    except Exception as e:

        print(f"Download failed: {e}")
        print("Existing file preserved.")
        return False


# ==========================================
# 1. NIFTY 50
# ==========================================

print("\n========== NIFTY 50 ==========")

download_yahoo_data(
    "^NSEI",
    "nifty50_raw.csv"
)


# ==========================================
# 2. NSE STOCKS
# ==========================================

stocks = {
    "RELIANCE": "RELIANCE.NS",
    "TCS": "TCS.NS",
    "INFY": "INFY.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "ITC": "ITC.NS",
    "SBIN": "SBIN.NS",
    "LT": "LT.NS"
}

all_stocks = []

print("\n========== NSE STOCKS ==========")

for name, ticker in stocks.items():

    print(f"\nDownloading {name}...")

    try:

        data = yf.download(
            ticker,
            start=START_DATE,
            end=END_DATE,
            auto_adjust=False,
            progress=False,
            threads=False
        )

        if data.empty:
            print("No data received. Skipping.")
            continue

        data = standardize_data(data, name)

        all_stocks.append(data)

        print("Downloaded:", len(data), "rows")

    except Exception as e:

        print(f"Failed {name}: {e}")


if all_stocks:

    stocks_df = pd.concat(
        all_stocks,
        ignore_index=True,
        sort=False
    )

    save_incremental(
        stocks_df,
        "nse_stocks_raw.csv",
        ["Date", "Symbol"]
    )

else:

    print("No stock downloads succeeded. Existing file preserved.")


# ==========================================
# 3. GOLD
# ==========================================

print("\n========== GOLD ==========")

download_yahoo_data(
    "GC=F",
    "gold_raw.csv"
)


# ==========================================
# 4. USD / INR
# ==========================================

print("\n========== USD / INR ==========")

download_yahoo_data(
    "INR=X",
    "usd_inr_raw.csv"
)


# ==========================================
# 5. INDIA VIX
# ==========================================

print("\n========== INDIA VIX ==========")

download_yahoo_data(
    "^INDIAVIX",
    "india_vix_raw.csv"
)


# ==========================================
# 6. CHECK NON-YAHOO DATASETS
# ==========================================

print("\n========== OTHER DATASETS ==========")

other_files = [
    "delhi_petrol_raw.csv",
    "delhi_diesel_raw.csv",
    "indian_basket_crude_raw.xlsx"
]

for filename in other_files:

    filepath = RAW_DIR / filename

    if not filepath.exists():
        print(filename, "- MISSING")
        continue

    try:

        if filepath.suffix == ".xlsx":
            df = pd.read_excel(filepath)
        else:
            df = pd.read_csv(filepath)

        print(
            filename,
            "| Rows:", len(df),
            "| Columns:", len(df.columns)
        )

    except Exception as e:

        print(filename, "| Read error:", e)


# ==========================================
# FINAL STATUS
# ==========================================

print("\n===================================")
print("FINAURA DOWNLOAD PROCESS COMPLETED")
print("===================================")

print("Start date:", START_DATE)
print("End date (exclusive):", END_DATE)

print("""
IMPORTANT:

1. Existing historical data is preserved.
2. Duplicate dates are removed.
3. Failed downloads do not overwrite existing files.
4. Fuel datasets require a separate verified source.
5. Indian Basket Crude remains monthly data.
6. TejHQ data is kept separate.
""")
