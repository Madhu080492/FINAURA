import yfinance as yf
import pandas as pd
import os

# ==========================================
# FINAURA - FINAL MARKET DATA DOWNLOADER
# ==========================================

# Create folders
RAW_DIR = "data/raw"
os.makedirs(RAW_DIR, exist_ok=True)

START_DATE = "2017-01-01"
END_DATE = "2026-09-03"


# ==========================================
# HELPER FUNCTION
# ==========================================

def download_yahoo_data(ticker, filename):
    print(f"\nDownloading {filename}...")

    try:
        data = yf.download(
            ticker,
            start=START_DATE,
            end=END_DATE,
            auto_adjust=False,
            progress=False
        )

        if data.empty:
            print(f"✗ No data received for {ticker}")
            return False

        data = data.reset_index()

        # Flatten multi-level columns
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = [
                col[0] if col[0] else col[1]
                for col in data.columns
            ]

        filepath = os.path.join(RAW_DIR, filename)

        data.to_csv(filepath, index=False)

        print(f"✓ Saved: {filepath}")
        print(f"  Rows: {len(data)}")
        print(f"  Columns: {len(data.columns)}")

        return True

    except Exception as e:
        print(f"✗ Error downloading {ticker}: {e}")
        return False


# ==========================================
# 1. NIFTY 50
# ==========================================

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

print("\n==========================================")
print("Downloading NSE Stocks")
print("==========================================")

for name, ticker in stocks.items():

    print(f"\nDownloading {name}...")

    try:

        data = yf.download(
            ticker,
            start=START_DATE,
            end=END_DATE,
            auto_adjust=False,
            progress=False
        )

        if data.empty:
            print(f"✗ No data for {name}")
            continue

        data = data.reset_index()

        # Flatten columns
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = [
                col[0] if col[0] else col[1]
                for col in data.columns
            ]

        data["Symbol"] = name

        all_stocks.append(data)

        print(f"✓ {name} downloaded")

    except Exception as e:
        print(f"✗ Error downloading {name}: {e}")


if all_stocks:

    stocks_df = pd.concat(
        all_stocks,
        ignore_index=True
    )

    columns = [
        "Date",
        "Symbol",
        "Open",
        "High",
        "Low",
        "Close",
        "Adj Close",
        "Volume"
    ]

    stocks_df = stocks_df[
        [col for col in columns if col in stocks_df.columns]
    ]

    stocks_df.to_csv(
        os.path.join(RAW_DIR, "nse_stocks_raw.csv"),
        index=False
    )

    print("\n✓ NSE stocks saved successfully")

else:

    print("\n✗ No stock data downloaded")


# ==========================================
# 3. GOLD
# ==========================================

download_yahoo_data(
    "GC=F",
    "gold_raw.csv"
)


# ==========================================
# 4. USD / INR
# ==========================================

download_yahoo_data(
    "INR=X",
    "usd_inr_raw.csv"
)


# ==========================================
# 5. INDIA VIX
# ==========================================

print("\n==========================================")
print("Downloading India VIX")
print("==========================================")

download_yahoo_data(
    "^INDIAVIX",
    "india_vix_raw.csv"
)


# ==========================================
# 6. CHECK FUEL DATASETS
# ==========================================

print("\n==========================================")
print("Checking Fuel Datasets")
print("==========================================")

fuel_files = {
    "Indian Basket Crude":
        "indian_basket_crude_raw.csv",

    "Delhi Petrol":
        "delhi_petrol_raw.csv",

    "Delhi Diesel":
        "delhi_diesel_raw.csv"
}

for dataset_name, filename in fuel_files.items():

    filepath = os.path.join(
        RAW_DIR,
        filename
    )

    if os.path.exists(filepath):

        try:
            df = pd.read_csv(filepath)

            print(
                f"✓ {dataset_name}: "
                f"{len(df)} rows, "
                f"{len(df.columns)} columns"
            )

        except Exception as e:

            print(
                f"⚠ {dataset_name} exists "
                f"but could not be read: {e}"
            )

    else:

        print(
            f"⚠ {dataset_name}: NOT FOUND"
        )


# ==========================================
# FINAL STATUS
# ==========================================

print("\n==========================================")
print("FINAURA DATA DOWNLOAD CHECK COMPLETE")
print("==========================================")

print("\nExpected files:")

expected_files = [
    "nifty50_raw.csv",
    "nse_stocks_raw.csv",
    "gold_raw.csv",
    "usd_inr_raw.csv",
    "india_vix_raw.csv",
    "indian_basket_crude_raw.csv",
    "delhi_petrol_raw.csv",
    "delhi_diesel_raw.csv"
]

for i, filename in enumerate(expected_files, 1):

    filepath = os.path.join(
        RAW_DIR,
        filename
    )

    if os.path.exists(filepath):
        print(f"{i}. ✓ {filename}")
    else:
        print(f"{i}. ✗ {filename} - MISSING")


print("\n==========================================")
print("NEXT STEP")
print("==========================================")

print("""
Main ML target:
Next 5-trading-day realized volatility

Statistical benchmark:
GARCH

Additional module:
Fuel price analysis / forecasting

Important:
Indian Basket Crude is monthly data.
Do NOT artificially convert it into daily
values without documenting a valid method.
""")