import { useEffect, useMemo, useState } from "react";

/* =========================================================
   NER WEATHER INTELLIGENCE
   PostgreSQL + WEATHER + FLEET + ROUTE CORRELATION
   ========================================================= */

const API_BASE_URL = "http://localhost:5000/api";
/* =========================================================
   INITIAL WEATHER DATA
   ========================================================= */

const initialWeatherData = [
  {
    state: "Assam",
    city: "Guwahati",
    temperature: 29,
    rainfall: 42,
    wind: 12,
    humidity: 78,
    visibility: 8.4,
    risk: 32,
    condition: "PARTLY CLOUDY",
    impact: "LOW",
    corridor: "NH-27",
    recommendation: "SAFE TO PROCEED",
  },

  {
    state: "Meghalaya",
    city: "Shillong",
    temperature: 22,
    rainfall: 86,
    wind: 18,
    humidity: 91,
    visibility: 4.8,
    risk: 67,
    condition: "HEAVY RAIN",
    impact: "HIGH",
    corridor: "NH-6",
    recommendation: "MONITOR CLOSELY",
  },

  {
    state: "Nagaland",
    city: "Kohima",
    temperature: 24,
    rainfall: 58,
    wind: 15,
    humidity: 84,
    visibility: 6.1,
    risk: 48,
    condition: "RAIN SHOWERS",
    impact: "MEDIUM",
    corridor: "NH-2",
    recommendation: "CAUTION ADVISED",
  },

  {
    state: "Manipur",
    city: "Imphal",
    temperature: 25,
    rainfall: 92,
    wind: 21,
    humidity: 94,
    visibility: 3.7,
    risk: 82,
    condition: "SEVERE RAIN",
    impact: "CRITICAL",
    corridor: "NH-2",
    recommendation: "ROUTE REASSESSMENT",
  },

  {
    state: "Mizoram",
    city: "Aizawl",
    temperature: 23,
    rainfall: 73,
    wind: 17,
    humidity: 89,
    visibility: 5.3,
    risk: 61,
    condition: "HEAVY CLOUD",
    impact: "HIGH",
    corridor: "NH-6",
    recommendation: "MONITOR CLOSELY",
  },

  {
    state: "Tripura",
    city: "Agartala",
    temperature: 30,
    rainfall: 36,
    wind: 10,
    humidity: 74,
    visibility: 9.2,
    risk: 24,
    condition: "CLOUDY",
    impact: "LOW",
    corridor: "NH-8",
    recommendation: "SAFE TO PROCEED",
  },

  {
    state: "Arunachal Pradesh",
    city: "Itanagar",
    temperature: 21,
    rainfall: 69,
    wind: 19,
    humidity: 92,
    visibility: 4.9,
    risk: 58,
    condition: "RAIN",
    impact: "MEDIUM",
    corridor: "NH-15",
    recommendation: "CAUTION ADVISED",
  },

  {
    state: "Sikkim",
    city: "Gangtok",
    temperature: 18,
    rainfall: 61,
    wind: 16,
    humidity: 88,
    visibility: 5.7,
    risk: 55,
    condition: "CLOUDY RAIN",
    impact: "MEDIUM",
    corridor: "NH-10",
    recommendation: "CAUTION ADVISED",
  },
];

/* =========================================================
   RISK HELPERS
   ========================================================= */

function getRiskClass(risk) {
  if (risk >= 75) return "weather-critical";
  if (risk >= 55) return "weather-high";
  if (risk >= 35) return "weather-medium";

  return "weather-low";
}

function getRiskLabel(risk) {
  if (risk >= 75) return "CRITICAL";
  if (risk >= 55) return "HIGH";
  if (risk >= 35) return "MEDIUM";

  return "LOW";
}

function getConditionIcon(condition) {
  if (condition.includes("SEVERE")) return "⛈";
  if (condition.includes("HEAVY")) return "🌧";
  if (condition.includes("RAIN")) return "🌦";
  if (condition.includes("CLOUD")) return "☁";

  return "◐";
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

/* =========================================================
   ROUTE / CITY MATCHING
   ========================================================= */

function cityAppearsInRoute(city, routeText) {
  if (!city || !routeText) return false;

  return routeText
    .toLowerCase()
    .includes(city.toLowerCase());
}

/* =========================================================
   WEATHER RISK CALCULATION
   ========================================================= */

function calculateWeatherRisk(item, vehicles, routes, alerts) {
  let risk = Number(item.risk) || 0;

  /*
   * Weather contribution
   */
  if (item.rainfall >= 90) {
    risk += 8;
  } else if (item.rainfall >= 75) {
    risk += 5;
  }

  if (item.visibility < 4) {
    risk += 8;
  } else if (item.visibility < 6) {
    risk += 4;
  }

  if (item.wind >= 20) {
    risk += 6;
  } else if (item.wind >= 15) {
    risk += 3;
  }

  /*
   * Route correlation
   */
  const relatedRoutes = routes.filter((route) => {
    const routeText = `${route.start_location || ""} ${
      route.destination || ""
    } ${route.route_name || ""}`;

    return cityAppearsInRoute(item.city, routeText);
  });

  /*
   * Fleet correlation
   */
  const relatedVehicles = vehicles.filter((vehicle) => {
    const latitude = Number(vehicle.latitude);
    const longitude = Number(vehicle.longitude);
/*
 * The backend GPS positions are focused on the
 * North Eastern Region (NER), so route-based
 * correlation is used as the primary prototype
 * intelligence mechanism.
 */

    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      vehicle.status !== "MAINTENANCE"
    );
  });

  /*
   * Incident correlation
   */
  const relatedAlerts = alerts.filter((alert) => {
    const message = `${alert.message || ""} ${
      alert.alert_type || ""
    } ${alert.vehicle_number || ""}`;

    return (
      cityAppearsInRoute(item.city, message) ||
      String(alert.severity || "").toUpperCase() === "HIGH" ||
      String(alert.severity || "").toUpperCase() === "CRITICAL"
    );
  });

  /*
   * Route availability impact
   */
  if (relatedRoutes.length > 0 && item.risk >= 55) {
    risk += Math.min(relatedRoutes.length * 3, 9);
  }

  /*
   * Active fleet impact
   */
  if (relatedVehicles.length > 0 && item.risk >= 55) {
    risk += 2;
  }

  /*
   * Incident impact
   */
  if (relatedAlerts.length > 0) {
    risk += Math.min(relatedAlerts.length * 4, 12);
  }

  return Math.round(clamp(risk));
}

/* =========================================================
   WEATHER IMPACT CLASSIFICATION
   ========================================================= */

function getImpactFromRisk(risk) {
  if (risk >= 75) return "CRITICAL";
  if (risk >= 55) return "HIGH";
  if (risk >= 35) return "MEDIUM";

  return "LOW";
}

/* =========================================================
   AI RECOMMENDATION
   ========================================================= */

function getRecommendation(risk, item, activeIncidents) {
  if (risk >= 80) {
    return "ROUTE REASSESSMENT";
  }

  if (risk >= 65) {
    return "MONITOR CLOSELY";
  }

  if (risk >= 50) {
    return "CAUTION ADVISED";
  }

  if (activeIncidents > 0 && item.risk >= 35) {
    return "INCREASE MONITORING";
  }

  return "SAFE TO PROCEED";
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function WeatherIntelligence({
  onBack,
  onOpenMap,
}) {
  const [weather, setWeather] =
    useState(initialWeatherData);

  const [selectedState, setSelectedState] =
    useState(initialWeatherData[3]);

  const [lastUpdated, setLastUpdated] =
    useState(new Date());

  const [autoRefresh, setAutoRefresh] =
    useState(true);

  /* =======================================================
     DATABASE DATA
     ======================================================= */

  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [databaseConnected, setDatabaseConnected] =
    useState(false);

  /* =======================================================
     FETCH BACKEND DATA
     ======================================================= */

  const fetchOperationalData = async () => {
    try {
      const [
        vehiclesResponse,
        routesResponse,
        alertsResponse,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/vehicles`),
        fetch(`${API_BASE_URL}/routes`),
        fetch(`${API_BASE_URL}/alerts`),
      ]);

      if (!vehiclesResponse.ok) {
        throw new Error("Vehicle API unavailable");
      }

      const vehicleData =
        await vehiclesResponse.json();

      const routeData =
        routesResponse.ok
          ? await routesResponse.json()
          : [];

      const alertData =
        alertsResponse.ok
          ? await alertsResponse.json()
          : [];

      setVehicles(vehicleData);
      setRoutes(routeData);
      setAlerts(alertData);

      setDatabaseConnected(true);
    } catch (error) {
      console.warn(
        "Weather intelligence backend unavailable:",
        error.message
      );

      setDatabaseConnected(false);
    }
  };

  /* =======================================================
     INITIAL + LIVE DATABASE REFRESH
     ======================================================= */

  useEffect(() => {
    fetchOperationalData();

    const interval = setInterval(() => {
      fetchOperationalData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  /* =======================================================
     SIMULATED LIVE WEATHER
     ======================================================= */

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setWeather((current) =>
        current.map((item) => {
          const rainfallChange =
            Math.random() > 0.5 ? 2 : -2;

          const windChange =
            Math.random() > 0.5 ? 1 : -1;

          const newRainfall = Math.max(
            10,
            Math.min(
              100,
              item.rainfall + rainfallChange
            )
          );

          const newWind = Math.max(
            5,
            Math.min(
              35,
              item.wind + windChange
            )
          );

          const newRisk = Math.max(
            10,
            Math.min(
              100,
              Math.round(
                item.risk +
                  rainfallChange * 0.7 +
                  windChange * 0.5
              )
            )
          );

          return {
            ...item,
            rainfall: newRainfall,
            wind: newWind,
            risk: newRisk,
          };
        })
      );

      setLastUpdated(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  /* =======================================================
     WEATHER + LOGISTICS CORRELATION
     ======================================================= */

  const correlatedWeather = useMemo(() => {
    return weather.map((item) => {
      const calculatedRisk =
        calculateWeatherRisk(
          item,
          vehicles,
          routes,
          alerts
        );

      const activeIncidents =
        alerts.filter(
          (alert) => !alert.is_resolved
        ).length;

      return {
        ...item,

        risk: calculatedRisk,

        impact:
          getImpactFromRisk(
            calculatedRisk
          ),

        recommendation:
          getRecommendation(
            calculatedRisk,
            item,
            activeIncidents
          ),
      };
    });
  }, [
    weather,
    vehicles,
    routes,
    alerts,
  ]);

  /* =======================================================
     KEEP SELECTED STATE UPDATED
     ======================================================= */

  useEffect(() => {
    if (!selectedState) return;

    const updated =
      correlatedWeather.find(
        (item) =>
          item.state ===
          selectedState.state
      );

    if (updated) {
      setSelectedState(updated);
    }
  }, [correlatedWeather]);

  /* =======================================================
     GLOBAL KPIs
     ======================================================= */

  const averageRainfall = useMemo(() => {
    return Math.round(
      correlatedWeather.reduce(
        (sum, item) =>
          sum + item.rainfall,
        0
      ) / correlatedWeather.length
    );
  }, [correlatedWeather]);

  const averageTemperature = useMemo(() => {
    return Math.round(
      correlatedWeather.reduce(
        (sum, item) =>
          sum + item.temperature,
        0
      ) / correlatedWeather.length
    );
  }, [correlatedWeather]);

  const criticalZones = useMemo(() => {
    return correlatedWeather.filter(
      (item) => item.risk >= 75
    ).length;
  }, [correlatedWeather]);

  const highRiskZones = useMemo(() => {
    return correlatedWeather.filter(
      (item) =>
        item.risk >= 55 &&
        item.risk < 75
    ).length;
  }, [correlatedWeather]);

  const networkRisk = useMemo(() => {
    return Math.round(
      correlatedWeather.reduce(
        (sum, item) =>
          sum + item.risk,
        0
      ) / correlatedWeather.length
    );
  }, [correlatedWeather]);

  /* =======================================================
     LIVE OPERATIONAL KPIs
     ======================================================= */

  const activeVehicles = useMemo(() => {
    return vehicles.filter(
      (vehicle) =>
        String(vehicle.status).toUpperCase() ===
        "ACTIVE"
    ).length;
  }, [vehicles]);

  const activeIncidents = useMemo(() => {
    return alerts.filter(
      (alert) => !alert.is_resolved
    ).length;
  }, [alerts]);

  const routeCount = routes.length;

  /* =======================================================
     AI NETWORK ASSESSMENT
     ======================================================= */

  const aiAssessment = useMemo(() => {
    if (
      networkRisk >= 70 ||
      criticalZones >= 2
    ) {
      return {
        title:
          "HIGH WEATHER DISRUPTION",
        text:
          "Multiple NER corridors are experiencing elevated weather risk. Route reassessment, fleet monitoring and priority intervention are recommended.",
        className:
          "weather-critical",
      };
    }

    if (
      networkRisk >= 50 ||
      highRiskZones >= 2
    ) {
      return {
        title:
          "WEATHER CAUTION",
        text:
          "Weather conditions may affect travel time across selected corridors. Maintain increased fleet and route monitoring.",
        className:
          "weather-high",
      };
    }

    return {
      title:
        "NETWORK WEATHER STABLE",
      text:
        "Current weather conditions remain within operational tolerance for most monitored logistics corridors.",
      className:
        "weather-low",
    };
  }, [
    networkRisk,
    criticalZones,
    highRiskZones,
  ]);

  /* =======================================================
     SELECTED STATE LOGISTICS INTELLIGENCE
     ======================================================= */

  const selectedLogisticsImpact =
    useMemo(() => {
      if (!selectedState) {
        return {
          routes: 0,
          vehicles: activeVehicles,
          incidents: activeIncidents,
        };
      }

      const relatedRoutes =
        routes.filter((route) => {
          const text =
            `${route.start_location || ""} ${
              route.destination || ""
            } ${route.route_name || ""}`;

          return cityAppearsInRoute(
            selectedState.city,
            text
          );
        });

      const relatedIncidents =
        alerts.filter((alert) => {
          const text =
            `${alert.message || ""} ${
              alert.alert_type || ""
            }`;

          return (
            cityAppearsInRoute(
              selectedState.city,
              text
            ) ||
            String(
              alert.severity || ""
            ).toUpperCase() ===
              "HIGH"
          );
        });

      return {
        routes: relatedRoutes.length,
        vehicles: activeVehicles,
        incidents:
          relatedIncidents.length,
      };
    }, [
      selectedState,
      routes,
      alerts,
      activeVehicles,
      activeIncidents,
    ]);

  /* =======================================================
     FORMAT TIME
     ======================================================= */

  const formattedTime =
    lastUpdated.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="weather-intelligence-page">

      {/* ===================================================
          HEADER
          =================================================== */}

      <header className="weather-header">

        <div className="weather-header-left">

          <button
            className="weather-back-button"
            onClick={onBack}
          >
            ← COMMAND CENTRE
          </button>

          <div className="weather-title-block">

            <span className="weather-eyebrow">
              NER LOGISTICS INTELLIGENCE
            </span>

            <h1>
              WEATHER
              <span> INTELLIGENCE</span>
            </h1>

            <p>
              AI-assisted atmospheric risk
              monitoring for logistics
              corridors across the North
              Eastern Region.
            </p>

          </div>

        </div>

        <div className="weather-header-right">

          <div className="weather-live-status">

            <span className="weather-live-dot" />

            {databaseConnected
              ? "LIVE WEATHER MODEL"
              : "WEATHER MODEL"}

          </div>

          <div className="weather-updated">

            UPDATED

            <strong>
              {formattedTime}
            </strong>

          </div>

        </div>

      </header>

      {/* ===================================================
          DATABASE CONNECTION BAR
          =================================================== */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "10px 14px",
          marginBottom: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px",
          fontSize: "11px",
          letterSpacing: "1px",
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >

          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background:
                databaseConnected
                  ? "#35e69a"
                  : "#ff9f43",
              boxShadow:
                databaseConnected
                  ? "0 0 10px rgba(53,230,154,0.8)"
                  : "0 0 10px rgba(255,159,67,0.8)",
            }}
          />

          <strong>
            {databaseConnected
              ? "POSTGRESQL INTELLIGENCE LINK ACTIVE"
              : "POSTGRESQL LINK OFFLINE"}
          </strong>

        </div>

        <div>
          FLEET {vehicles.length}
          {" • "}
          ACTIVE {activeVehicles}
          {" • "}
          ROUTES {routeCount}
          {" • "}
          INCIDENTS {activeIncidents}
        </div>

      </div>

      {/* ===================================================
          KPI STRIP
          =================================================== */}

      <section className="weather-kpi-grid">

        <div className="weather-kpi-card">

          <span>NETWORK RISK</span>

          <strong>
            {networkRisk}
            <small>/100</small>
          </strong>

          <div className="weather-progress">

            <div
              style={{
                width:
                  `${networkRisk}%`,
              }}
            />

          </div>

        </div>

        <div className="weather-kpi-card">

          <span>AVG TEMPERATURE</span>

          <strong>
            {averageTemperature}
            <small>°C</small>
          </strong>

          <p>
            NER regional average
          </p>

        </div>

        <div className="weather-kpi-card">

          <span>AVG RAINFALL</span>

          <strong>
            {averageRainfall}
            <small>%</small>
          </strong>

          <p>
            precipitation intensity
          </p>

        </div>

        <div className="weather-kpi-card">

          <span>CRITICAL ZONES</span>

          <strong>
            {String(
              criticalZones
            ).padStart(2, "0")}
          </strong>

          <p>
            immediate attention
          </p>

        </div>

        <div className="weather-kpi-card">

          <span>HIGH RISK ZONES</span>

          <strong>
            {String(
              highRiskZones
            ).padStart(2, "0")}
          </strong>

          <p>
            active monitoring
          </p>

        </div>

      </section>

      {/* ===================================================
          AI ASSESSMENT
          =================================================== */}

      <section
        className={`weather-ai-banner ${aiAssessment.className}`}
      >

        <div className="weather-ai-icon">
          ✦
        </div>

        <div className="weather-ai-content">

          <span>
            AI NETWORK ASSESSMENT
          </span>

          <h2>
            {aiAssessment.title}
          </h2>

          <p>
            {aiAssessment.text}
          </p>

        </div>

        <div className="weather-ai-actions">

          <button
            onClick={onOpenMap}
          >
            VIEW GIS IMPACT
          </button>

          <button
            className={
              autoRefresh
                ? "active"
                : ""
            }
            onClick={() =>
              setAutoRefresh(
                (value) => !value
              )
            }
          >
            {autoRefresh
              ? "LIVE UPDATES ON"
              : "LIVE UPDATES OFF"}
          </button>

        </div>

      </section>

      {/* ===================================================
          MAIN WEATHER GRID
          =================================================== */}

      <section className="weather-main-grid">

        {/* =================================================
            STATE LIST
            ================================================= */}

        <div className="weather-state-panel">

          <div className="weather-panel-header">

            <div>

              <span>
                REGIONAL WEATHER MATRIX
              </span>

              <h2>
                NER STATE CONDITIONS
              </h2>

            </div>

            <span className="weather-state-count">
              08 STATES
            </span>

          </div>

          <div className="weather-state-list">

            {correlatedWeather.map(
              (item) => (

                <button
                  key={item.state}
                  className={`weather-state-row ${
                    selectedState?.state ===
                    item.state
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedState(
                      item
                    )
                  }
                >

                  <div className="weather-state-icon">
                    {getConditionIcon(
                      item.condition
                    )}
                  </div>

                  <div className="weather-state-name">

                    <strong>
                      {item.state}
                    </strong>

                    <small>
                      {item.city}
                    </small>

                  </div>

                  <div className="weather-state-condition">

                    <strong>
                      {item.temperature}°C
                    </strong>

                    <small>
                      {item.condition}
                    </small>

                  </div>

                  <div className="weather-state-risk">

                    <span>
                      RISK
                    </span>

                    <strong
                      className={
                        getRiskClass(
                          item.risk
                        )
                      }
                    >
                      {item.risk}
                    </strong>

                  </div>

                </button>

              )
            )}

          </div>

        </div>

        {/* =================================================
            SELECTED STATE
            ================================================= */}

        {selectedState && (

          <div className="weather-detail-panel">

            <div className="weather-detail-top">

              <div>

                <span>
                  SELECTED REGION
                </span>

                <h2>
                  {selectedState.state}
                </h2>

                <p>
                  {selectedState.city}
                </p>

              </div>

              <div className="weather-big-icon">

                {getConditionIcon(
                  selectedState.condition
                )}

              </div>

            </div>

            <div className="weather-condition">

              <strong>
                {selectedState.temperature}°C
              </strong>

              <span>
                {selectedState.condition}
              </span>

            </div>

            <div className="weather-detail-metrics">

              <div>

                <span>RAINFALL</span>

                <strong>
                  {selectedState.rainfall}%
                </strong>

                <div className="weather-mini-bar">

                  <div
                    style={{
                      width:
                        `${selectedState.rainfall}%`,
                    }}
                  />

                </div>

              </div>

              <div>

                <span>WIND</span>

                <strong>
                  {selectedState.wind}
                  {" "}
                  km/h
                </strong>

                <div className="weather-mini-bar">

                  <div
                    style={{
                      width:
                        `${Math.min(
                          100,
                          selectedState.wind *
                            3
                        )}%`,
                    }}
                  />

                </div>

              </div>

              <div>

                <span>HUMIDITY</span>

                <strong>
                  {selectedState.humidity}%
                </strong>

                <div className="weather-mini-bar">

                  <div
                    style={{
                      width:
                        `${selectedState.humidity}%`,
                    }}
                  />

                </div>

              </div>

              <div>

                <span>VISIBILITY</span>

                <strong>
                  {selectedState.visibility}
                  {" "}
                  km
                </strong>

                <div className="weather-mini-bar">

                  <div
                    style={{
                      width:
                        `${Math.min(
                          100,
                          selectedState.visibility *
                            10
                        )}%`,
                    }}
                  />

                </div>

              </div>

            </div>

            {/* =================================================
                RISK
                ================================================= */}

            <div className="weather-risk-box">

              <div>

                <span>
                  WEATHER + LOGISTICS RISK
                </span>

                <strong
                  className={
                    getRiskClass(
                      selectedState.risk
                    )
                  }
                >
                  {selectedState.risk}
                </strong>

              </div>

              <div className="weather-risk-label">

                {getRiskLabel(
                  selectedState.risk
                )}

              </div>

            </div>

            {/* =================================================
                LOGISTICS CORRELATION
                ================================================= */}

            <div
              className="weather-logistics-impact"
            >

              <span>
                LOGISTICS IMPACT
              </span>

              <strong>
                {selectedState.impact}
              </strong>

              <p>

                Active corridor:
                {" "}

                <b>
                  {selectedState.corridor}
                </b>

              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3, 1fr)",
                  gap: "8px",
                  marginTop: "12px",
                }}
              >

                <div>
                  <small>
                    ROUTES
                  </small>

                  <strong>
                    {
                      selectedLogisticsImpact.routes
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    ACTIVE FLEET
                  </small>

                  <strong>
                    {
                      selectedLogisticsImpact.vehicles
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    INCIDENTS
                  </small>

                  <strong>
                    {
                      selectedLogisticsImpact.incidents
                    }
                  </strong>
                </div>

              </div>

            </div>

            {/* =================================================
                AI RECOMMENDATION
                ================================================= */}

            <div className="weather-recommendation">

              <div className="weather-rec-icon">
                ✦
              </div>

              <div>

                <span>
                  AI RECOMMENDATION
                </span>

                <strong>
                  {
                    selectedState.recommendation
                  }
                </strong>

                <p>
                  Weather intelligence is
                  being correlated with
                  live fleet telemetry,
                  route availability and
                  incident conditions.
                </p>

              </div>

            </div>

          </div>

        )}

      </section>

      {/* ===================================================
          INTELLIGENCE CORRELATION PANEL
          =================================================== */}

      <section
        className="weather-ai-banner weather-low"
        style={{
          marginTop: "18px",
        }}
      >

        <div className="weather-ai-icon">
          🧠
        </div>

        <div className="weather-ai-content">

          <span>
            MULTI-SOURCE INTELLIGENCE
          </span>

          <h2>
            WEATHER → ROUTE → FLEET → INCIDENT
          </h2>

          <p>
            The intelligence engine combines
            atmospheric conditions with
            PostgreSQL route, fleet and
            incident data to estimate
            operational disruption risk.
          </p>

        </div>

        <div
          style={{
            display: "grid",
            gap: "6px",
            minWidth: "180px",
          }}
        >

          <span>
            LIVE VEHICLES
            {" "}
            <b>{vehicles.length}</b>
          </span>

          <span>
            ACTIVE ROUTES
            {" "}
            <b>{routes.length}</b>
          </span>

          <span>
            ACTIVE INCIDENTS
            {" "}
            <b>{activeIncidents}</b>
          </span>

        </div>

      </section>

      {/* ===================================================
          FOOTER
          =================================================== */}

      <footer className="weather-footer">

        <div>

          <span>
            WEATHER INTELLIGENCE ENGINE
          </span>

          <strong>
            NER-AWX-01
          </strong>

        </div>

        <div>

          <span>
            DATA MODE
          </span>

          <strong>
            WEATHER + LIVE TELEMETRY
          </strong>

        </div>

        <div>

          <span>
            ROUTE INTEGRATION
          </span>

          <strong>
            ACTIVE
          </strong>

        </div>

      </footer>

    </div>
  );
}