
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Activity,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Wallet,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import "./App.css";

const API = "http://127.0.0.1:8000";

const STOCK_SYMBOLS = [
  "HDFCBANK",
  "ICICIBANK",
  "INFY",
  "ITC",
  "LT",
  "RELIANCE",
  "SBIN",
  "TCS",
];

const INITIAL_HOLDINGS = [
  { symbol: "RELIANCE", quantity: 2 },
  { symbol: "HDFCBANK", quantity: 3 },
];

function App() {
  const [activePage, setActivePage] = useState("overview");

  const [assets, setAssets] = useState([]);
  const [risks, setRisks] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [history, setHistory] = useState([]);

  const [holdingsInput, setHoldingsInput] = useState(INITIAL_HOLDINGS);
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
  const [quantity, setQuantity] = useState("1");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [marketSearch, setMarketSearch] = useState("");
  const [marketCategory, setMarketCategory] = useState("ALL");
  const [marketSort, setMarketSort] = useState("symbol");

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value || 0);

  const loadDashboard = async (currentHoldings = holdingsInput) => {
    if (!currentHoldings.length) {
      setError("Please add at least one stock to your portfolio.");
      return;
    }

    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const [assetsRes, portfolioRes, historyRes] = await Promise.all([
        fetch(`${API}/assets`),

        fetch(`${API}/portfolio/risk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            holdings: currentHoldings,
          }),
        }),

        fetch(`${API}/history/RELIANCE?limit=30`),
      ]);

      if (!assetsRes.ok) {
        throw new Error("Could not load market assets.");
      }

      if (!portfolioRes.ok) {
        const errorData = await portfolioRes.json();
        throw new Error(
          errorData.detail
            ? JSON.stringify(errorData.detail)
            : "Portfolio calculation failed."
        );
      }

      if (!historyRes.ok) {
        throw new Error("Could not load price history.");
      }

      const assetsData = await assetsRes.json();
      const portfolioData = await portfolioRes.json();
      const historyData = await historyRes.json();

      setAssets(assetsData.assets || []);
      setPortfolio(portfolioData);

      setHistory(
        (historyData.history || []).map((item) => ({
          ...item,
          date: item.date.slice(5),
        }))
      );

      const riskResults = await Promise.allSettled(
        STOCK_SYMBOLS.map(async (symbol) => {
          const response = await fetch(`${API}/risk/${symbol}`);

          if (!response.ok) {
            throw new Error(symbol);
          }

          return response.json();
        })
      );

      setRisks(
        riskResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value)
      );

      setSuccess("Portfolio risk analysis updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to connect to FINAURA backend.");
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const response = await fetch(`${API}/portfolio`);

        if (!response.ok) {
          throw new Error("Could not load saved portfolio.");
        }

        const data = await response.json();

        const savedHoldings = data.holdings?.length
          ? data.holdings
          : INITIAL_HOLDINGS;

        setHoldingsInput(savedHoldings);

        await loadDashboard(savedHoldings);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const addHolding = () => {
    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Please enter a valid positive whole-number quantity.");
      return;
    }

    setError("");
    setSuccess("");

    setHoldingsInput((previous) => {
      const existing = previous.find(
        (item) => item.symbol === selectedSymbol
      );

      if (existing) {
        return previous.map((item) =>
          item.symbol === selectedSymbol
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }

      return [
        ...previous,
        {
          symbol: selectedSymbol,
          quantity: qty,
        },
      ];
    });

    setQuantity("1");
  };

  const removeHolding = (symbol) => {
    setHoldingsInput((previous) =>
      previous.filter((item) => item.symbol !== symbol)
    );

    setError("");
    setSuccess("");
  };

  const updatePortfolio = async () => {
    if (holdingsInput.length === 0) {
      setError("Please add at least one stock.");
      return;
    }

    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const saveResponse = await fetch(`${API}/portfolio`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          holdings: holdingsInput,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.detail || "Could not save portfolio.");
      }

      await loadDashboard(holdingsInput);

      setSuccess("Portfolio saved and risk analysis updated!");
    } catch (err) {
      setError(err.message);
      setUpdating(false);
    }
  };

  const availableStocks = STOCK_SYMBOLS.filter(
    (symbol) => !holdingsInput.some((item) => item.symbol === symbol)
  );

  const filteredAssets = assets
    .filter((asset) => {
      const matchesSearch = asset.symbol
        .toLowerCase()
        .includes(marketSearch.toLowerCase());

      const matchesCategory =
        marketCategory === "ALL" ||
        asset.asset_class === marketCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (marketSort) {
        case "price-high":
          return (b.close ?? -Infinity) - (a.close ?? -Infinity);

        case "price-low":
          return (a.close ?? Infinity) - (b.close ?? Infinity);

        case "change-high":
          return (b.daily_return ?? -Infinity) -
            (a.daily_return ?? -Infinity);

        case "change-low":
          return (a.daily_return ?? Infinity) -
            (b.daily_return ?? Infinity);

        case "date":
          return (b.latest_date || "").localeCompare(a.latest_date || "");

        default:
          return a.symbol.localeCompare(b.symbol);
      }
    });

  const maxRiskVolatility = Math.max(
    ...risks.map((item) => item.predicted_volatility_percentage),
    1
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">F</div>
          <span>FINAURA</span>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav>
          <button
            className={`nav-item ${activePage === "overview" ? "active" : ""}`}
            onClick={() => setActivePage("overview")}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>

          <button
            className={`nav-item ${activePage === "portfolio" ? "active" : ""}`}
            onClick={() => setActivePage("portfolio")}
          >
            <BriefcaseBusiness size={18} />
            Portfolio
          </button>

          <button
            className={`nav-item ${activePage === "market" ? "active" : ""}`}
            onClick={() => setActivePage("market")}
          >
            <Activity size={18} />
            Market Watch
          </button>

          <button
            className={`nav-item ${activePage === "risk" ? "active" : ""}`}
            onClick={() => setActivePage("risk")}
          >
            <ShieldCheck size={18} />
            Risk Analysis
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="status-dot"></div>
          <span>Backend connected</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">FINANCIAL INTELLIGENCE PLATFORM</p>
            <h1>
              {{
                overview: "Dashboard Overview",
                portfolio: "My Portfolio",
                market: "Market Watch",
                risk: "Risk Analysis",
              }[activePage]}
            </h1>
          </div>

          <button
            className="refresh-btn"
            onClick={() => loadDashboard()}
            disabled={updating}
          >
            <RefreshCw size={16} />
            {updating ? "Updating..." : "Refresh"}
          </button>
        </header>

        {error && <div className="error-box">{error}</div>}
        {success && <div className="success-box">{success}</div>}

        {loading ? (
          <div className="loading">Loading FINAURA dashboard...</div>
        ) : (
          <>
            {activePage === "overview" && (
              <>
                <section className="welcome-row">
                  <div>
                    <h2>Market insights at a glance.</h2>
                    <p>
                      Monitor your portfolio and understand market risk.
                    </p>
                  </div>

                  <span className="live-tag">
                    <span></span>
                    API CONNECTED
                  </span>
                </section>

                <section className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Portfolio Value</span>
                      <Wallet />
                    </div>
                    <h2>{money(portfolio?.portfolio_value)}</h2>
                    <p>Based on current holdings</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Daily Volatility</span>
                      <Activity />
                    </div>
                    <h2>{portfolio?.daily_volatility_percentage ?? 0}%</h2>
                    <p>Historical portfolio volatility</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Historical 95% VaR</span>
                      <ShieldCheck />
                    </div>
                    <h2>{money(portfolio?.historical_95_percent_var)}</h2>
                    <p>Estimated one-day risk</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <span>5-Day Monte Carlo VaR</span>
                      <TrendingUp />
                    </div>
                    <h2>
                      {money(portfolio?.monte_carlo_5_day_95_percent_var)}
                    </h2>
                    <p>10,000 simulated scenarios</p>
                  </div>
                </section>

                <section className="content-grid">
                  <div className="panel chart-panel">
                    <div className="panel-heading">
                      <div>
                        <h3>RELIANCE Price History</h3>
                        <p>Latest 30 available records</p>
                      </div>
                      <span className="chart-label">MARKET DATA</span>
                    </div>

                    <div className="chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                          <defs>
                            <linearGradient
                              id="priceFill"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#28c7a5"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="100%"
                                stopColor="#28c7a5"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            stroke="#252b38"
                            strokeDasharray="3 3"
                          />

                          <XAxis dataKey="date" stroke="#7f899b" />
                          <YAxis
                            domain={["auto", "auto"]}
                            stroke="#7f899b"
                          />

                          <Tooltip
                            contentStyle={{
                              background: "#171d29",
                              border: "1px solid #30394a",
                              borderRadius: 8,
                            }}
                          />

                          <Area
                            type="monotone"
                            dataKey="close"
                            stroke="#28c7a5"
                            strokeWidth={2}
                            fill="url(#priceFill)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="panel portfolio-panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Portfolio Holdings</h3>
                        <p>Your current portfolio</p>
                      </div>
                      <BriefcaseBusiness size={19} />
                    </div>

                    {portfolio?.holdings?.map((item) => (
                      <div className="holding-row" key={item.symbol}>
                        <div className="holding-symbol">
                          {item.symbol.slice(0, 2)}
                        </div>

                        <div className="holding-name">
                          <strong>{item.symbol}</strong>
                          <span>{item.quantity} shares</span>
                        </div>

                        <strong>{money(item.market_value)}</strong>
                      </div>
                    ))}

                    <div className="total-row">
                      <span>Total value</span>
                      <strong>{money(portfolio?.portfolio_value)}</strong>
                    </div>
                  </div>
                </section>
              </>
            )}

            {activePage === "portfolio" && (
              <section className="panel editor-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Manage Your Portfolio</h3>
                    <p>
                      Add stocks and update your portfolio risk analysis
                    </p>
                  </div>
                  <BriefcaseBusiness size={19} />
                </div>

                <div className="holding-form">
                  <div className="form-field">
                    <label htmlFor="stock-symbol">Select NSE Stock</label>

                    <select
                      id="stock-symbol"
                      value={selectedSymbol}
                      onChange={(event) =>
                        setSelectedSymbol(event.target.value)
                      }
                    >
                      {STOCK_SYMBOLS.map((symbol) => (
                        <option key={symbol} value={symbol}>
                          {symbol}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="stock-quantity">Quantity</label>

                    <input
                      id="stock-quantity"
                      type="number"
                      min="1"
                      step="1"
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      placeholder="Enter quantity"
                    />
                  </div>

                  <button className="add-btn" onClick={addHolding}>
                    <Plus size={17} />
                    Add Stock
                  </button>
                </div>

                <div className="draft-heading">
                  <strong>Selected Holdings</strong>
                  <span>{holdingsInput.length} stocks</span>
                </div>

                <div className="draft-holdings">
                  {holdingsInput.length === 0 ? (
                    <p className="empty-message">
                      No stocks selected. Add a stock to continue.
                    </p>
                  ) : (
                    holdingsInput.map((item) => (
                      <div className="draft-holding" key={item.symbol}>
                        <div>
                          <strong>{item.symbol}</strong>
                          <span>{item.quantity} shares</span>
                        </div>

                        <button
                          className="remove-btn"
                          onClick={() => removeHolding(item.symbol)}
                          title={`Remove ${item.symbol}`}
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <button
                  className="update-btn"
                  onClick={updatePortfolio}
                  disabled={updating || holdingsInput.length === 0}
                >
                  <RefreshCw size={17} />
                  {updating
                    ? "Calculating Risk..."
                    : "Update Portfolio & Calculate Risk"}
                </button>
              </section>
            )}

            {activePage === "risk" && (
              <>
                <section className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Daily Portfolio Volatility</span>
                      <Activity />
                    </div>
                    <h2>
                      {portfolio?.daily_volatility_percentage ?? 0}%
                    </h2>
                    <p>Historical portfolio volatility</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Historical 95% VaR</span>
                      <ShieldCheck />
                    </div>
                    <h2>
                      {money(portfolio?.historical_95_percent_var)}
                    </h2>
                    <p>Estimated one-day risk</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <span>5-Day Monte Carlo VaR</span>
                      <TrendingUp />
                    </div>
                    <h2>
                      {money(portfolio?.monte_carlo_5_day_95_percent_var)}
                    </h2>
                    <p>10,000 simulated scenarios</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Stocks Analysed</span>
                      <BriefcaseBusiness />
                    </div>
                    <h2>{risks.length} / 8</h2>
                    <p>Extra Trees predictions</p>
                  </div>
                </section>

                <section className="panel risk-chart-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Predicted Volatility Comparison</h3>
                      <p>
                        Next 5 trading days · Annualized volatility
                      </p>
                    </div>
                    <span className="chart-label">EXTRA TREES ML</span>
                  </div>

                  <div className="risk-bars">
                    {risks.map((item) => (
                      <div className="risk-bar-row" key={item.symbol}>
                        <strong>{item.symbol}</strong>

                        <div className="risk-bar-track">
                          <div
                            className={
                              item.risk_status === "High"
                                ? "risk-bar-fill high"
                                : "risk-bar-fill normal"
                            }
                            style={{
                              width: `${
                                (item.predicted_volatility_percentage /
                                  maxRiskVolatility) *
                                100
                              }%`,
                            }}
                          />
                        </div>

                        <strong className="risk-bar-value">
                          {item.predicted_volatility_percentage}%
                        </strong>
                      </div>
                    ))}
                  </div>

                  <p className="risk-threshold">
                    High-volatility threshold:{" "}
                    {risks.length
                      ? (
                          risks[0].high_volatility_threshold * 100
                        ).toFixed(2)
                      : "N/A"}
                    %
                  </p>
                </section>

                <section className="panel market-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Individual Stock Risk Forecast</h3>
                      <p>
                        Machine Learning predictions for NSE stocks
                      </p>
                    </div>
                    <span className="chart-label">8 NSE STOCKS</span>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Stock</th>
                          <th>Data Date</th>
                          <th>Forecast Volatility</th>
                          <th>Threshold</th>
                          <th>Risk Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {risks.map((item) => (
                          <tr key={item.symbol}>
                            <td>
                              <strong>{item.symbol}</strong>
                            </td>
                            <td>{item.data_date}</td>
                            <td>
                              {item.predicted_volatility_percentage}%
                            </td>
                            <td>
                              {(
                                item.high_volatility_threshold * 100
                              ).toFixed(2)}
                              %
                            </td>
                            <td>
                              <span
                                className={
                                  item.risk_status === "High"
                                    ? "risk-high"
                                    : "risk-normal"
                                }
                              >
                                {item.risk_status === "High"
                                  ? "High Risk"
                                  : "Below Threshold"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="panel risk-info-panel">
                  <h3>Understanding Risk Metrics</h3>

                  <div className="risk-info-grid">
                    <div>
                      <strong>Daily Volatility</strong>
                      <p>
                        Measures the historical variation in daily
                        portfolio returns.
                      </p>
                    </div>

                    <div>
                      <strong>Historical VaR (95%)</strong>
                      <p>
                        Estimates a one-day loss threshold using
                        historical returns.
                      </p>
                    </div>

                    <div>
                      <strong>Monte Carlo VaR (95%)</strong>
                      <p>
                        Estimates a five-day risk threshold using
                        simulated scenarios.
                      </p>
                    </div>

                    <div>
                      <strong>ML Forecast</strong>
                      <p>
                        Extra Trees predicts annualized volatility
                        for the next five trading days.
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {activePage === "market" && (
              <section className="panel assets-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Market Watch</h3>
                    <p>
                      Latest available data across all market assets
                    </p>
                  </div>

                  <span className="asset-count">
                    {filteredAssets.length} / {assets.length} Assets
                  </span>
                </div>

                <div className="market-controls">
                  <input
                    type="text"
                    placeholder="Search asset..."
                    value={marketSearch}
                    onChange={(event) =>
                      setMarketSearch(event.target.value)
                    }
                  />

                  <select
                    value={marketCategory}
                    onChange={(event) =>
                      setMarketCategory(event.target.value)
                    }
                  >
                    <option value="ALL">All Categories</option>
                    <option value="EQUITY">Equity</option>
                    <option value="COMMODITY">Commodity</option>
                    <option value="FUEL">Fuel</option>
                    <option value="FOREX">Forex</option>
                    <option value="VOLATILITY_INDEX">
                      Volatility Index
                    </option>
                  </select>

                  <select
                    value={marketSort}
                    onChange={(event) =>
                      setMarketSort(event.target.value)
                    }
                  >
                    <option value="symbol">Sort: Name</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="change-high">Change: High to Low</option>
                    <option value="change-low">Change: Low to High</option>
                    <option value="date">Latest Date</option>
                  </select>
                </div>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>Category</th>
                        <th>Latest Price</th>
                        <th>Daily Change</th>
                        <th>Last Updated</th>
                        <th>Records</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAssets.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="empty-message">
                            No matching assets found.
                          </td>
                        </tr>
                      ) : (
                        filteredAssets.map((item) => {
                          const change =
                            item.daily_return == null
                              ? null
                              : item.daily_return * 100;

                          return (
                            <tr key={item.symbol}>
                              <td>
                                <strong>{item.symbol}</strong>
                              </td>

                              <td>
                                <span className="asset-category">
                                  {item.asset_class}
                                </span>
                              </td>

                              <td>
                                {item.close == null
                                  ? "N/A"
                                  : Number(item.close).toLocaleString(
                                      "en-IN",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                              </td>

                              <td>
                                {change == null ? (
                                  "N/A"
                                ) : (
                                  <span
                                    className={
                                      change > 0
                                        ? "market-positive"
                                        : change < 0
                                        ? "market-negative"
                                        : "market-neutral"
                                    }
                                  >
                                    {change > 0 ? "+" : ""}
                                    {change.toFixed(2)}%
                                  </span>
                                )}
                              </td>

                              <td>{item.latest_date}</td>
                              <td>
                                {item.records.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="market-disclaimer">
                  Prices represent the latest available dataset records,
                  not necessarily real-time market prices.
                </p>
              </section>
            )}

            <footer>
              <AlertTriangle size={14} />
              Risk estimates are illustrative and are not guaranteed loss
              predictions or investment advice.
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
