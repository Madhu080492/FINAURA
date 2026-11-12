
<div align="center">

# 💹 FINAURA

### Multi-Asset Financial Risk Forecasting System

**Understand Market Volatility. Explore Portfolio Risk.**

[![Python](https://img.shields.io/badge/Python-3.14-blue?logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Machine Learning](https://img.shields.io/badge/Machine%20Learning-Extra%20Trees-orange)](https://scikit-learn.org/)

</div>

---


# FINAURA
### Multi-Asset Financial Risk Forecasting System

FINAURA is an educational financial risk forecasting and portfolio analysis system developed as an integrated AIML project. It combines data processing, machine learning, statistical analysis, and interactive visualization to help users explore market behaviour and understand potential portfolio risks.

Rather than predicting stock prices, FINAURA focuses on forecasting market volatility and estimating portfolio risk.

---

## 1. Project Objectives

- Collect and integrate financial market data from multiple asset categories.
- Perform data cleaning, preprocessing, and exploratory data analysis.
- Forecast the next five trading days' annualized volatility using machine learning.
- Estimate portfolio risk using historical and Monte Carlo methods.
- Provide an interactive dashboard for market monitoring and portfolio analysis.
- Support daily NSE stock data updates.

---

## 2. Key Features

### Market Watch
- View the latest available market records.
- Search and filter supported assets.
- Sort assets by symbol, price, change, and date.
- Display asset prices and available historical records.

### Machine Learning Risk Forecasting
- Uses an Extra Trees Regressor.
- Predicts annualized volatility for the next five trading days.
- Displays predicted volatility as a percentage.
- Compares predictions against a configurable high-volatility threshold.
- Provides predictions for eight supported NSE stocks.

### Portfolio Management
- Add and remove stock holdings.
- Update holding quantities.
- Save portfolio information locally.
- Calculate total portfolio market value.

### Portfolio Risk Analysis
- Calculate historical daily portfolio volatility.
- Estimate historical 95% Value at Risk (VaR).
- Estimate five-day 95% Monte Carlo VaR.
- Run 10,000 Monte Carlo simulations.

---

## 3. Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, JavaScript, CSS |
| Build Tool | Vite |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python, FastAPI |
| Data Processing | Pandas, NumPy |
| Machine Learning | Scikit-learn, Extra Trees Regressor |
| Model Storage | Joblib |
| Data Storage | CSV, JSON |
| API Data Source | TejHQ |

---

## 4. Machine Learning Model

FINAURA uses an **Extra Trees Regressor** to forecast future market volatility.

**Prediction Target:**

`target_5d_volatility`

The target represents annualized realized volatility over the next five trading days.

**Forecast Horizon:** Next 5 trading days

**Model Configuration:**

- Number of estimators: 200
- Maximum depth: 12
- Minimum samples per leaf: 10
- Random state: 42
- Annualization factor: 252

**Input Features (14):**

1. daily_return
2. log_return
3. intraday_return
4. price_range
5. ma_5
6. ma_10
7. ma_20
8. ma_50
9. volatility_5d
10. volatility_10d
11. volatility_20d
12. momentum_5d
13. momentum_20d
14. drawdown

**Supported Prediction Assets:**

HDFCBANK, ICICIBANK, INFY, ITC, LT, RELIANCE, SBIN, TCS.

**High-Volatility Threshold:** Approximately 38.43% annualized volatility.

The model predicts volatility, not future stock prices or guaranteed financial losses.

---

## 5. Statistical Risk Analysis

FINAURA combines statistical calculations with machine learning.

### Historical Portfolio Volatility
Measures the standard deviation of historical portfolio daily returns.

### Historical 95% VaR
Uses the fifth percentile of historical portfolio returns to estimate a one-day loss threshold.

### Monte Carlo VaR
Uses multivariate normal simulations based on historical return means and covariance.

- Simulations: 10,000
- Forecast horizon: 5 days
- Confidence level: 95%

These values are illustrative estimates and are not guaranteed loss predictions or investment advice.

---

## 6. Supported Asset Categories

The master dataset integrates 14 assets:

| Category | Assets |
|---|---|
| NSE Stocks | HDFCBANK, ICICIBANK, INFY, ITC, LT, RELIANCE, SBIN, TCS |
| Gold | GOLD |
| Market Volatility | INDIA_VIX |
| Currency | USDINR |
| Crude Oil | INDIAN_BASKET_CRUDE |
| Fuel Prices | DELHI_PETROL, DELHI_DIESEL |

Note: The current machine learning risk prediction endpoint supports the eight NSE stocks listed above. Other assets are included in the integrated dataset and market analysis workflow.

---

## 7. Project Structure

```text
FINAURA/
│
├── backend/
│   ├── api/
│   │   ├── main.py
│   │   ├── market_data.py
│   │   ├── portfolio.py
│   │   └── risk.py
│   │
│   └── data_fetchers/
│       ├── process_latest_stocks.py
│       └── stocks.py
│
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│
├── data/
│   ├── raw/
│   └── processed/
│       ├── finaura_master_dataset.csv
│       └── saved_portfolio.json
│
├── notebooks/
│   ├── preprocessing notebooks
│   ├── EDA notebooks
│   ├── model experiment notebooks
│   └── models/
│       ├── finaura_extra_trees.pkl
│       └── finaura_model_metadata.json
│
├── download_data.py
├── build_master_dataset.py
├── merge_master_dataset.py
├── update_market.py
├── update_master_dataset.py
├── predict_risk.py
├── validate_master_dataset.py
└── README.md
```

---

## 8. Installation and Setup

### Prerequisites

- Python 3.11 or compatible Python version
- Node.js and npm
- Git (optional)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd FINAURA
```

### Step 2: Install Python Dependencies

```bash
py -m pip install fastapi uvicorn pandas numpy joblib scikit-learn==1.7.2
```

### Step 3: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 4: Start the Backend

Open a terminal in the project root:

```bash
py -m uvicorn backend.api.main:app --reload
```

Backend:

`http://127.0.0.1:8000`

API Documentation:

`http://127.0.0.1:8000/docs`

### Step 5: Start the Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

Frontend:

`http://localhost:5173/`

---

## 9. Updating Market Data

FINAURA provides a market update workflow for supported NSE stocks.

Run this command from the project root:

```bash
py update_market.py
```

The update process:

1. Fetches daily OHLCV data for eight NSE stocks from TejHQ.
2. Validates the fetched records.
3. Saves the latest fetched data.
4. Updates the master dataset when newer records are available.
5. Preserves a timestamped backup before updating the master dataset.

The data source provides daily market records; it should not be interpreted as an intraday real-time feed.

---

## 10. Generate a Risk Prediction

Run the prediction script from the project root:

```bash
py predict_risk.py
```

The script displays the latest available data date, predicted annualized volatility, forecast horizon, high-volatility threshold, and risk status.

---

## 11. Disclaimer

FINAURA is an academic and educational project developed for financial data analysis and risk forecasting.

All forecasts, portfolio metrics, and simulations are illustrative estimates based on available historical data and model assumptions. They do not guarantee future market performance or losses and should not be treated as investment advice.

---

## 12. Project Purpose

FINAURA demonstrates the integration of Software Engineering, Data Visualization, Machine Learning, Probability, and Statistics into a single financial risk analysis application.
