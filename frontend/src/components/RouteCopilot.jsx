import { useMemo, useState } from "react";

const ROUTES = {
  "Guwahati → Imphal": {
    origin: "Guwahati",
    destination: "Imphal",
    primary: {
      score: 68,
      risk: "HIGH",
      weather: 62,
      terrain: 81,
      road: 54,
      congestion: 31,
      delay: 42,
      distance: "487 km",
      eta: "11h 35m",
      route: "Guwahati → Shillong → Kohima → Imphal",
    },
    alternate: {
      score: 84,
      risk: "MEDIUM",
      weather: 48,
      terrain: 64,
      road: 78,
      congestion: 24,
      delay: 19,
      distance: "531 km",
      eta: "10h 58m",
      route: "Guwahati → Shillong → Agartala → Imphal",
    },
  },

  "Guwahati → Aizawl": {
    origin: "Guwahati",
    destination: "Aizawl",
    primary: {
      score: 73,
      risk: "MEDIUM",
      weather: 58,
      terrain: 72,
      road: 69,
      congestion: 28,
      delay: 31,
      distance: "506 km",
      eta: "12h 12m",
      route: "Guwahati → Shillong → Aizawl",
    },
    alternate: {
      score: 87,
      risk: "LOW",
      weather: 41,
      terrain: 57,
      road: 82,
      congestion: 19,
      delay: 14,
      distance: "548 km",
      eta: "11h 41m",
      route: "Guwahati → Agartala → Aizawl",
    },
  },

  "Guwahati → Kohima": {
    origin: "Guwahati",
    destination: "Kohima",
    primary: {
      score: 82,
      risk: "MEDIUM",
      weather: 46,
      terrain: 68,
      road: 81,
      congestion: 23,
      delay: 18,
      distance: "337 km",
      eta: "8h 20m",
      route: "Guwahati → Shillong → Kohima",
    },
    alternate: {
      score: 89,
      risk: "LOW",
      weather: 39,
      terrain: 61,
      road: 87,
      congestion: 16,
      delay: 11,
      distance: "362 km",
      eta: "8h 02m",
      route: "Guwahati → Dimapur → Kohima",
    },
  },

  "Shillong → Imphal": {
    origin: "Shillong",
    destination: "Imphal",
    primary: {
      score: 64,
      risk: "HIGH",
      weather: 67,
      terrain: 84,
      road: 49,
      congestion: 36,
      delay: 47,
      distance: "425 km",
      eta: "10h 42m",
      route: "Shillong → Kohima → Imphal",
    },
    alternate: {
      score: 79,
      risk: "MEDIUM",
      weather: 52,
      terrain: 69,
      road: 72,
      congestion: 27,
      delay: 25,
      distance: "461 km",
      eta: "10h 16m",
      route: "Shillong → Silchar → Imphal",
    },
  },
};

const PRIORITIES = {
  "STANDARD": {
    multiplier: 1,
    label: "STANDARD",
  },
  "ESSENTIAL": {
    multiplier: 1.15,
    label: "ESSENTIAL SUPPLIES",
  },
  "EMERGENCY": {
    multiplier: 1.35,
    label: "EMERGENCY",
  },
};

function RiskBadge({ risk }) {
  return (
    <span className={`copilot-risk copilot-risk-${risk.toLowerCase()}`}>
      {risk}
    </span>
  );
}

function MetricBar({ label, value }) {
  return (
    <div className="copilot-metric">
      <div className="copilot-metric-head">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>

      <div className="copilot-bar">
        <div
          className="copilot-bar-fill"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const circumference = 2 * Math.PI * 46;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="copilot-score-ring">
      <svg viewBox="0 0 110 110">
        <circle
          className="score-track"
          cx="55"
          cy="55"
          r="46"
        />

        <circle
          className="score-progress"
          cx="55"
          cy="55"
          r="46"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="score-number">
        <strong>{score}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

export default function RouteCopilot() {
  const [routeName, setRouteName] = useState("Guwahati → Imphal");
  const [priority, setPriority] = useState("EMERGENCY");
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const route = ROUTES[routeName];

  const adjusted = useMemo(() => {
    if (!analysis) return null;

    const factor = PRIORITIES[priority].multiplier;

    let score = Math.round(route.primary.score / factor);

    if (priority === "EMERGENCY") {
      score = Math.max(48, score - 4);
    }

    return {
      ...route.primary,
      score,
    };
  }, [analysis, priority, route]);

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysis(null);

    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysis(true);
    }, 1100);
  };

  const clearAnalysis = () => {
    setAnalysis(null);
  };

  return (
    <aside className="route-copilot">

      {/* HEADER */}
      <div className="copilot-header">
        <div className="copilot-brand">
          <div className="copilot-ai-mark">
            ✦
          </div>

          <div>
            <span className="copilot-eyebrow">
              INTELLIGENCE MODULE
            </span>

            <h2>AI ROUTE COPILOT</h2>
          </div>
        </div>

        <div className="copilot-status">
          <i />
          ONLINE
        </div>
      </div>

      {/* INPUT SECTION */}
      <div className="copilot-section">

        <div className="copilot-section-title">
          <span>01</span>
          ROUTE CONFIGURATION
        </div>

        <label>
          ORIGIN / DESTINATION
        </label>

        <select
          value={routeName}
          onChange={(e) => {
            setRouteName(e.target.value);
            setAnalysis(null);
          }}
        >
          {Object.keys(ROUTES).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <label>
          CARGO PRIORITY
        </label>

        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setAnalysis(null);
          }}
        >
          {Object.keys(PRIORITIES).map((key) => (
            <option key={key} value={key}>
              {PRIORITIES[key].label}
            </option>
          ))}
        </select>

        <button
          className={`copilot-analyze ${
            isAnalyzing ? "is-analyzing" : ""
          }`}
          onClick={runAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <span className="copilot-spinner" />
              ANALYZING NETWORK...
            </>
          ) : (
            <>
              ✦ ANALYZE NETWORK
            </>
          )}
        </button>
      </div>

      {/* INITIAL STATE */}
      {!analysis && !isAnalyzing && (
        <div className="copilot-idle">

          <div className="idle-orbit">
            <span>✦</span>
          </div>

          <strong>
            AWAITING ROUTE ANALYSIS
          </strong>

          <p>
            Select a logistics corridor and cargo priority
            to activate the network intelligence engine.
          </p>

          <div className="idle-tags">
            <span>WEATHER</span>
            <span>TERRAIN</span>
            <span>ROAD ACCESS</span>
            <span>CONGESTION</span>
          </div>
        </div>
      )}

      {/* ANALYSIS */}
      {analysis && (
        <div className="copilot-results">

          <div className="copilot-section-title">
            <span>02</span>
            AI NETWORK ANALYSIS
          </div>

          {/* MAIN SCORE */}
          <div className="copilot-score-card">

            <div>
              <span className="score-label">
                ACCESSIBILITY SCORE
              </span>

              <div className="score-route">
                {route.origin}
                <span>→</span>
                {route.destination}
              </div>

              <RiskBadge risk={adjusted.risk} />
            </div>

            <ScoreRing score={adjusted.score} />

          </div>

          {/* PRIMARY ROUTE */}
          <div className="copilot-route-card">

            <div className="route-card-head">
              <div>
                <span>PRIMARY CORRIDOR</span>
                <strong>{adjusted.route}</strong>
              </div>

              <span className="route-warning">
                ⚠
              </span>
            </div>

            <div className="route-stats">

              <div>
                <small>ETA</small>
                <strong>{adjusted.eta}</strong>
              </div>

              <div>
                <small>DISTANCE</small>
                <strong>{adjusted.distance}</strong>
              </div>

              <div>
                <small>DELAY</small>
                <strong>+{adjusted.delay}m</strong>
              </div>

            </div>

            <div className="copilot-metrics">

              <MetricBar
                label="WEATHER IMPACT"
                value={adjusted.weather}
              />

              <MetricBar
                label="TERRAIN DIFFICULTY"
                value={adjusted.terrain}
              />

              <MetricBar
                label="ROAD ACCESS"
                value={adjusted.road}
              />

              <MetricBar
                label="CONGESTION"
                value={adjusted.congestion}
              />

            </div>
          </div>

          {/* AI DECISION */}
          <div className="copilot-decision">

            <div className="decision-header">
              <span className="decision-icon">
                ✦
              </span>

              <div>
                <span>AI RECOMMENDATION</span>
                <strong>
                  ALTERNATE CORRIDOR PREFERRED
                </strong>
              </div>
            </div>

            <p>
              The primary corridor currently intersects
              elevated accessibility risk. Network analysis
              identifies the alternate corridor as the
              safer operational choice.
            </p>

            <div className="decision-comparison">

              <div>
                <span>PRIMARY</span>
                <strong>{adjusted.score}%</strong>
              </div>

              <div className="decision-arrow">
                →
              </div>

              <div>
                <span>ALTERNATE</span>
                <strong>{route.alternate.score}%</strong>
              </div>

            </div>

            <div className="decision-gain">
              <span>ACCESSIBILITY GAIN</span>
              <strong>
                +{route.alternate.score - adjusted.score}%
              </strong>
            </div>

          </div>

          {/* ALTERNATE */}
          <div className="copilot-alternate">

            <div className="alternate-head">
              <span>RECOMMENDED ALTERNATE</span>

              <RiskBadge
                risk={route.alternate.risk}
              />
            </div>

            <strong>
              {route.alternate.route}
            </strong>

            <div className="alternate-grid">

              <div>
                <small>SCORE</small>
                <strong>
                  {route.alternate.score}%
                </strong>
              </div>

              <div>
                <small>ETA</small>
                <strong>
                  {route.alternate.eta}
                </strong>
              </div>

              <div>
                <small>DELAY</small>
                <strong>
                  +{route.alternate.delay}m
                </strong>
              </div>

            </div>

          </div>

          <button
            className="copilot-reset"
            onClick={clearAnalysis}
          >
            ↻ RESET ANALYSIS
          </button>

        </div>
      )}

      {/* FOOTER */}
      <div className="copilot-footer">
        <span>MODEL STATUS</span>
        <strong>SIMULATED DECISION ENGINE</strong>
      </div>

    </aside>
  );
}