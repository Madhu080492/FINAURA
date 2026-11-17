
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
  BarChart3,
  ChartNoAxesCombined,
  Zap,
  BrainCircuit,
  Target,
  PieChart as PieChartIcon,
  ArrowUpRight,
  Layers3,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  PieChart,
  Pie,
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

const COLORS = {
  violet: "#9a8cff",
  cyan: "#48d9e8",
  pink: "#ff6b9d",
  purple: "#bd83ff",
  muted: "#8290a8",
  grid: "#263149",
  panel: "#151d2d",
};

const PORTFOLIO_COLORS = [
  "#9a8cff",
  "#48d9e8",
  "#ff6b9d",
  "#bd83ff",
  "#5b9dff",
  "#f5b95f",
  "#65d6a5",
  "#e78cff",
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);

// --------------------------------------------------
// ASSET PRICE CHART
// --------------------------------------------------

function AssetChart({ title, data, compact = false }) {
  const chartId = title.replace(/[^a-zA-Z0-9]/g, "");

  return (
    <div className={`asset-chart-card ${compact ? "compact" : ""}`}>
      <div className="asset-chart-title">
        <div>
          <h3>{title}</h3>
          <span>Historical price movement</span>
        </div>
        <span className="chart-live-dot" />
      </div>

      {data?.length > 0 ? (
        <ResponsiveContainer width="100%" height={compact ? 190 : 310}>
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id={`fill-${chartId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={COLORS.violet} stopOpacity={0.45} />
                <stop offset="100%" stopColor={COLORS.cyan} stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke={COLORS.grid}
              strokeDasharray="3 5"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              stroke={COLORS.muted}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              domain={["auto", "auto"]}
              stroke={COLORS.muted}
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />

            <Tooltip
              contentStyle={{
                background: COLORS.panel,
                border: `1px solid ${COLORS.violet}`,
                borderRadius: "12px",
                color: "#fff",
                boxShadow: "0 0 20px rgba(154,140,255,0.15)",
              }}
              labelStyle={{ color: "#aebbd0" }}
              formatter={(value) => [
                Number(value).toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                }),
                "Close",
              ]}
            />

            <Area
              type="monotone"
              dataKey="close"
              stroke={COLORS.violet}
              strokeWidth={2.5}
              fill={`url(#fill-${chartId})`}
              activeDot={{
                r: 5,
                fill: COLORS.cyan,
                stroke: "#ffffff",
                strokeWidth: 1,
              }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">
          No historical chart data available.
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// PORTFOLIO ALLOCATION CHART
// --------------------------------------------------

function PortfolioAllocationChart({ holdings, totalValue }) {
  const allocationData = holdings
    .map((item, index) => ({
      name: item.symbol,
      value: Number(item.market_value || 0),
      color: PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length],
    }))
    .filter((item) => item.value > 0);

  return (
    <div className="portfolio-allocation-content">
      <div className="portfolio-donut">
        {allocationData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={105}
                paddingAngle={4}
                stroke="none"
              >
                {allocationData.map((item) => (
                  <Cell
                    key={item.name}
                    fill={item.color}
                  />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  background: COLORS.panel,
                  border: "1px solid #6656a8",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                formatter={(value) => [money(value), "Market Value"]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            No allocation data available.
          </div>
        )}

        <div className="donut-center">
          <span>PORTFOLIO VALUE</span>
          <strong>{money(totalValue)}</strong>
        </div>
      </div>

      <div className="allocation-legend">
        {allocationData.length > 0 ? (
          allocationData.map((item) => {
            const percentage =
              totalValue > 0
                ? (item.value / totalValue) * 100
                : 0;

            return (
              <div className="allocation-item" key={item.name}>
                <div className="allocation-name">
                  <span
                    className="allocation-dot"
                    style={{ background: item.color }}
                  />
                  <strong>{item.name}</strong>
                </div>

                <div className="allocation-values">
                  <strong>{percentage.toFixed(1)}%</strong>
                  <span>{money(item.value)}</span>
                </div>

                <div className="allocation-track">
                  <div
                    className="allocation-progress"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="empty-message">
            Add stocks to view portfolio allocation.
          </p>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------
// RISK RANKING CHART
// --------------------------------------------------

function RiskRankingChart({ risks }) {
  const sortedRisks = [...risks].sort(
    (a, b) =>
      Number(b.predicted_volatility_percentage) -
      Number(a.predicted_volatility_percentage)
  );

  const threshold =
    risks.length > 0
      ? Number(risks[0].high_volatility_threshold) * 100
      : 0;

  return (
    <div style={{ width: "100%", height: 390 }}>
      {sortedRisks.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedRisks}
            layout="vertical"
            margin={{ top: 15, right: 45, left: 15, bottom: 15 }}
          >
            <defs>
              <linearGradient id="normalRiskGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2878ff" />
                <stop offset="100%" stopColor="#48d9e8" />
              </linearGradient>

              <linearGradient id="highRiskGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#9b50ff" />
                <stop offset="100%" stopColor="#ff6b9d" />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke={COLORS.grid}
              strokeDasharray="3 5"
              horizontal={false}
            />

            <XAxis
              type="number"
              domain={[0, "auto"]}
              stroke={COLORS.muted}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit="%"
            />

            <YAxis
              type="category"
              dataKey="symbol"
              stroke={COLORS.muted}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={95}
            />

            <Tooltip
              cursor={{ fill: "rgba(154,140,255,0.08)" }}
              contentStyle={{
                background: COLORS.panel,
                border: "1px solid #6656a8",
                borderRadius: "12px",
                color: "#fff",
                boxShadow: "0 0 22px rgba(72,217,232,0.12)",
              }}
              formatter={(value) => [
                `${Number(value).toFixed(2)}%`,
                "Predicted Volatility",
              ]}
            />

            <ReferenceLine
              x={threshold}
              stroke={COLORS.pink}
              strokeWidth={2}
              strokeDasharray="6 5"
              label={{
                value: "RISK LIMIT",
                position: "insideTopRight",
                fill: COLORS.pink,
                fontSize: 10,
              }}
            />

            <Bar
              dataKey="predicted_volatility_percentage"
              name="Predicted Volatility"
              barSize={25}
              radius={[0, 8, 8, 0]}
              animationDuration={1200}
            >
              {sortedRisks.map((item) => (
                <Cell
                  key={item.symbol}
                  fill={
                    item.risk_status === "High"
                      ? "url(#highRiskGradient)"
                      : "url(#normalRiskGradient)"
                  }
                  style={{
                    filter:
                      item.risk_status === "High"
                        ? "drop-shadow(0 0 5px rgba(255,107,157,0.4))"
                        : "drop-shadow(0 0 5px rgba(72,217,232,0.35))",
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="chart-empty">
          No risk prediction data available.
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
// RISK DISTRIBUTION DONUT CHART
// --------------------------------------------------

function RiskDistributionChart({ risks }) {
  const highCount = risks.filter(
    (item) => item.risk_status === "High"
  ).length;

  const normalCount = risks.length - highCount;

  const distribution = [
    { name: "High Risk", value: highCount, color: COLORS.pink },
    { name: "Normal Risk", value: normalCount, color: COLORS.cyan },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(100px, 0.8fr)",
        alignItems: "center",
        gap: 10,
        minHeight: 220,
      }}
    >
      <div style={{ height: 220, minWidth: 0 }}>
        {risks.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter id="donutGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <Pie
                data={distribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={85}
                paddingAngle={5}
                stroke="none"
                animationDuration={1200}
              >
                {distribution.map((item) => (
                  <Cell
                    key={item.name}
                    fill={item.color}
                    style={{ filter: "url(#donutGlow)" }}
                  />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  background: COLORS.panel,
                  border: "1px solid #6656a8",
                  borderRadius: "12px",
                  color: "#fff",
                }}
                formatter={(value, name) => [`${value} stocks`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="chart-empty">No risk data available.</div>
        )}
      </div>

      <div style={{ display: "grid", gap: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: COLORS.pink, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.pink }} />
            HIGH RISK
          </div>

          <div style={{ fontSize: 28, fontWeight: 750, color: "#fff", marginTop: 4 }}>
            {highCount}
          </div>

          <span style={{ fontSize: 11, color: COLORS.muted }}>Stocks</span>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, color: COLORS.cyan, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.cyan }} />
            NORMAL RISK
          </div>

          <div style={{ fontSize: 28, fontWeight: 750, color: "#fff", marginTop: 4 }}>
            {normalCount}
          </div>

          <span style={{ fontSize: 11, color: COLORS.muted }}>Stocks</span>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------
// MAIN APPLICATION
// --------------------------------------------------

function App() {
  const [activePage, setActivePage] = useState("overview");

  const [assets, setAssets] = useState([]);
  const [risks, setRisks] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [chartData, setChartData] = useState({});

  const [holdingsInput, setHoldingsInput] = useState(INITIAL_HOLDINGS);

  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE");
  const [selectedChartSymbol, setSelectedChartSymbol] = useState("RELIANCE");

  const [quantity, setQuantity] = useState("1");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [marketSearch, setMarketSearch] = useState("");
  const [marketCategory, setMarketCategory] = useState("ALL");
  const [marketSort, setMarketSort] = useState("symbol");

  const loadDashboard = async (currentHoldings = holdingsInput) => {
    if (!currentHoldings.length) {
      setError("Please add at least one stock to your portfolio.");
      return;
    }

    setUpdating(true);
    setError("");
    setSuccess("");

    try {
      const [assetsRes, portfolioRes] = await Promise.all([
        fetch(`${API}/assets`),

        fetch(`${API}/portfolio/risk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ holdings: currentHoldings }),
        }),
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

      const assetsData = await assetsRes.json();
      const portfolioData = await portfolioRes.json();

      const availableAssets = assetsData.assets || [];

      setAssets(availableAssets);
      setPortfolio(portfolioData);

      const historyResults = await Promise.allSettled(
        availableAssets.map(async (asset) => {
          const response = await fetch(
            `${API}/history/${encodeURIComponent(asset.symbol)}?limit=30`
          );

          if (!response.ok) {
            throw new Error(asset.symbol);
          }

          const result = await response.json();

          return {
            symbol: asset.symbol,
            history: (result.history || []).map((item) => ({
              ...item,
              date: item.date?.slice(5) || "",
            })),
          };
        })
      );

      const historyMap = {};

      historyResults.forEach((result) => {
        if (result.status === "fulfilled") {
          historyMap[result.value.symbol] = result.value.history;
        }
      });

      setChartData(historyMap);

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

      setSuccess("Dashboard and risk analysis updated successfully.");
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

  // ------------------------------------------------
  // PORTFOLIO FUNCTIONS
  // ------------------------------------------------

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

      return [...previous, { symbol: selectedSymbol, quantity: qty }];
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holdings: holdingsInput }),
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

  // ------------------------------------------------
  // MARKET FILTERS
  // ------------------------------------------------

  const filteredAssets = assets
    .filter((asset) => {
      const matchesSearch = asset.symbol
        .toLowerCase()
        .includes(marketSearch.toLowerCase());

      const matchesCategory =
        marketCategory === "ALL" || asset.asset_class === marketCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (marketSort) {
        case "price-high":
          return (b.close ?? -Infinity) - (a.close ?? -Infinity);

        case "price-low":
          return (a.close ?? Infinity) - (b.close ?? Infinity);

        case "change-high":
          return (b.daily_return ?? -Infinity) - (a.daily_return ?? -Infinity);

        case "change-low":
          return (a.daily_return ?? Infinity) - (b.daily_return ?? Infinity);

        case "date":
          return (b.latest_date || "").localeCompare(a.latest_date || "");

        default:
          return a.symbol.localeCompare(b.symbol);
      }
    });

  // ------------------------------------------------
  // RISK CALCULATIONS
  // ------------------------------------------------

  const highRiskCount = risks.filter(
    (item) => item.risk_status === "High"
  ).length;

  const normalRiskCount = risks.length - highRiskCount;

  const averageVolatility = risks.length
    ? (
        risks.reduce(
          (total, item) =>
            total + Number(item.predicted_volatility_percentage || 0),
          0
        ) / risks.length
      ).toFixed(2)
    : "0.00";

  const portfolioHoldings = portfolio?.holdings || [];

  const portfolioValue = Number(
    portfolio?.portfolio_value ??
    portfolioHoldings.reduce(
      (total, item) => total + Number(item.market_value || 0),
      0
    )
  );

  const portfolioStockCount = portfolioHoldings.length;

  const pageTitles = {
    overview: "Dashboard Overview",
    portfolio: "My Portfolio",
    market: "Market Analytics",
    risk: "Risk Intelligence",
  };

  // ------------------------------------------------
  // USER INTERFACE
  // ------------------------------------------------

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ChartNoAxesCombined size={24} />
          </div>
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
            Market Analytics
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
          <div className="status-dot" />
          <span>Backend connected</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">FINANCIAL INTELLIGENCE PLATFORM</p>
            <h1>{pageTitles[activePage]}</h1>
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
            {/* OVERVIEW PAGE */}

            {activePage === "overview" && (
              <>
                <section className="welcome-row">
                  <div>
                    <span className="section-kicker">
                      YOUR FINANCIAL COMMAND CENTER
                    </span>

                    <h2>Market insights at a glance.</h2>

                    <p>
                      Track assets, explore price movements and understand portfolio risk.
                    </p>
                  </div>

                  <span className="live-tag">
                    <span className="status-dot" />
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
                    <h2>{money(portfolio?.monte_carlo_5_day_95_percent_var)}</h2>
                    <p>10,000 simulated scenarios</p>
                  </div>
                </section>

                <section className="panel main-chart-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="section-kicker">PRICE ANALYTICS</span>
                      <h3>Asset Performance</h3>
                      <p>Select a stock to explore its historical price movement.</p>
                    </div>

                    <select
                      className="chart-select"
                      value={selectedChartSymbol}
                      onChange={(event) => setSelectedChartSymbol(event.target.value)}
                    >
                      {STOCK_SYMBOLS.map((symbol) => (
                        <option key={symbol} value={symbol}>{symbol}</option>
                      ))}
                    </select>
                  </div>

                  <AssetChart
                    title={selectedChartSymbol}
                    data={chartData[selectedChartSymbol] || []}
                  />
                </section>

                <section className="content-grid">
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

                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Market Snapshot</h3>
                        <p>Available tracked assets</p>
                      </div>
                      <BarChart3 size={20} />
                    </div>

                    <div className="holding-row">
                      <span>Tracked assets</span>
                      <strong>{assets.length}</strong>
                    </div>

                    <div className="holding-row">
                      <span>Stocks with ML forecasts</span>
                      <strong>{risks.length} / 8</strong>
                    </div>

                    <div className="holding-row">
                      <span>Historical charts loaded</span>
                      <strong>{Object.keys(chartData).length}</strong>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* UPGRADED PORTFOLIO PAGE */}

            {activePage === "portfolio" && (
              <>
                <section className="portfolio-hero">
                  <div className="portfolio-hero-content">
                    <span className="section-kicker">
                      <Layers3 size={14} style={{ display: "inline", marginRight: 7 }} />
                      YOUR INVESTMENT OVERVIEW
                    </span>

                    <h2>Your Portfolio, <span>in focus.</span></h2>

                    <p>
                      A clear view of your holdings, asset allocation and portfolio risk.
                    </p>

                    <div className="portfolio-hero-value">
                      <span>TOTAL PORTFOLIO VALUE</span>
                      <strong>{money(portfolioValue)}</strong>
                      <small>
                        <Wallet size={14} />
                        Based on current saved holdings
                      </small>
                    </div>
                  </div>

                  <div className="portfolio-hero-art">
                    <div className="portfolio-orbit orbit-one" />
                    <div className="portfolio-orbit orbit-two" />
                    <div className="portfolio-orbit orbit-three" />
                    <div className="portfolio-hero-icon">
                      <BriefcaseBusiness size={42} />
                    </div>
                    <span className="orbit-dot dot-one" />
                    <span className="orbit-dot dot-two" />
                    <span className="orbit-dot dot-three" />
                  </div>
                </section>

                <section className="portfolio-summary-grid">
                  <div className="portfolio-summary-card">
                    <div className="portfolio-summary-icon violet-icon">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <span>Portfolio Value</span>
                      <strong>{money(portfolioValue)}</strong>
                      <small>Current market value</small>
                    </div>
                  </div>

                  <div className="portfolio-summary-card">
                    <div className="portfolio-summary-icon cyan-icon">
                      <Layers3 size={20} />
                    </div>
                    <div>
                      <span>Active Holdings</span>
                      <strong>{portfolioStockCount}</strong>
                      <small>Stocks in your portfolio</small>
                    </div>
                  </div>

                  <div className="portfolio-summary-card">
                    <div className="portfolio-summary-icon pink-icon">
                      <Activity size={20} />
                    </div>
                    <div>
                      <span>Daily Volatility</span>
                      <strong>{portfolio?.daily_volatility_percentage ?? 0}%</strong>
                      <small>Historical portfolio volatility</small>
                    </div>
                  </div>

                  <div className="portfolio-summary-card">
                    <div className="portfolio-summary-icon purple-icon">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <span>Historical 95% VaR</span>
                      <strong>{money(portfolio?.historical_95_percent_var)}</strong>
                      <small>Estimated one-day risk</small>
                    </div>
                  </div>
                </section>

                <section className="portfolio-main-grid">
                  <div className="panel portfolio-allocation-panel">
                    <div className="panel-heading">
                      <div>
                        <span className="section-kicker">PORTFOLIO BREAKDOWN</span>
                        <h3>Asset Allocation</h3>
                        <p>See how your portfolio value is distributed.</p>
                      </div>
                      <PieChartIcon size={21} color={COLORS.violet} />
                    </div>

                    <PortfolioAllocationChart
                      holdings={portfolioHoldings}
                      totalValue={portfolioValue}
                    />
                  </div>

                  <div className="panel portfolio-risk-panel">
                    <div className="panel-heading">
                      <div>
                        <span className="section-kicker">RISK SNAPSHOT</span>
                        <h3>Portfolio Risk</h3>
                        <p>Risk metrics calculated from your holdings.</p>
                      </div>
                      <ShieldCheck size={21} color={COLORS.cyan} />
                    </div>

                    <div className="portfolio-risk-metric">
                      <div className="portfolio-risk-metric-top">
                        <span>Historical 95% VaR</span>
                        <span className="metric-tag">1 DAY</span>
                      </div>
                      <strong>{money(portfolio?.historical_95_percent_var)}</strong>
                      <p>Estimated one-day loss threshold based on historical returns.</p>
                    </div>

                    <div className="portfolio-risk-divider" />

                    <div className="portfolio-risk-metric">
                      <div className="portfolio-risk-metric-top">
                        <span>Monte Carlo VaR</span>
                        <span className="metric-tag">5 DAYS</span>
                      </div>
                      <strong>{money(portfolio?.monte_carlo_5_day_95_percent_var)}</strong>
                      <p>Five-day risk estimate from 10,000 simulated scenarios.</p>
                    </div>

                    <div className="portfolio-risk-note">
                      <Activity size={15} />
                      Risk estimates are based on available historical data.
                    </div>
                  </div>
                </section>

                <section className="panel portfolio-holdings-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="section-kicker">YOUR INVESTMENTS</span>
                      <h3>Individual Holdings</h3>
                      <p>Explore the value and allocation of each stock.</p>
                    </div>

                    <span className="asset-count">
                      {portfolioStockCount} HOLDINGS
                    </span>
                  </div>

                  {portfolioHoldings.length > 0 ? (
                    <div className="portfolio-holdings-grid">
                      {portfolioHoldings.map((item, index) => {
                        const marketValue = Number(item.market_value || 0);
                        const allocation =
                          portfolioValue > 0
                            ? (marketValue / portfolioValue) * 100
                            : 0;

                        const color =
                          PORTFOLIO_COLORS[index % PORTFOLIO_COLORS.length];

                        return (
                          <div className="portfolio-stock-card" key={item.symbol}>
                            <div className="portfolio-stock-top">
                              <div
                                className="portfolio-stock-avatar"
                                style={{
                                  color,
                                  borderColor: `${color}55`,
                                  background: `${color}15`,
                                }}
                              >
                                {item.symbol.slice(0, 2)}
                              </div>

                              <span className="portfolio-stock-index">
                                #{String(index + 1).padStart(2, "0")}
                              </span>
                            </div>

                            <h3>{item.symbol}</h3>
                            <span className="portfolio-stock-quantity">
                              {item.quantity} shares held
                            </span>

                            <div className="portfolio-stock-value">
                              <span>MARKET VALUE</span>
                              <strong>{money(marketValue)}</strong>
                            </div>

                            <div className="portfolio-stock-allocation">
                              <div>
                                <span>Portfolio allocation</span>
                                <strong>{allocation.toFixed(1)}%</strong>
                              </div>

                              <div className="allocation-track">
                                <div
                                  className="allocation-progress"
                                  style={{
                                    width: `${Math.min(allocation, 100)}%`,
                                    background: color,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="portfolio-empty">
                      <BriefcaseBusiness size={30} />
                      <h3>No portfolio holdings yet</h3>
                      <p>Add stocks below to start building your portfolio.</p>
                    </div>
                  )}
                </section>

                <section className="panel editor-panel portfolio-editor">
                  <div className="panel-heading">
                    <div>
                      <span className="section-kicker">PORTFOLIO MANAGEMENT</span>
                      <h3>Manage Your Portfolio</h3>
                      <p>
                        Add new stocks, adjust quantities or remove holdings.
                      </p>
                    </div>

                    <BriefcaseBusiness size={21} color={COLORS.violet} />
                  </div>

                  <div className="holding-form">
                    <div className="form-field">
                      <label htmlFor="stock-symbol">Select NSE Stock</label>

                      <select
                        id="stock-symbol"
                        value={selectedSymbol}
                        onChange={(event) => setSelectedSymbol(event.target.value)}
                      >
                        {STOCK_SYMBOLS.map((symbol) => (
                          <option key={symbol} value={symbol}>{symbol}</option>
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
                    <strong>Pending Portfolio Changes</strong>
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
                    {updating ? "Calculating Risk..." : "Save Portfolio & Calculate Risk"}
                  </button>
                </section>
              </>
            )}

            {/* MARKET ANALYTICS PAGE */}

            {activePage === "market" && (
              <section className="panel assets-panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-kicker">MULTI-ASSET ANALYTICS</span>
                    <h3>Market Watch</h3>
                    <p>Explore individual historical charts for every available dataset.</p>
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
                    onChange={(event) => setMarketSearch(event.target.value)}
                  />

                  <select
                    value={marketCategory}
                    onChange={(event) => setMarketCategory(event.target.value)}
                  >
                    <option value="ALL">All Categories</option>
                    <option value="EQUITY">Equity</option>
                    <option value="COMMODITY">Commodity</option>
                    <option value="FUEL">Fuel</option>
                    <option value="FOREX">Forex</option>
                    <option value="VOLATILITY_INDEX">Volatility Index</option>
                  </select>

                  <select
                    value={marketSort}
                    onChange={(event) => setMarketSort(event.target.value)}
                  >
                    <option value="symbol">Sort: Name</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="change-high">Change: High to Low</option>
                    <option value="change-low">Change: Low to High</option>
                    <option value="date">Latest Date</option>
                  </select>
                </div>

                <div className="asset-chart-grid">
                  {filteredAssets.map((asset) => (
                    <AssetChart
                      key={asset.symbol}
                      title={asset.symbol}
                      data={chartData[asset.symbol] || []}
                      compact
                    />
                  ))}
                </div>

                <div className="panel-heading">
                  <div>
                    <h3>Market Data Table</h3>
                    <p>Latest available dataset records</p>
                  </div>
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
                              <td><strong>{item.symbol}</strong></td>

                              <td>
                                <span className="asset-category">
                                  {item.asset_class}
                                </span>
                              </td>

                              <td>
                                {item.close == null
                                  ? "N/A"
                                  : Number(item.close).toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
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
                                {Number(item.records || 0).toLocaleString("en-IN")}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="market-disclaimer">
                  Prices represent the latest available dataset records, not necessarily real-time market prices.
                </p>
              </section>
            )}

            {/* RISK ANALYSIS PAGE */}

            {activePage === "risk" && (
              <>
                <section className="welcome-row">
                  <div>
                    <span className="section-kicker">
                      <BrainCircuit size={14} style={{ display: "inline", marginRight: 7 }} />
                      AI POWERED RISK MONITORING
                    </span>

                    <h2>Risk Intelligence Center</h2>

                    <p>
                      Monitor predicted market volatility and understand stock-level risk exposure.
                    </p>
                  </div>

                  <span className="live-tag">
                    <span className="status-dot" />
                    MODEL ACTIVE
                  </span>
                </section>

                <section className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Portfolio Volatility</span>
                      <Activity />
                    </div>
                    <h2>{portfolio?.daily_volatility_percentage ?? 0}%</h2>
                    <p>Historical daily volatility</p>
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
                    <h2>{money(portfolio?.monte_carlo_5_day_95_percent_var)}</h2>
                    <p>10,000 simulated scenarios</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-top">
                      <span>Stocks Analysed</span>
                      <BrainCircuit />
                    </div>
                    <h2>{risks.length} / 8</h2>
                    <p>Extra Trees ML forecasts</p>
                  </div>
                </section>

                <section
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 15,
                    marginBottom: 20,
                  }}
                >
                  <div className="panel" style={{ borderColor: "rgba(255,107,157,0.35)", boxShadow: "0 0 22px rgba(255,107,157,0.06)" }}>
                    <div style={{ color: COLORS.pink }}>
                      <AlertTriangle size={19} />
                      <span style={{ marginLeft: 8, fontSize: 12 }}>HIGH RISK STOCKS</span>
                    </div>
                    <h2 style={{ fontSize: 32, margin: "12px 0 4px" }}>{highRiskCount}</h2>
                    <p style={{ color: COLORS.muted, fontSize: 12 }}>Above model threshold</p>
                  </div>

                  <div className="panel" style={{ borderColor: "rgba(72,217,232,0.35)", boxShadow: "0 0 22px rgba(72,217,232,0.06)" }}>
                    <div style={{ color: COLORS.cyan }}>
                      <ShieldCheck size={19} />
                      <span style={{ marginLeft: 8, fontSize: 12 }}>NORMAL RISK STOCKS</span>
                    </div>
                    <h2 style={{ fontSize: 32, margin: "12px 0 4px" }}>{normalRiskCount}</h2>
                    <p style={{ color: COLORS.muted, fontSize: 12 }}>Below model threshold</p>
                  </div>

                  <div className="panel" style={{ borderColor: "rgba(154,140,255,0.35)", boxShadow: "0 0 22px rgba(154,140,255,0.06)" }}>
                    <div style={{ color: COLORS.violet }}>
                      <Target size={19} />
                      <span style={{ marginLeft: 8, fontSize: 12 }}>AVERAGE PREDICTED VOLATILITY</span>
                    </div>
                    <h2 style={{ fontSize: 32, margin: "12px 0 4px" }}>{averageVolatility}%</h2>
                    <p style={{ color: COLORS.muted, fontSize: 12 }}>Across available forecasts</p>
                  </div>

                  <div className="panel" style={{ borderColor: "rgba(189,131,255,0.35)", boxShadow: "0 0 22px rgba(189,131,255,0.06)" }}>
                    <div style={{ color: COLORS.purple }}>
                      <Zap size={19} />
                      <span style={{ marginLeft: 8, fontSize: 12 }}>FORECAST HORIZON</span>
                    </div>
                    <h2 style={{ fontSize: 32, margin: "12px 0 4px" }}>5 Days</h2>
                    <p style={{ color: COLORS.muted, fontSize: 12 }}>Annualized volatility estimate</p>
                  </div>
                </section>

                <section
                  className="panel risk-chart-panel"
                  style={{
                    border: "1px solid rgba(154,140,255,0.3)",
                    boxShadow: "0 0 30px rgba(154,140,255,0.07)",
                  }}
                >
                  <div className="panel-heading">
                    <div>
                      <span className="section-kicker">
                        <Zap size={13} style={{ display: "inline", marginRight: 6 }} />
                        NEURAL RISK ANALYTICS
                      </span>

                      <h3>Stock Volatility Ranking</h3>

                      <p>
                        Predicted annualized volatility for the next five trading days.
                      </p>
                    </div>

                    <span className="chart-label">EXTRA TREES ML</span>
                  </div>

                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "10px 0 20px" }}>
                    <span style={{ color: COLORS.cyan, fontSize: 11 }}>● NORMAL RISK</span>
                    <span style={{ color: COLORS.pink, fontSize: 11 }}>● HIGH RISK</span>
                    <span style={{ color: COLORS.muted, fontSize: 11 }}>┄ MODEL THRESHOLD</span>
                  </div>

                  <RiskRankingChart risks={risks} />

                  <p className="risk-threshold">
                    High-volatility threshold:{" "}
                    {risks.length
                      ? (Number(risks[0].high_volatility_threshold) * 100).toFixed(2)
                      : "N/A"}%
                  </p>
                </section>

                <section className="content-grid" style={{ marginTop: 20 }}>
                  <div className="panel" style={{ border: "1px solid rgba(72,217,232,0.25)", boxShadow: "0 0 25px rgba(72,217,232,0.05)" }}>
                    <div className="panel-heading">
                      <div>
                        <span className="section-kicker">RISK COMPOSITION</span>
                        <h3>Risk Distribution</h3>
                        <p>Classification of available stock forecasts.</p>
                      </div>
                      <Activity size={20} color={COLORS.cyan} />
                    </div>

                    <RiskDistributionChart risks={risks} />
                  </div>

                  <div className="panel" style={{ border: "1px solid rgba(189,131,255,0.25)", boxShadow: "0 0 25px rgba(189,131,255,0.05)" }}>
                    <div className="panel-heading">
                      <div>
                        <span className="section-kicker">MODEL INFORMATION</span>
                        <h3>AI Forecast Engine</h3>
                        <p>How FINAURA evaluates market risk.</p>
                      </div>
                      <BrainCircuit size={21} color={COLORS.purple} />
                    </div>

                    <div style={{ display: "grid", gap: 17 }}>
                      <div>
                        <span style={{ color: COLORS.muted, fontSize: 11 }}>MACHINE LEARNING MODEL</span>
                        <h3 style={{ margin: "5px 0" }}>Extra Trees Regressor</h3>
                      </div>

                      <div>
                        <span style={{ color: COLORS.muted, fontSize: 11 }}>PREDICTION TARGET</span>
                        <h3 style={{ margin: "5px 0" }}>Next 5-Day Volatility</h3>
                      </div>

                      <div>
                        <span style={{ color: COLORS.muted, fontSize: 11 }}>FORECAST TYPE</span>
                        <h3 style={{ margin: "5px 0" }}>Annualized Volatility</h3>
                      </div>

                      <div>
                        <span style={{ color: COLORS.muted, fontSize: 11 }}>RISK CLASSIFICATION</span>
                        <h3 style={{ margin: "5px 0" }}>Threshold Based</h3>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="panel market-panel">
                  <div className="panel-heading">
                    <div>
                      <span className="section-kicker">STOCK LEVEL INTELLIGENCE</span>
                      <h3>Individual Stock Risk Forecast</h3>
                      <p>Detailed machine learning predictions for NSE stocks.</p>
                    </div>

                    <span className="chart-label">{risks.length} STOCKS</span>
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
                            <td><strong>{item.symbol}</strong></td>
                            <td>{item.data_date}</td>
                            <td>{Number(item.predicted_volatility_percentage).toFixed(2)}%</td>
                            <td>{(Number(item.high_volatility_threshold) * 100).toFixed(2)}%</td>
                            <td>
                              <span className={item.risk_status === "High" ? "risk-high" : "risk-normal"}>
                                {item.risk_status === "High" ? "High Risk" : "Below Threshold"}
                              </span>
                            </td>
                          </tr>
                        ))}

                        {risks.length === 0 && (
                          <tr>
                            <td colSpan="5" className="empty-message">
                              No ML risk predictions available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="panel risk-info-panel">
                  <h3>Understanding Risk Metrics</h3>

                  <div className="risk-info-grid">
                    <div>
                      <strong>Daily Volatility</strong>
                      <p>Measures historical variation in daily portfolio returns.</p>
                    </div>

                    <div>
                      <strong>Historical VaR (95%)</strong>
                      <p>Estimates a one-day loss threshold using historical returns.</p>
                    </div>

                    <div>
                      <strong>Monte Carlo VaR (95%)</strong>
                      <p>Estimates a five-day risk threshold using simulated scenarios.</p>
                    </div>

                    <div>
                      <strong>ML Forecast</strong>
                      <p>Extra Trees predicts annualized volatility for the next five trading days.</p>
                    </div>
                  </div>
                </section>
              </>
            )}

            <footer>
              <AlertTriangle size={14} />
              Risk estimates are illustrative and are not guaranteed loss predictions or investment advice.
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
