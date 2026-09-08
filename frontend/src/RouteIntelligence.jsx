import { useState } from "react";

/* =========================================================
   ROUTE OPTIONS
   ========================================================= */

const routeOptions = [
  {
    id: "R-01",
    name: "CORRIDOR ALPHA",
    origin: "Guwahati",
    destination: "Imphal",
    corridor: "NH-27 → NH-2",
    distance: "496 km",
    duration: "10h 35m",
    risk: 28,
    accessibility: 91,
    road: "GOOD",
    weather: "STABLE",
    traffic: "LOW",
    score: 92,
    status: "RECOMMENDED",
    color: "safe",
  },
  {
    id: "R-02",
    name: "CORRIDOR BETA",
    origin: "Guwahati",
    destination: "Imphal",
    corridor: "NH-27 → NH-6 → NH-2",
    distance: "531 km",
    duration: "11h 40m",
    risk: 47,
    accessibility: 82,
    road: "MODERATE",
    weather: "RAIN EXPECTED",
    traffic: "MEDIUM",
    score: 76,
    status: "ALTERNATIVE",
    color: "medium",
  },
  {
    id: "R-03",
    name: "CORRIDOR GAMMA",
    origin: "Guwahati",
    destination: "Imphal",
    corridor: "NH-27 → NH-29 → NH-2",
    distance: "578 km",
    duration: "13h 20m",
    risk: 69,
    accessibility: 68,
    road: "POOR",
    weather: "HEAVY RAIN",
    traffic: "HIGH",
    score: 58,
    status: "HIGH RISK",
    color: "danger",
  },
];

/* =========================================================
   ROUTE INTELLIGENCE
   ========================================================= */

export default function RouteIntelligence({
  onBack,
  onOpenMap,
}) {
  const [origin, setOrigin] =
    useState("Guwahati");

  const [destination, setDestination] =
    useState("Imphal");

  const [selectedRoute, setSelectedRoute] =
    useState(routeOptions[0]);

  const [isAnalysing, setIsAnalysing] =
    useState(false);

  const runRouteAnalysis = () => {
    setIsAnalysing(true);

    setTimeout(() => {
      setIsAnalysing(false);
      setSelectedRoute(routeOptions[0]);
    }, 1800);
  };

  return (
    <section className="route-intelligence-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="route-header">

        <div>

          <span className="route-eyebrow">
            SIH26002 • AI LOGISTICS ENGINE
          </span>

          <h1>
            ROUTE INTELLIGENCE
          </h1>

          <p>
            AI-assisted corridor analysis and intelligent route optimization for the North Eastern Region.
          </p>

        </div>

        <div className="route-header-actions">

          <div className="route-live-pill">
            <span></span>
            AI ENGINE ONLINE
          </div>

          <button
            className="route-back-button"
            onClick={onBack}
          >
            ← COMMAND CENTRE
          </button>

        </div>

      </header>

      {/* =====================================================
          MISSION PLANNER
          ===================================================== */}

      <section className="route-search-panel">

        <div className="route-search-title">

          <span>
            MISSION PLANNER
          </span>

          <h2>
            Optimize Logistics Corridor
          </h2>

        </div>

        <div className="route-search-controls">

          <div className="route-select-group">

            <label>
              ORIGIN
            </label>

            <select
              value={origin}
              onChange={(event) =>
                setOrigin(
                  event.target.value
                )
              }
            >
              <option>
                Guwahati
              </option>

              <option>
                Shillong
              </option>

              <option>
                Kohima
              </option>

              <option>
                Aizawl
              </option>
            </select>

          </div>

          <div className="route-direction">
            →
          </div>

          <div className="route-select-group">

            <label>
              DESTINATION
            </label>

            <select
              value={destination}
              onChange={(event) =>
                setDestination(
                  event.target.value
                )
              }
            >
              <option>
                Imphal
              </option>

              <option>
                Aizawl
              </option>

              <option>
                Agartala
              </option>

              <option>
                Shillong
              </option>
            </select>

          </div>

          <button
            className="route-analyse-button"
            onClick={runRouteAnalysis}
            disabled={isAnalysing}
          >

            {isAnalysing
              ? "ANALYSING..."
              : "ANALYSE ROUTE →"}

          </button>

        </div>

        {isAnalysing && (
          <div className="route-analysis-status">

            <div className="route-analysis-spinner"></div>

            <span>
              AI ENGINE ANALYSING ROAD,
              WEATHER, ACCESSIBILITY &
              TRAFFIC CONDITIONS...
            </span>

          </div>
        )}

      </section>

      {/* =====================================================
          KPI CARDS
          ===================================================== */}

      <section className="route-kpi-grid">

        <div className="route-kpi">

          <span>
            AI ROUTE SCORE
          </span>

          <strong>
            {selectedRoute.score}
          </strong>

          <small>
            / 100
          </small>

        </div>

        <div className="route-kpi">

          <span>
            RISK INDEX
          </span>

          <strong>
            {selectedRoute.risk}
          </strong>

          <small>
            / 100
          </small>

        </div>

        <div className="route-kpi">

          <span>
            ACCESSIBILITY
          </span>

          <strong>
            {selectedRoute.accessibility}%
          </strong>

          <small>
            corridor accessibility
          </small>

        </div>

        <div className="route-kpi">

          <span>
            ESTIMATED TIME
          </span>

          <strong>
            {selectedRoute.duration}
          </strong>

          <small>
            travel duration
          </small>

        </div>

      </section>

      {/* =====================================================
          ROUTE WORKSPACE
          ===================================================== */}

      <section className="route-workspace">

        {/* ===================================================
            ROUTE OPTIONS
            =================================================== */}

        <div className="route-options-panel">

          <div className="route-section-heading">

            <div>

              <span>
                AI GENERATED OPTIONS
              </span>

              <h2>
                Available Corridors
              </h2>

            </div>

            <span className="route-count">
              03 OPTIONS
            </span>

          </div>

          <div className="route-options-list">

            {routeOptions.map(
              (route) => (

                <button
                  key={route.id}
                  className={`route-option-card ${
                    selectedRoute.id ===
                    route.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedRoute(
                      route
                    )
                  }
                >

                  <div className="route-option-top">

                    <div>

                      <span className="route-id">
                        {route.id}
                      </span>

                      <h3>
                        {route.name}
                      </h3>

                    </div>

                    <span
                      className={`route-status ${route.color}`}
                    >
                      {route.status}
                    </span>

                  </div>

                  <div className="route-option-route">

                    <strong>
                      {route.origin}
                    </strong>

                    <span>
                      →
                    </span>

                    <strong>
                      {route.destination}
                    </strong>

                  </div>

                  <div className="route-option-meta">

                    <span>
                      {route.distance}
                    </span>

                    <span>
                      {route.duration}
                    </span>

                    <span>
                      RISK {route.risk}
                    </span>

                  </div>

                  <div className="route-score-line">

                    <span>
                      AI SCORE
                    </span>

                    <strong>
                      {route.score}
                    </strong>

                  </div>

                  <div className="route-score-bar">

                    <span
                      style={{
                        width: `${route.score}%`,
                      }}
                    ></span>

                  </div>

                </button>

              )
            )}

          </div>

        </div>

        {/* ===================================================
            SELECTED ROUTE DETAIL
            =================================================== */}

        <div className="route-detail-panel">

          <div className="route-detail-header">

            <div>

              <span>
                SELECTED CORRIDOR
              </span>

              <h2>
                {selectedRoute.name}
              </h2>

              <p>
                {selectedRoute.corridor}
              </p>

            </div>

            <div className="route-detail-score">

              <small>
                AI SCORE
              </small>

              <strong>
                {selectedRoute.score}
              </strong>

            </div>

          </div>

          {/* =================================================
              VISUAL ROUTE
              ================================================= */}

          <div className="visual-route">

            <div className="visual-node">

              <span className="node-dot"></span>

              <div>

                <small>
                  ORIGIN
                </small>

                <strong>
                  {selectedRoute.origin}
                </strong>

              </div>

            </div>

            <div className="visual-line">

              <span></span>

            </div>

            <div className="visual-node">

              <span className="node-dot destination"></span>

              <div>

                <small>
                  DESTINATION
                </small>

                <strong>
                  {selectedRoute.destination}
                </strong>

              </div>

            </div>

          </div>

          {/* =================================================
              ROUTE METRICS
              ================================================= */}

          <div className="route-metrics">

            <div>

              <span>
                DISTANCE
              </span>

              <strong>
                {selectedRoute.distance}
              </strong>

            </div>

            <div>

              <span>
                EST. TIME
              </span>

              <strong>
                {selectedRoute.duration}
              </strong>

            </div>

            <div>

              <span>
                RISK INDEX
              </span>

              <strong>
                {selectedRoute.risk}/100
              </strong>

            </div>

            <div>

              <span>
                ACCESSIBILITY
              </span>

              <strong>
                {selectedRoute.accessibility}%
              </strong>

            </div>

          </div>

          {/* =================================================
              CONDITIONS
              ================================================= */}

          <div className="route-conditions">

            <div className="conditions-heading">

              <span>
                LIVE ROUTE CONDITIONS
              </span>

            </div>

            <div className="conditions-grid">

              <div>

                <small>
                  ROAD
                </small>

                <strong>
                  {selectedRoute.road}
                </strong>

              </div>

              <div>

                <small>
                  WEATHER
                </small>

                <strong>
                  {selectedRoute.weather}
                </strong>

              </div>

              <div>

                <small>
                  TRAFFIC
                </small>

                <strong>
                  {selectedRoute.traffic}
                </strong>

              </div>

            </div>

          </div>

          {/* =================================================
              AI RECOMMENDATION
              ================================================= */}

          <div className="route-ai-recommendation">

            <div className="route-ai-icon">
              ✦
            </div>

            <div>

              <span>
                AI RECOMMENDATION
              </span>

              <p>

                {selectedRoute.score >= 90
                  ? "Recommended corridor. Current road, weather, accessibility and traffic conditions indicate a strong operational route."
                  : selectedRoute.score >= 70
                  ? "Viable alternative corridor. Continue monitoring weather and accessibility conditions before dispatch."
                  : "High operational risk detected. Avoid this corridor unless no safer alternative is available."}

              </p>

            </div>

          </div>

          {/* =================================================
              ACTIONS
              ================================================= */}

          <div className="route-actions">

            <button
              className="route-primary-action"
              onClick={() =>
                onOpenMap(
                  selectedRoute
                )
              }
            >
              VIEW ON GIS →
            </button>

            <button
              onClick={onBack}
            >
              ← BACK
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="route-footer">

        <span>
          SIH26002 • NER LOGISTICS
          INTELLIGENCE PLATFORM
        </span>

        <span>
          AI ROUTE ENGINE •
          SIMULATION MODE
        </span>

      </footer>

    </section>
  );
}