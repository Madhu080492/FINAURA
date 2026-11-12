
import joblib
import pandas as pd

MODEL_PATH = "notebooks/models/finaura_extra_trees.pkl"
DATA_PATH = "data/processed/nse_stocks_processed.csv"

FEATURES = [
    "daily_return", "log_return", "intraday_return", "price_range",
    "ma_5", "ma_10", "ma_20", "ma_50",
    "volatility_5d", "volatility_10d", "volatility_20d",
    "momentum_5d", "momentum_20d", "drawdown"
]


def predict_risk(symbol):
    model = joblib.load(MODEL_PATH)
    df = pd.read_csv(DATA_PATH)

    df["symbol"] = df["symbol"].astype(str).str.upper()
    stock = df[df["symbol"] == symbol.upper()].copy()

    if stock.empty:
        print("Stock not found. Available symbols:")
        print(sorted(df["symbol"].unique()))
        return

    stock["date"] = pd.to_datetime(stock["date"])
    stock = stock.sort_values("date")
    latest = stock.iloc[[-1]]

    if latest[FEATURES].isna().any().any():
        print("Latest row contains missing feature values.")
        return

    prediction = float(model.predict(latest[FEATURES])[0])

    print("\n===== FINAURA RISK FORECAST =====")
    print("Stock:", symbol.upper())
    print("Latest data date:", latest["date"].iloc[0].date())
    print("Forecast horizon: Next 5 trading days")
    print(f"Annualized volatility estimate: {prediction:.4f}")
    print(f"Percentage equivalent: {prediction * 100:.2f}%")
    print("Note: This is a model estimate, not a guarantee.")


if __name__ == "__main__":
    predict_risk("RELIANCE")
