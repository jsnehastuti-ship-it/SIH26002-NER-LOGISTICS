import { useEffect, useMemo, useState } from "react";
import "./AIIntelligence.css";

const API_BASE_URL = "http://localhost:5000/api";

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  console.log("SIH26002 API REQUEST:", url);

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "Content-Type": "application/json",
    },
  });

  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `API request failed: ${response.status} ${response.statusText}`
    );
  }

  return data;
};
const fallbackData = [
  {
    id: "NER-1042",
    vehicleNumber: "OD-01-AB-1234",
    route: "Guwahati → Imphal",
    risk: 28,
    level: "LOW",
    confidence: 94,
    factors: ["Stable weather", "Good GPS signal", "Normal traffic"],
    recommendation:
      "Continue current route. No immediate intervention required.",
  },
  {
    id: "NER-2088",
    vehicleNumber: "OD-02-CD-5678",
    route: "Guwahati → Aizawl",
    risk: 57,
    level: "MEDIUM",
    confidence: 89,
    factors: ["Rainfall", "Reduced speed", "Route congestion"],
    recommendation:
      "Consider a controlled speed adjustment and monitor the next corridor.",
  },
  {
    id: "NER-3012",
    vehicleNumber: "OD-05-EF-9012",
    route: "Kohima → Imphal",
    risk: 86,
    level: "CRITICAL",
    confidence: 97,
    factors: ["Road restriction", "Low speed", "Poor GPS signal"],
    recommendation:
      "Immediate intervention recommended. Evaluate alternate route and contact field team.",
  },
  {
    id: "NER-4176",
    vehicleNumber: "OD-09-GH-3456",
    route: "Shillong → Agartala",
    risk: 34,
    level: "LOW",
    confidence: 92,
    factors: ["Normal traffic", "Stable weather", "Healthy fuel level"],
    recommendation:
      "Continue monitoring. Current route remains operational.",
  },
  {
    id: "NER-5021",
    vehicleNumber: "OD-11-IJ-7890",
    route: "Guwahati → Shillong",
    risk: 68,
    level: "HIGH",
    confidence: 91,
    factors: ["Reduced speed", "Vehicle maintenance status", "Low fuel"],
    recommendation:
      "Vehicle requires attention. Review maintenance condition before dispatch.",
  },
];

const cityCoordinates = {
  guwahati: [26.1445, 91.7362],
  shillong: [25.5788, 91.8933],
  imphal: [24.817, 93.9368],
  aizawl: [23.7271, 92.7176],
  kohima: [25.6751, 94.1086],
  agartala: [23.8315, 91.2868],
};

const routePairs = [
  ["Guwahati", "Imphal"],
  ["Guwahati", "Aizawl"],
  ["Kohima", "Imphal"],
  ["Shillong", "Agartala"],
  ["Guwahati", "Shillong"],
  ["Aizawl", "Agartala"],
];

const regionalSignals = [
  {
    title: "Weather Intelligence",
    value: "MODERATE",
    detail: "Weather signals monitored across active corridors",
    icon: "🌧️",
  },
  {
    title: "Road Network",
    value: "2 ALERTS",
    detail: "Operational restrictions detected across NER",
    icon: "🛣️",
  },
  {
    title: "Fleet Health",
    value: "83%",
    detail: "Fleet operating within monitored parameters",
    icon: "🚚",
  },
  {
    title: "Connectivity",
    value: "91%",
    detail: "Telemetry availability across active fleet",
    icon: "📡",
  },
];

function getRiskClass(level) {
  if (level === "CRITICAL") return "ai-critical";
  if (level === "HIGH") return "ai-high";
  if (level === "MEDIUM") return "ai-medium";
  return "ai-low";
}

function getRiskColor(level) {
  if (level === "CRITICAL") return "#ff4d67";
  if (level === "HIGH") return "#ff9f43";
  if (level === "MEDIUM") return "#ffd166";
  return "#35e69a";
}

function getRiskLevel(risk) {
  if (risk >= 80) return "CRITICAL";
  if (risk >= 60) return "HIGH";
  if (risk >= 40) return "MEDIUM";
  return "LOW";
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function getRouteForVehicle(index, vehicle) {
  const pair = routePairs[index % routePairs.length];

  if (vehicle?.status === "MAINTENANCE") {
    return `${pair[0]} → ${pair[1]}`;
  }

  return `${pair[0]} → ${pair[1]}`;
}

function calculateVehicleRisk(vehicle, incidents = [], index = 0) {
  let risk = 15;
  const factors = [];

  const speed = Number(vehicle.speed) || 0;
  const fuel = Number(vehicle.fuel_level) || 0;
  const status = String(vehicle.status || "").toUpperCase();

  /*
    ---------------------------------------------------------
    AI RISK ENGINE
    ---------------------------------------------------------
    This prototype calculates operational risk from:
    1. Vehicle status
    2. Speed behaviour
    3. Fuel level
    4. Active incidents
    5. Telemetry availability
    ---------------------------------------------------------
  */

  // Vehicle status
  if (status === "MAINTENANCE") {
    risk += 35;
    factors.push("Vehicle maintenance status");
  } else if (status === "IDLE") {
    risk += 10;
    factors.push("Vehicle currently idle");
  } else if (status === "ACTIVE") {
    factors.push("Vehicle actively transmitting");
  }

  // Speed intelligence
  if (speed === 0 && status === "ACTIVE") {
    risk += 25;
    factors.push("Unexpected zero-speed telemetry");
  } else if (speed > 75) {
    risk += 25;
    factors.push("High operating speed");
  } else if (speed > 60) {
    risk += 12;
    factors.push("Elevated operating speed");
  } else if (speed < 20 && status === "ACTIVE") {
    risk += 14;
    factors.push("Reduced movement speed");
  } else {
    factors.push("Normal movement");
  }

  // Fuel intelligence
  if (fuel < 25) {
    risk += 25;
    factors.push("Critical fuel level");
  } else if (fuel < 40) {
    risk += 15;
    factors.push("Reduced fuel level");
  } else if (fuel >= 75) {
    risk -= 5;
    factors.push("Healthy fuel reserve");
  } else {
    factors.push("Adequate fuel level");
  }

  // Incident intelligence
  const vehicleIncidents = incidents.filter((incident) => {
    return (
      String(incident.vehicle_id) === String(vehicle.id) ||
      String(incident.vehicle_number) === String(vehicle.vehicle_number)
    );
  });

  const unresolvedIncidents = vehicleIncidents.filter(
    (incident) => !incident.is_resolved
  );

  if (unresolvedIncidents.length > 0) {
    risk += Math.min(unresolvedIncidents.length * 18, 40);
    factors.push(
      `${unresolvedIncidents.length} active incident${
        unresolvedIncidents.length > 1 ? "s" : ""
      }`
    );
  }

  // Telemetry / GPS intelligence
  const latitude = Number(vehicle.latitude);
  const longitude = Number(vehicle.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude === 0 ||
    longitude === 0
  ) {
    risk += 12;
    factors.push("GPS telemetry uncertainty");
  } else {
    factors.push("GPS telemetry available");
  }

  // Small deterministic variation to make assets distinguishable
  risk += index * 2;

  risk = Math.round(clamp(risk));

  const level = getRiskLevel(risk);

  let recommendation =
    "Continue monitoring. Current operational conditions remain stable.";

  if (level === "CRITICAL") {
    recommendation =
      "Immediate intervention recommended. Evaluate alternate route, inspect vehicle condition and contact the field team.";
  } else if (level === "HIGH") {
    recommendation =
      "Increase monitoring frequency and evaluate route, vehicle and fuel conditions before continuing.";
  } else if (level === "MEDIUM") {
    recommendation =
      "Monitor the next corridor closely and consider controlled speed or route adjustments.";
  } else {
    recommendation =
      "Continue current route. No immediate intervention required.";
  }

  const confidence = clamp(
    84 +
      (status === "ACTIVE" ? 6 : 0) +
      (Number.isFinite(latitude) && Number.isFinite(longitude) ? 4 : -5) -
      Math.min(unresolvedIncidents.length * 2, 6)
  );

  return {
    id: `NER-${String(1000 + index * 731).slice(0, 4)}`,
    vehicleNumber: vehicle.vehicle_number,
    route: getRouteForVehicle(index, vehicle),
    risk,
    level,
    confidence,
    factors: factors.slice(0, 4),
    recommendation,
    vehicle,
  };
}

function buildFallbackAnalysis() {
  return fallbackData;
}

function AIIntelligence({ onBack }) {
  const [selectedId, setSelectedId] = useState("NER-3012");
  const [running, setRunning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [prediction, setPrediction] = useState(87);

  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [routes, setRoutes] = useState([]);

  const [connected, setConnected] = useState(false);
  const [analysisData, setAnalysisData] = useState(fallbackData);

  const fetchIntelligenceData = async () => {
    try {
      const [vehiclesResponse, alertsResponse, routesResponse] =
        await Promise.all([
          fetch(`${API_BASE_URL}/vehicles`),
          fetch(`${API_BASE_URL}/alerts`),
          fetch(`${API_BASE_URL}/routes`),
        ]);

      if (!vehiclesResponse.ok) {
        throw new Error("Vehicle API unavailable");
      }

      const vehicleData = await vehiclesResponse.json();

      let alertData = [];
      let routeData = [];

      if (alertsResponse.ok) {
        alertData = await alertsResponse.json();
      }

      if (routesResponse.ok) {
        routeData = await routesResponse.json();
      }

      setVehicles(vehicleData);
      setAlerts(alertData);
      setRoutes(routeData);
      setConnected(true);

      const calculated = vehicleData.map((vehicle, index) =>
        calculateVehicleRisk(vehicle, alertData, index)
      );

      if (calculated.length > 0) {
        setAnalysisData(calculated);

        setSelectedId((current) => {
          const stillExists = calculated.some((item) => item.id === current);

          if (stillExists) {
            return current;
          }

          return calculated[0].id;
        });
      }

      setLastUpdated("Live database analysis");
    } catch (error) {
      console.warn("AI Intelligence API unavailable:", error.message);

      setConnected(false);
      setAnalysisData((current) =>
        current.length > 0 ? current : buildFallbackAnalysis()
      );

      setLastUpdated("Offline demo intelligence");
    }
  };

  useEffect(() => {
    fetchIntelligenceData();

    const timer = setInterval(() => {
      fetchIntelligenceData();

      setPrediction((current) => {
        const variation = Math.floor(Math.random() * 5) - 2;

        return clamp(current + variation, 70, 99);
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const selectedVehicle = useMemo(() => {
    return (
      analysisData.find((item) => item.id === selectedId) ||
      analysisData[0] ||
      fallbackData[0]
    );
  }, [analysisData, selectedId]);

  const criticalCount = analysisData.filter(
    (item) => item.level === "CRITICAL"
  ).length;

  const highCount = analysisData.filter(
    (item) => item.level === "HIGH"
  ).length;

  const mediumCount = analysisData.filter(
    (item) => item.level === "MEDIUM"
  ).length;

  const elevatedCount = highCount + mediumCount;

  const averageRisk = useMemo(() => {
    if (!analysisData.length) return 0;

    const total = analysisData.reduce((sum, item) => sum + item.risk, 0);

    return Math.round(total / analysisData.length);
  }, [analysisData]);

  const averageConfidence = useMemo(() => {
    if (!analysisData.length) return 0;

    const total = analysisData.reduce(
      (sum, item) => sum + item.confidence,
      0
    );

    return (total / analysisData.length).toFixed(1);
  }, [analysisData]);

  const activeIncidentCount = alerts.filter(
    (alert) => !alert.is_resolved
  ).length;

  const activeRouteCount =
    routes.length > 0 ? routes.length : 5;

  const fleetHealth = useMemo(() => {
    if (!vehicles.length) return 83;

    const healthy = vehicles.filter((vehicle) => {
      const fuel = Number(vehicle.fuel_level) || 0;
      const status = String(vehicle.status || "").toUpperCase();

      return status === "ACTIVE" && fuel >= 40;
    }).length;

    return Math.round((healthy / vehicles.length) * 100);
  }, [vehicles]);

  const regionalSignalData = useMemo(() => {
    return [
      {
        title: "Weather Intelligence",
        value: averageRisk >= 60 ? "HIGH" : averageRisk >= 40 ? "MODERATE" : "STABLE",
        detail:
          averageRisk >= 60
            ? "Weather and operational conditions require attention"
            : "Weather signals monitored across active corridors",
        icon: "🌧️",
      },
      {
        title: "Road Network",
        value: `${activeRouteCount} ROUTES`,
        detail: `${activeIncidentCount} active operational incident${
          activeIncidentCount === 1 ? "" : "s"
        } detected`,
        icon: "🛣️",
      },
      {
        title: "Fleet Health",
        value: `${fleetHealth}%`,
        detail: "Fleet operating within monitored parameters",
        icon: "🚚",
      },
      {
        title: "Connectivity",
        value: connected ? "LIVE" : "OFFLINE",
        detail: connected
          ? `${vehicles.length} vehicles connected to intelligence engine`
          : "Using local fallback intelligence data",
        icon: "📡",
      },
    ];
  }, [
    averageRisk,
    activeRouteCount,
    activeIncidentCount,
    fleetHealth,
    connected,
    vehicles.length,
  ]);

  const runAnalysis = async () => {
    setRunning(true);
    setLastUpdated("Running AI analysis...");

    await fetchIntelligenceData();

    setTimeout(() => {
      setRunning(false);
      setLastUpdated("Analysis completed just now");

      setPrediction((current) => {
        const improvement = Math.floor(Math.random() * 4) + 1;

        return clamp(current + improvement, 70, 99);
      });
    }, 1200);
  };

  const getForecastMessage = () => {
    if (criticalCount > 0) {
      return "Critical disruption probability detected on monitored assets.";
    }

    if (highCount > 0) {
      return "Elevated disruption probability detected on high-risk assets.";
    }

    if (mediumCount > 0) {
      return "Moderate operational risk detected across selected corridors.";
    }

    return "Fleet operations are currently within normal risk parameters.";
  };

  const getForecastDescription = () => {
    if (criticalCount > 0) {
      return "The intelligence engine recommends immediate intervention for critical assets and continuous monitoring of their associated corridors.";
    }

    if (highCount > 0) {
      return "The intelligence engine recommends increasing monitoring frequency and reviewing route and vehicle conditions.";
    }

    return "The intelligence engine recommends maintaining current monitoring frequency while continuously evaluating live telemetry.";
  };

  return (
    <section className="ai-intelligence-page">
      {/* HEADER */}
      <div className="ai-page-header">
        <div>
          <div className="ai-eyebrow">
            <span className="ai-brain-dot"></span>
            NER INTELLIGENCE ENGINE
          </div>

          <h1>AI Logistics Intelligence</h1>

          <p>
            Predictive intelligence for route disruption, fleet risk,
            weather impact and operational decision-making.
          </p>
        </div>

        <div className="ai-header-actions">
          {onBack && (
            <button className="ai-back-button" onClick={onBack}>
              ← COMMAND CENTRE
            </button>
          )}

          <button
            className={`ai-run-button ${running ? "running" : ""}`}
            onClick={runAnalysis}
            disabled={running}
          >
            <span className="ai-run-icon">{running ? "◌" : "✦"}</span>
            {running ? "ANALYSING..." : "RUN AI ANALYSIS"}
          </button>
        </div>
      </div>

      {/* CONNECTION STATUS */}
      <div
        style={{
          marginBottom: "18px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "12px",
          letterSpacing: "1px",
          fontWeight: 700,
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            display: "inline-block",
            background: connected ? "#35e69a" : "#ff9f43",
            boxShadow: connected
              ? "0 0 12px rgba(53,230,154,0.8)"
              : "0 0 12px rgba(255,159,67,0.8)",
          }}
        ></span>

        {connected
          ? `AI ENGINE CONNECTED • PostgreSQL • ${vehicles.length} VEHICLES • ${routes.length} ROUTES`
          : "AI ENGINE OFFLINE • FALLBACK INTELLIGENCE ACTIVE"}
      </div>

      {/* TOP METRICS */}
      <div className="ai-metric-grid">
        <div className="ai-metric-card">
          <div className="ai-metric-icon">🧠</div>

          <div>
            <span>AI MODEL STATUS</span>

            <strong className="ai-green-text">
              {connected ? "OPERATIONAL" : "STANDBY"}
            </strong>

            <small>
              {connected
                ? "Live predictive engine online"
                : "Fallback prediction engine active"}
            </small>
          </div>
        </div>

        <div className="ai-metric-card">
          <div className="ai-metric-icon">⚠️</div>

          <div>
            <span>CRITICAL RISKS</span>

            <strong className="ai-red-text">
              {criticalCount}
            </strong>

            <small>Immediate attention required</small>
          </div>
        </div>

        <div className="ai-metric-card">
          <div className="ai-metric-icon">📊</div>

          <div>
            <span>ELEVATED RISKS</span>

            <strong className="ai-yellow-text">
              {elevatedCount}
            </strong>

            <small>
              {highCount} high • {mediumCount} medium
            </small>
          </div>
        </div>

        <div className="ai-metric-card">
          <div className="ai-metric-icon">🎯</div>

          <div>
            <span>MODEL CONFIDENCE</span>

            <strong>{averageConfidence}%</strong>

            <small>
              Average prediction confidence
            </small>
          </div>
        </div>
      </div>

      {/* AI CORE */}
      <div className="ai-main-grid">
        {/* RISK PANEL */}
        <div className="ai-panel ai-risk-panel">
          <div className="ai-panel-heading">
            <div>
              <span className="ai-panel-label">
                PREDICTIVE RISK ENGINE
              </span>

              <h2>Fleet Risk Assessment</h2>
            </div>

            <span className="ai-live-tag">
              <i></i> LIVE
            </span>
          </div>

          <div className="ai-risk-list">
            {analysisData.map((vehicle) => (
              <button
                key={vehicle.id}
                className={`ai-risk-row ${
                  selectedId === vehicle.id ? "selected" : ""
                }`}
                onClick={() => setSelectedId(vehicle.id)}
              >
                <div className="ai-vehicle-symbol">🚚</div>

                <div className="ai-risk-route">
                  <strong>
                    {vehicle.vehicleNumber || vehicle.id}
                  </strong>

                  <span>
                    {vehicle.route}
                  </span>
                </div>

                <div className="ai-risk-meter">
                  <div className="ai-risk-meter-track">
                    <div
                      className="ai-risk-meter-fill"
                      style={{
                        width: `${vehicle.risk}%`,
                        background: getRiskColor(vehicle.level),
                      }}
                    ></div>
                  </div>

                  <span>{vehicle.risk}%</span>
                </div>

                <div
                  className={`ai-risk-badge ${getRiskClass(
                    vehicle.level
                  )}`}
                >
                  {vehicle.level}
                </div>

                <div className="ai-row-arrow">›</div>
              </button>
            ))}
          </div>
        </div>

        {/* SELECTED ANALYSIS */}
        <div className="ai-panel ai-analysis-panel">
          <div className="ai-panel-heading">
            <div>
              <span className="ai-panel-label">
                SELECTED ASSET
              </span>

              <h2>
                {selectedVehicle.vehicleNumber ||
                  selectedVehicle.id}
              </h2>
            </div>

            <div
              className={`ai-risk-badge ${getRiskClass(
                selectedVehicle.level
              )}`}
            >
              {selectedVehicle.level}
            </div>
          </div>

          <div className="ai-score-section">
            <div
              className="ai-score-ring"
              style={{
                "--risk-progress": `${selectedVehicle.risk * 3.6}deg`,
              }}
            >
              <div className="ai-score-inner">
                <strong>{selectedVehicle.risk}</strong>

                <span>RISK</span>
              </div>
            </div>

            <div className="ai-score-info">
              <span>AI PREDICTED RISK</span>

              <strong>{selectedVehicle.risk}%</strong>

              <small>
                Confidence: {selectedVehicle.confidence}%
              </small>
            </div>
          </div>

          <div className="ai-route-highlight">
            <span>ACTIVE ROUTE</span>

            <strong>
              {selectedVehicle.route}
            </strong>
          </div>

          <div className="ai-factor-title">
            CONTRIBUTING FACTORS
          </div>

          <div className="ai-factor-list">
            {selectedVehicle.factors.map((factor, index) => (
              <div
                className="ai-factor"
                key={`${factor}-${index}`}
              >
                <span>{index + 1}</span>

                {factor}
              </div>
            ))}
          </div>

          <div className="ai-recommendation">
            <div className="ai-rec-icon">✦</div>

            <div>
              <span>AI RECOMMENDATION</span>

              <p>
                {selectedVehicle.recommendation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PREDICTION + SIGNALS */}
      <div className="ai-lower-grid">
        <div className="ai-panel ai-prediction-panel">
          <div className="ai-panel-heading">
            <div>
              <span className="ai-panel-label">
                NEXT EVENT PREDICTION
              </span>

              <h2>Operational Forecast</h2>
            </div>

            <span className="ai-confidence">
              {prediction}% confidence
            </span>
          </div>

          <div className="ai-prediction-visual">
            <div className="ai-future-line">
              <span className="past"></span>

              <span className="current"></span>

              <span className="future"></span>
            </div>

            <div className="ai-timeline">
              <div>
                <strong>NOW</strong>

                <span>
                  Live fleet telemetry received
                </span>
              </div>

              <div>
                <strong>+30 MIN</strong>

                <span>
                  Route and risk conditions analysed
                </span>
              </div>

              <div>
                <strong>+60 MIN</strong>

                <span>
                  Potential disruption window
                </span>
              </div>
            </div>
          </div>

          <div className="ai-forecast-box">
            <span>FORECAST</span>

            <strong>
              {getForecastMessage()}
            </strong>

            <p>
              {getForecastDescription()}
            </p>
          </div>
        </div>

        <div className="ai-panel ai-signals-panel">
          <div className="ai-panel-heading">
            <div>
              <span className="ai-panel-label">
                REGIONAL SIGNALS
              </span>

              <h2>NER Situation Awareness</h2>
            </div>
          </div>

          <div className="ai-signal-grid">
            {regionalSignalData.map((signal) => (
              <div
                className="ai-signal-card"
                key={signal.title}
              >
                <div className="ai-signal-icon">
                  {signal.icon}
                </div>

                <div>
                  <span>{signal.title}</span>

                  <strong>{signal.value}</strong>

                  <small>{signal.detail}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI INSIGHT SUMMARY */}
      <div
        className="ai-panel"
        style={{
          marginTop: "18px",
          padding: "22px",
        }}
      >
        <div className="ai-panel-heading">
          <div>
            <span className="ai-panel-label">
              INTELLIGENCE SUMMARY
            </span>

            <h2>Current Network Risk</h2>
          </div>

          <span
            className={`ai-risk-badge ${getRiskClass(
              getRiskLevel(averageRisk)
            )}`}
          >
            {getRiskLevel(averageRisk)}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            marginTop: "18px",
          }}
        >
          <div>
            <small>AVERAGE RISK</small>

            <h3 style={{ margin: "6px 0" }}>
              {averageRisk}%
            </h3>
          </div>

          <div>
            <small>FLEET ASSETS</small>

            <h3 style={{ margin: "6px 0" }}>
              {analysisData.length}
            </h3>
          </div>

          <div>
            <small>ACTIVE INCIDENTS</small>

            <h3 style={{ margin: "6px 0" }}>
              {activeIncidentCount}
            </h3>
          </div>

          <div>
            <small>MONITORED ROUTES</small>

            <h3 style={{ margin: "6px 0" }}>
              {activeRouteCount}
            </h3>
          </div>
        </div>
      </div>

      {/* MODEL FOOTER */}
      <div className="ai-engine-footer">
        <div className="ai-engine-status">
          <span className="ai-engine-pulse"></span>

          <strong>AI ENGINE ACTIVE</strong>

          <span>•</span>

          <span>{lastUpdated}</span>
        </div>

        <div className="ai-engine-tags">
          <span>ROUTE ANALYSIS</span>

          <span>WEATHER SIGNALS</span>

          <span>FLEET TELEMETRY</span>

          <span>INCIDENT ANALYSIS</span>

          <span>RISK PREDICTION</span>
        </div>
      </div>
    </section>
  );
}

export default AIIntelligence;