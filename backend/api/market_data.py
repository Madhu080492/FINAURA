
import csv
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]

RAW_DIR = BASE_DIR / "data" / "raw"
OUTPUT_FILE = RAW_DIR / "tejhq_nse_latest.csv"
STATUS_FILE = RAW_DIR / "tejhq_status.json"

API_BASE = "https://api.tejhq.dev/v1"

STOCK_SYMBOLS = [
    "HDFCBANK",
    "ICICIBANK",
    "INFY",
    "ITC",
    "LT",
    "RELIANCE",
    "SBIN",
    "TCS",
]

REQUIRED_FIELDS = [
    "date",
    "open",
    "high",
    "low",
    "close",
    "volume",
]


def fetch_stock_data(symbol):
    url = f"{API_BASE}/ohlcv/nse/{symbol}"

    request = urllib.request.Request(
        url,
        headers={"User-Agent": "FINAURA-Educational-Project/1.0"}
    )

    with urllib.request.urlopen(request, timeout=20) as response:
        result = json.loads(response.read().decode("utf-8"))

    rows = result.get("data", [])

    if not rows:
        raise ValueError(f"No data returned for {symbol}")

    fetched_at = datetime.now(timezone.utc).isoformat()

    validated_rows = []

    for row in rows:
        if not all(field in row for field in REQUIRED_FIELDS):
            raise ValueError(f"Missing OHLCV fields for {symbol}")

        if any(row[field] is None for field in REQUIRED_FIELDS):
            raise ValueError(f"Null OHLCV value for {symbol}")

        open_price = float(row["open"])
        high_price = float(row["high"])
        low_price = float(row["low"])
        close_price = float(row["close"])
        volume = int(row["volume"])

        if min(open_price, high_price, low_price, close_price) <= 0:
            raise ValueError(f"Invalid price for {symbol}")

        if high_price < max(open_price, low_price, close_price):
            raise ValueError(f"Invalid high price for {symbol}")

        if low_price > min(open_price, high_price, close_price):
            raise ValueError(f"Invalid low price for {symbol}")

        if volume < 0:
            raise ValueError(f"Invalid volume for {symbol}")

        validated_rows.append({
            "date": row["date"],
            "symbol": symbol,
            "exchange": "NSE",
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "close": close_price,
            "volume": volume,
            "turnover": row.get("turnover"),
            "trades": row.get("trades"),
            "source": "TejHQ",
            "fetched_at_utc": fetched_at,
        })

    validated_rows.sort(key=lambda item: item["date"])

    dates = [row["date"] for row in validated_rows]

    if len(dates) != len(set(dates)):
        raise ValueError(f"Duplicate dates found for {symbol}")

    return validated_rows


def fetch_all_stocks():
    all_rows = []
    summary = []

    print("\n===== FINAURA STOCK DATA UPDATE =====\n")

    for symbol in STOCK_SYMBOLS:
        print(f"Fetching {symbol}...")

        rows = fetch_stock_data(symbol)
        all_rows.extend(rows)

        latest = rows[-1]

        summary.append({
            "symbol": symbol,
            "latest_date": latest["date"],
            "latest_close": latest["close"],
            "records": len(rows),
            "status": "SUCCESS",
        })

        print(
            f"SUCCESS | {symbol} | "
            f"{latest['date']} | "
            f"Close: {latest['close']} | "
            f"Records: {len(rows)}"
        )

    RAW_DIR.mkdir(parents=True, exist_ok=True)

    fieldnames = list(all_rows[0].keys())
    temp_file = OUTPUT_FILE.with_suffix(".tmp")

    with open(temp_file, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_rows)

    temp_file.replace(OUTPUT_FILE)

    status = {
        "provider": "TejHQ",
        "exchange": "NSE",
        "symbols": STOCK_SYMBOLS,
        "total_records": len(all_rows),
        "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
        "stocks": summary,
    }

    with open(STATUS_FILE, "w", encoding="utf-8") as file:
        json.dump(status, file, indent=4)

    print("\n===== UPDATE COMPLETED =====")
    print(f"Total stocks: {len(summary)}")
    print(f"Total records: {len(all_rows)}")
    print(f"CSV saved: {OUTPUT_FILE}")
    print(f"Status saved: {STATUS_FILE}")


if __name__ == "__main__":
    try:
        fetch_all_stocks()
    except Exception as error:
        print("\nUPDATE FAILED")
        print(f"Reason: {error}")
        raise

