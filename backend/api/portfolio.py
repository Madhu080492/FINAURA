
import json
import numpy as np
import pandas as pd

from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_FILE = BASE_DIR / "data" / "processed" / "finaura_master_dataset.csv"
PORTFOLIO_FILE = BASE_DIR / "data" / "processed" / "saved_portfolio.json"

df = pd.read_csv(DATA_FILE, low_memory=False)
df["date"] = pd.to_datetime(df["date"], errors="coerce")

SUPPORTED_STOCKS = [
    "HDFCBANK", "ICICIBANK", "INFY", "ITC",
    "LT", "RELIANCE", "SBIN", "TCS"
]

DEFAULT_HOLDINGS = [
    {"symbol": "RELIANCE", "quantity": 2},
    {"symbol": "HDFCBANK", "quantity": 3}
]


class Holding(BaseModel):
    symbol: str
    quantity: float = Field(gt=0)


class PortfolioRequest(BaseModel):
    holdings: list[Holding]


def validate_holdings(holdings):
    if not holdings:
        raise HTTPException(
            status_code=400,
            detail="Add at least one stock"
        )

    symbols = [h.symbol.upper() for h in holdings]

    if len(symbols) != len(set(symbols)):
        raise HTTPException(
            status_code=400,
            detail="Duplicate stocks are not allowed"
        )

    unsupported = [
        symbol for symbol in symbols
        if symbol not in SUPPORTED_STOCKS
    ]

    if unsupported:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported stocks: {unsupported}"
        )

    return symbols


def save_holdings(holdings):
    PORTFOLIO_FILE.parent.mkdir(parents=True, exist_ok=True)

    data = {
        "holdings": [
            {
                "symbol": holding.symbol.upper(),
                "quantity": holding.quantity
            }
            for holding in holdings
        ]
    }

    PORTFOLIO_FILE.write_text(
        json.dumps(data, indent=4),
        encoding="utf-8"
    )


@router.get("/portfolio")
def get_portfolio():
    if not PORTFOLIO_FILE.exists():
        return {
            "holdings": DEFAULT_HOLDINGS,
            "saved": False
        }

    try:
        data = json.loads(
            PORTFOLIO_FILE.read_text(encoding="utf-8")
        )

        holdings = [
            Holding(**item)
            for item in data.get("holdings", [])
        ]

        validate_holdings(holdings)

        return {
            "holdings": [
                {
                    "symbol": holding.symbol.upper(),
                    "quantity": holding.quantity
                }
                for holding in holdings
            ],
            "saved": True
        }

    except (json.JSONDecodeError, ValueError, TypeError):
        raise HTTPException(
            status_code=500,
            detail="Saved portfolio file is invalid"
        )


@router.put("/portfolio")
def update_portfolio(request: PortfolioRequest):
    holdings = request.holdings

    validate_holdings(holdings)
    save_holdings(holdings)

    return {
        "message": "Portfolio saved successfully",
        "holdings": [
            {
                "symbol": holding.symbol.upper(),
                "quantity": holding.quantity
            }
            for holding in holdings
        ]
    }


@router.post("/portfolio/risk")
def portfolio_risk(request: PortfolioRequest):

    holdings = request.holdings
    symbols = validate_holdings(holdings)

    portfolio_data = []
    total_value = 0

    for holding in holdings:
        symbol = holding.symbol.upper()

        asset = df[
            df["symbol"].str.upper() == symbol
        ].copy()

        asset = asset.sort_values("date")
        asset = asset.dropna(subset=["close"])

        if asset.empty:
            raise HTTPException(
                status_code=400,
                detail=f"No price data available for {symbol}"
            )

        latest = asset.iloc[-1]

        market_value = float(latest["close"]) * holding.quantity
        total_value += market_value

        portfolio_data.append({
            "symbol": symbol,
            "quantity": holding.quantity,
            "latest_price": round(float(latest["close"]), 2),
            "market_value": round(market_value, 2)
        })

    returns_data = df[
        df["symbol"].str.upper().isin(symbols)
    ][["date", "symbol", "daily_return"]].copy()

    returns_data["symbol"] = returns_data["symbol"].str.upper()

    returns_pivot = returns_data.pivot(
        index="date",
        columns="symbol",
        values="daily_return"
    )

    returns_pivot = returns_pivot[symbols].dropna().tail(252)

    if len(returns_pivot) < 60:
        raise HTTPException(
            status_code=400,
            detail="Insufficient common historical data for portfolio analysis"
        )

    weights = np.array([
        item["market_value"] / total_value
        for item in portfolio_data
    ])

    daily_returns = returns_pivot.to_numpy()
    portfolio_returns = daily_returns @ weights

    daily_volatility = float(
        np.std(portfolio_returns, ddof=1)
    )

    var_95 = max(
        0,
        -float(np.quantile(portfolio_returns, 0.05)) * total_value
    )

    covariance = np.atleast_2d(
        np.cov(daily_returns, rowvar=False)
    )

    rng = np.random.default_rng(42)

    simulations = rng.multivariate_normal(
        mean=np.mean(daily_returns, axis=0),
        cov=covariance,
        size=(10000, 5)
    )

    simulated_portfolio_returns = simulations @ weights

    five_day_returns = np.prod(
        1 + simulated_portfolio_returns,
        axis=1
    ) - 1

    five_day_losses = -five_day_returns * total_value

    monte_carlo_var = max(
        0,
        float(np.quantile(five_day_losses, 0.95))
    )

    return {
        "portfolio_value": round(total_value, 2),
        "number_of_stocks": len(symbols),
        "historical_days_used": len(returns_pivot),
        "daily_volatility_percentage": round(
            daily_volatility * 100, 2
        ),
        "historical_95_percent_var": round(var_95, 2),
        "monte_carlo_5_day_95_percent_var": round(
            monte_carlo_var, 2
        ),
        "monte_carlo_simulations": 10000,
        "holdings": portfolio_data,
        "note": "Illustrative historical and simulated risk estimates, not guaranteed losses or investment advice."
    }
