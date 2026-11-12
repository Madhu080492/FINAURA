
import os
import yfinance as yf
import pandas as pd
from datetime import datetime

STOCKS = {
    "HDFCBANK": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "INFY": "INFY.NS",
    "ITC": "ITC.NS",
    "LT": "LT.NS",
    "RELIANCE": "RELIANCE.NS",
    "SBIN": "SBIN.NS",
    "TCS": "TCS.NS"
}

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

OUTPUT_DIR = os.path.join(
    BASE_DIR, "data", "raw", "latest_market"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)


def fetch_stock_data(symbol, ticker):
    print(f"Fetching {symbol}...")

    data = yf.download(
        ticker,
        period="6mo",
        interval="1d",
        auto_adjust=False,
        progress=False
    )

    if data.empty:
        print(f"No data available for {symbol}")
        return None

    if isinstance(data.columns, pd.MultiIndex):
        data.columns = data.columns.get_level_values(0)

    required = ["Open", "High", "Low", "Close", "Volume"]

    missing = [col for col in required if col not in data.columns]

    if missing:
        print(f"Missing columns for {symbol}: {missing}")
        return None

    data = data[required].copy()
    data = data.dropna()
    data.index.name = "date"

    data = data.reset_index()
    data["symbol"] = symbol
    data["source"] = "Yahoo Finance"
    data["fetched_at"] = datetime.now().astimezone().isoformat()

    output_file = os.path.join(
        OUTPUT_DIR, f"{symbol}_latest.csv"
    )

    data.to_csv(output_file, index=False)

    print(f"Saved: {output_file}")
    print(f"Latest date: {data['date'].max()}")
    print(f"Rows: {len(data)}")

    return data


def fetch_all_stocks():
    results = []

    for symbol, ticker in STOCKS.items():
        try:
            data = fetch_stock_data(symbol, ticker)

            if data is not None:
                results.append(data)

        except Exception as error:
            print(f"Error fetching {symbol}: {error}")

    if results:
        combined = pd.concat(results, ignore_index=True)

        combined_file = os.path.join(
            OUTPUT_DIR, "all_stocks_latest.csv"
        )

        combined.to_csv(combined_file, index=False)

        print("\nAll stock downloads completed.")
        print(f"Combined file: {combined_file}")
        print(f"Total rows: {len(combined)}")
    else:
        print("No stock data was downloaded.")


if __name__ == "__main__":
    fetch_all_stocks()
