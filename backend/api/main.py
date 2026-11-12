
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from pathlib import Path

app = FastAPI(
    title="FINAURA API",
    description="Multi-Asset Financial Risk Forecasting System",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parents[2]

DATA_FILE = BASE_DIR / "data" / "processed" / "finaura_master_dataset.csv"

df = pd.read_csv(DATA_FILE, low_memory=False)
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df = df.dropna(subset=["date"])

@app.get("/")
def home():
    return {
        "project": "FINAURA",
        "message": "FINAURA API is running",
        "status": "active"
    }



@app.get("/assets")
def get_assets():
    assets = []

    for symbol, group in df.groupby("symbol"):
        group = group.sort_values("date")
        latest = group.iloc[-1]

        close = latest.get("close")
        daily_return = latest.get("daily_return")

        assets.append({
            "symbol": symbol,
            "asset_class": latest.get("asset_class"),
            "latest_date": latest["date"].strftime("%Y-%m-%d"),
            "close": None if pd.isna(close) else float(close),
            "daily_return": None if pd.isna(daily_return) else float(daily_return),
            "records": len(group)
        })

    return {
        "total_assets": len(assets),
        "assets": assets
    }



@app.get("/asset/{symbol}")
def get_asset(symbol: str):
    asset = df[df["symbol"].str.upper() == symbol.upper()]

    if asset.empty:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    latest = asset.sort_values("date").iloc[-1]

    return {
        "symbol": symbol.upper(),
        "date": latest["date"].strftime("%Y-%m-%d"),
        "close": None if pd.isna(latest.get("close")) else float(latest["close"]),
        "daily_return": None if pd.isna(latest.get("daily_return")) else float(latest["daily_return"]),
        "asset_class": latest.get("asset_class")
    }


@app.get("/history/{symbol}")
def get_history(symbol: str, limit: int = 30):
    if limit < 1 or limit > 1000:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 1000"
        )

    asset = df[df["symbol"].str.upper() == symbol.upper()]

    if asset.empty:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    asset = asset.sort_values("date").tail(limit)

    records = asset[
        ["date", "close", "daily_return"]
    ].copy()

    records["date"] = records["date"].dt.strftime("%Y-%m-%d")
    records = records.astype(object).where(pd.notna(records), None)

    return {
        "symbol": symbol.upper(),
        "count": len(records),
        "history": records.to_dict(orient="records")
    }

from backend.api.risk import router as risk_router
from backend.api.portfolio import router as portfolio_router

app.include_router(risk_router)
app.include_router(portfolio_router)
