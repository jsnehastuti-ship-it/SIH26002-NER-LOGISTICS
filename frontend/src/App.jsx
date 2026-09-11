import { useCallback, useEffect, useState } from "react";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Analytics from "./pages/Analytics";
import Drivers from "./pages/Drivers";
import AdminUsers from "./pages/AdminUsers";
import AIIntelligence from "./pages/AIIntelligence";

import GISMap from "./components/GISMap";

import "./App.css";

/* =========================================================
   SIH26002 API CONFIGURATION
========================================================= */

const API_BASE_URL = "http://localhost:5000/api";

/* =========================================================
   CENTRAL API REQUEST HANDLER

   IMPORTANT:
   Every frontend API request goes through this function.
   This prevents old API URLs from being used inside App.jsx.
========================================================= */

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

/* =========================================================
   ROLES
========================================================= */

const ROLES = {
  ADMIN: "ADMIN",
  AUTHORITY: "AUTHORITY",
};

/* =========================================================
   ROLE PERMISSIONS
========================================================= */

const ROLE_PERMISSIONS = {
  ADMIN: [
    "landing",
    "command",
    "fleet",
    "incidents",
    "routes",
    "weather",
    "ai",
    "analytics",
    "drivers",
    "admin",
  ],

  AUTHORITY: [
    "landing",
    "command",
    "fleet",
    "incidents",
    "routes",
    "weather",
    "ai",
    "analytics",
    "drivers",
  ],
};

/* =========================================================
   RBAC HELPERS
========================================================= */

function canAccessView(user, requestedView) {
  if (!user || !user.role) {
    return false;
  }

  const role = String(user.role).toUpperCase();

  const permissions = ROLE_PERMISSIONS[role] || [];

  return permissions.includes(requestedView);
}

function getSafeView(user, requestedView) {
  if (canAccessView(user, requestedView)) {
    return requestedView;
  }

  return "command";
}

/* =========================================================
   ALERT STATUS HELPER
========================================================= */

function isAlertResolved(alert) {
  return (
    alert?.is_resolved === true ||
    String(alert?.is_resolved).toLowerCase() === "true" ||
    Number(alert?.is_resolved) === 1
  );
}

function getActiveAlerts(alerts) {
  if (!Array.isArray(alerts)) {
    return [];
  }

  return alerts.filter((alert) => !isAlertResolved(alert));
}

/* =========================================================
   VERIFY JWT SESSION
========================================================= */

async function verifySession(token) {
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const data = await apiRequest("/auth/verify", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.user;
}

/* =========================================================
   LIVE ALERTS
========================================================= */

function useLiveAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await apiRequest("/alerts");

      const receivedAlerts = Array.isArray(data)
        ? data
        : Array.isArray(data?.alerts)
        ? data.alerts
        : [];

      setAlerts(receivedAlerts);
      setConnected(true);
      setError("");
      setLoading(false);

      console.log(
        "SIH26002 ALERTS RECEIVED:",
        receivedAlerts.length
      );
    } catch (err) {
      console.error("Live alert error:", err);

      setConnected(false);
      setError(
        err?.message || "Unable to connect to alert service"
      );
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const safeFetchAlerts = async () => {
      if (!mounted) return;

      await fetchAlerts();
    };

    safeFetchAlerts();

    const interval = setInterval(
      safeFetchAlerts,
      5000
    );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchAlerts]);

  return {
    alerts,
    connected,
    loading,
    error,
    refreshAlerts: fetchAlerts,
  };
}

/* =========================================================
   LIVE TELEMETRY
========================================================= */

function useLiveTelemetry(alertCount) {
  const [telemetry, setTelemetry] = useState({
    total: 0,
    active: 0,
    idle: 0,
    maintenance: 0,
    incidents: alertCount || 0,
    connected: false,
    error: "",
  });

  const fetchTelemetry = useCallback(async () => {
    try {
      const data = await apiRequest("/vehicles");

      const vehicles = Array.isArray(data)
        ? data
        : Array.isArray(data?.vehicles)
        ? data.vehicles
        : [];

      const active = vehicles.filter(
        (vehicle) =>
          String(vehicle?.status || "").toUpperCase() === "ACTIVE"
      ).length;

      const idle = vehicles.filter(
        (vehicle) =>
          String(vehicle?.status || "").toUpperCase() === "IDLE"
      ).length;

      const maintenance = vehicles.filter(
        (vehicle) =>
          String(vehicle?.status || "").toUpperCase() ===
          "MAINTENANCE"
      ).length;

      setTelemetry({
        total: vehicles.length,
        active,
        idle,
        maintenance,
        incidents: alertCount || 0,
        connected: true,
        error: "",
      });

      console.log(
        "SIH26002 FLEET:",
        {
          total: vehicles.length,
          active,
          idle,
          maintenance,
        }
      );
    } catch (error) {
      console.error("Telemetry error:", error);

      setTelemetry((previous) => ({
        ...previous,
        incidents: alertCount || previous.incidents,
        connected: false,
        error: error?.message || "Fleet API unavailable",
      }));
    }
  }, [alertCount]);

  useEffect(() => {
    let mounted = true;

    const runTelemetry = async () => {
      if (!mounted) return;

      await fetchTelemetry();
    };

    runTelemetry();

    const interval = setInterval(
      runTelemetry,
      5000
    );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchTelemetry]);

  return telemetry;
}

/* =========================================================
   COMMAND CENTRE
========================================================= */

function CommandCentre({
  setView,
  liveAlerts,
  alertConnected,
  authUser,
  onLogout,
}) {
  const activeAlerts = getActiveAlerts(liveAlerts);

  const telemetry = useLiveTelemetry(
    activeAlerts.length
  );

  const navigateTo = (targetView) => {
    setView(targetView);
  };

  const roleLabel =
    authUser?.role === ROLES.ADMIN
      ? "SYSTEM ADMINISTRATOR"
      : "AUTHORITY OPERATOR";

  return (
    <div className="fleet-monitor">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="top-header">

        <div className="brand-block">

          <div className="brand-mark">
            NER
          </div>

          <div>

            <div className="brand-eyebrow">
              NATIONAL EXPRESSWAY & LOGISTICS
            </div>

            <h1>SIH26002</h1>

            <p>
              Logistics Intelligence Platform
            </p>

          </div>

        </div>

        <div className="header-status">

          <div className="live-indicator">

            <span className="live-dot" />

            LIVE SYSTEM

          </div>

          <div className="session-user">

            <div>

              <strong>
                {authUser?.full_name ||
                  authUser?.username ||
                  "OPERATOR"}
              </strong>

              <span>
                {roleLabel}
              </span>

            </div>

            <button
              className="logout-button"
              onClick={onLogout}
            >
              LOGOUT
            </button>

          </div>

        </div>

      </header>

      {/* =====================================================
          COMMAND INTRO
      ===================================================== */}

      <section className="command-intro">

        <div>

          <span className="section-eyebrow">
            NATIONAL LOGISTICS OPERATIONS
          </span>

          <h2>
            COMMAND CENTRE
          </h2>

          <p>
            Real-time logistics intelligence,
            fleet monitoring and operational
            decision support.
          </p>

        </div>

        <div className="system-status-box">

          <span
            className={
              telemetry.connected
                ? "status-dot online"
                : "status-dot offline"
            }
          />

          <div>

            <strong>
              DATABASE
            </strong>

            <span>
              {telemetry.connected
                ? "POSTGRESQL CONNECTED"
                : "CONNECTION DEGRADED"}
            </span>

          </div>

        </div>

      </section>

      {/* =====================================================
          KPI GRID
      ===================================================== */}

      <section className="kpi-grid">

        <div className="kpi-card">

          <span className="kpi-label">
            TOTAL FLEET
          </span>

          <strong>
            {telemetry.total}
          </strong>

          <small>
            Registered vehicles
          </small>

        </div>

        <div className="kpi-card">

          <span className="kpi-label">
            ACTIVE
          </span>

          <strong>
            {telemetry.active}
          </strong>

          <small>
            Vehicles in motion
          </small>

        </div>

        <div className="kpi-card">

          <span className="kpi-label">
            IDLE
          </span>

          <strong>
            {telemetry.idle}
          </strong>

          <small>
            Vehicles stationary
          </small>

        </div>

        <div className="kpi-card">

          <span className="kpi-label">
            MAINTENANCE
          </span>

          <strong>
            {telemetry.maintenance}
          </strong>

          <small>
            Vehicles unavailable
          </small>

        </div>

        <div className="kpi-card">

          <span className="kpi-label">
            INCIDENTS
          </span>

          <strong>
            {activeAlerts.length}
          </strong>

          <small>
            Live operational alerts
          </small>

        </div>

      </section>

      {/* =====================================================
          MODULES
      ===================================================== */}

      <section className="module-section">

        <div className="section-heading">

          <div>

            <span className="section-eyebrow">
              OPERATIONS
            </span>

            <h3>
              INTELLIGENCE MODULES
            </h3>

          </div>

          <span className="module-count">
            08 MODULES
          </span>

        </div>

        <div className="module-grid">

          <button
            className="module-card"
            onClick={() => navigateTo("fleet")}
          >

            <span className="module-icon">
              🚛
            </span>

            <div>

              <strong>
                FLEET MONITOR
              </strong>

              <span>
                Live vehicle telemetry,
                GPS movement and fleet
                status monitoring
              </span>

            </div>

          </button>

          <button
            className="module-card"
            onClick={() => navigateTo("incidents")}
          >

            <span className="module-icon">
              ⚠️
            </span>

            <div>

              <strong>
                INCIDENT MONITOR
              </strong>

              <span>
                Real-time alerts,
                severity tracking and
                incident response
              </span>

            </div>

          </button>

          <button
            className="module-card"
            onClick={() => navigateTo("routes")}
          >

            <span className="module-icon">
              🛣️
            </span>

            <div>

              <strong>
                ROUTE INTELLIGENCE
              </strong>

              <span>
                Route performance,
                congestion and logistics
                corridor analysis
              </span>

            </div>

          </button>

          <button
            className="module-card"
            onClick={() => navigateTo("weather")}
          >

            <span className="module-icon">
              🌦️
            </span>

            <div>

              <strong>
                WEATHER INTELLIGENCE
              </strong>

              <span>
                Weather impact,
                environmental risk and
                route conditions
              </span>

            </div>

          </button>

          <button
            className="module-card"
            onClick={() => navigateTo("ai")}
          >

            <span className="module-icon">
              🧠
            </span>

            <div>

              <strong>
                AI INTELLIGENCE
              </strong>

              <span>
                Predictive risk,
                operational signals and
                decision support
              </span>

            </div>

          </button>

          <button
            className="module-card"
            onClick={() => navigateTo("analytics")}
          >

            <span className="module-icon">
              📊
            </span>

            <div>

              <strong>
                ANALYTICS
              </strong>

              <span>
                Fleet KPIs, performance
                metrics and operational
                intelligence
              </span>

            </div>

          </button>

          <button
            className="module-card"
            onClick={() => navigateTo("drivers")}
          >

            <span className="module-icon">
              👤
            </span>

            <div>

              <strong>
                DRIVER MANAGEMENT
              </strong>

              <span>
                Driver records,
                assignments and workforce
                monitoring
              </span>

            </div>

          </button>

          {authUser?.role === ROLES.ADMIN && (

            <button
              className="module-card"
              onClick={() => navigateTo("admin")}
            >

              <span className="module-icon">
                🔐
              </span>

              <div>

                <strong>
                  ADMIN CONTROL PANEL
                </strong>

                <span>
                  User management,
                  authorization and system
                  access control
                </span>

              </div>

            </button>

          )}

        </div>

      </section>

      {/* =====================================================
          GIS MAP
      ===================================================== */}

      <section className="command-map-section">

        <div className="section-heading">

          <div>

            <span className="section-eyebrow">
              GEOSPATIAL OPERATIONS
            </span>

            <h3>
              NATIONAL LOGISTICS NETWORK
            </h3>

          </div>

          <div className="map-live-status">

            <span className="live-dot" />

            GPS TELEMETRY LIVE

          </div>

        </div>

        <GISMap
          alerts={activeAlerts}
        />

      </section>

      {/* =====================================================
          OPERATIONS SUMMARY
      ===================================================== */}

      <section className="operations-summary">

        <div className="section-heading">

          <div>

            <span className="section-eyebrow">
              SYSTEM OVERVIEW
            </span>

            <h3>
              OPERATIONS SUMMARY
            </h3>

          </div>

        </div>

        <div className="summary-grid">

          <div className="summary-card">

            <span>
              FLEET STATUS
            </span>

            <strong>
              {telemetry.active} ACTIVE
            </strong>

            <small>
              {telemetry.idle} idle •{" "}
              {telemetry.maintenance} maintenance
            </small>

          </div>

          <div className="summary-card">

            <span>
              ALERT STATUS
            </span>

            <strong>
              {activeAlerts.length} ACTIVE
            </strong>

            <small>
              {alertConnected
                ? "Live alert feed connected"
                : "Alert feed unavailable"}
            </small>

          </div>

          <div className="summary-card">

            <span>
              ACCESS LEVEL
            </span>

            <strong>
              {roleLabel}
            </strong>

            <small>
              Role-based access control enabled
            </small>

          </div>

          <div className="summary-card">

            <span>
              DATA SOURCE
            </span>

            <strong>
              POSTGRESQL
            </strong>

            <small>
              Live operational database
            </small>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="command-footer">

        <div>
          SIH26002 • NER LOGISTICS
          INTELLIGENCE PLATFORM
        </div>

        <div>
          SECURE OPERATIONS ENVIRONMENT
        </div>

      </footer>

    </div>
  );
}

/* =========================================================
   MAIN APP
========================================================= */

export default function App() {

  const [authUser, setAuthUser] = useState(null);

  const [authChecking, setAuthChecking] = useState(true);

  const [view, setView] = useState("command");

  const {
    alerts: liveAlerts,
    connected: alertConnected,
    loading: alertLoading,
    error: alertError,
    refreshAlerts,
  } = useLiveAlerts();

  /* =======================================================
     VERIFY EXISTING SESSION
  ======================================================= */

  useEffect(() => {

    const checkSession = async () => {

      const token =
        localStorage.getItem("sih26002_token");

      const savedUser =
        localStorage.getItem("sih26002_user");

      if (!token || !savedUser) {

        setAuthUser(null);
        setAuthChecking(false);

        return;
      }

      try {

        const verifiedUser =
          await verifySession(token);

        setAuthUser(verifiedUser);

        localStorage.setItem(
          "sih26002_user",
          JSON.stringify(verifiedUser)
        );

      } catch (error) {

        console.error(
          "Session verification failed:",
          error
        );

        localStorage.removeItem(
          "sih26002_token"
        );

        localStorage.removeItem(
          "sih26002_user"
        );

        setAuthUser(null);

      } finally {

        setAuthChecking(false);

      }

    };

    checkSession();

  }, []);

  /* =======================================================
     LOGIN
  ======================================================= */

  const handleLogin = (user) => {

    setAuthUser(user);

    setView(
      getSafeView(
        user,
        "command"
      )
    );

  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {

    localStorage.removeItem(
      "sih26002_token"
    );

    localStorage.removeItem(
      "sih26002_user"
    );

    setAuthUser(null);

    setView("command");

  };

  /* =======================================================
     NAVIGATION WITH RBAC
  ======================================================= */

  const navigateTo = (requestedView) => {

    const safeView =
      getSafeView(
        authUser,
        requestedView
      );

    setView(safeView);

  };

  /* =======================================================
     RESOLVE INCIDENT
  ======================================================= */

  const handleResolveIncident = async (alertId) => {

    try {

      const token =
        localStorage.getItem(
          "sih26002_token"
        );

      if (!token) {

        throw new Error(
          "Authentication session expired"
        );

      }

      await apiRequest(
        `/alerts/${alertId}/resolve`,
        {
          method: "PATCH",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      console.log(
        `✅ Incident #${alertId} resolved`
      );

      await refreshAlerts();

    } catch (error) {

      console.error(
        "❌ Resolve incident error:",
        error
      );

      window.alert(
        error?.message ||
          "Failed to resolve incident"
      );

    }

  };

  /* =======================================================
     SESSION CHECK SCREEN
  ======================================================= */

  if (authChecking) {

    return (

      <div className="app-loading">

        <div className="app-loading-card">

          <div className="app-loading-mark">
            NER
          </div>

          <h2>
            VERIFYING SESSION
          </h2>

          <p>
            Connecting to SIH26002
            authentication service...
          </p>

          <div className="app-loading-line" />

        </div>

      </div>

    );

  }

  /* =======================================================
     LOGIN SCREEN
  ======================================================= */

  if (!authUser) {

    return (

      <Login
        onLogin={handleLogin}
      />

    );

  }

  /* =======================================================
     GLOBAL RBAC PROTECTION
  ======================================================= */

  if (!canAccessView(authUser, view)) {

    return (

      <CommandCentre
        setView={navigateTo}
        liveAlerts={liveAlerts}
        alertConnected={alertConnected}
        authUser={authUser}
        onLogout={handleLogout}
      />

    );

  }

  /* =======================================================
     LANDING
  ======================================================= */

  if (view === "landing") {

    return (

      <Landing
        onEnter={() =>
          navigateTo("command")
        }
      />

    );

  }

  /* =======================================================
     ANALYTICS
  ======================================================= */

  if (view === "analytics") {

    return (

      <Analytics
        onBack={() =>
          navigateTo("command")
        }
      />

    );

  }

  /* =======================================================
     DRIVER MANAGEMENT
  ======================================================= */

  if (view === "drivers") {

    return (

      <Drivers
        onBack={() =>
          navigateTo("command")
        }
      />

    );

  }

  /* =======================================================
     ADMIN USER MANAGEMENT
  ======================================================= */

  if (view === "admin") {

    return (

      <AdminUsers
        authUser={authUser}
        onBack={() =>
          navigateTo("command")
        }
        onLogout={handleLogout}
      />

    );

  }

  /* =======================================================
     FLEET MONITOR
  ======================================================= */

  if (view === "fleet") {

    return (

      <div className="fleet-page-wrapper">

        <div className="module-page-header">

          <button
            className="back-button"
            onClick={() =>
              navigateTo("command")
            }
          >
            ← COMMAND CENTRE
          </button>

          <div>

            <span>
              SIH26002
            </span>

            <h2>
              FLEET MONITOR
            </h2>

          </div>

        </div>

        <GISMap
          alerts={liveAlerts}
        />

      </div>

    );

  }

  /* =======================================================
     INCIDENT MONITOR
  ======================================================= */

  if (view === "incidents") {

    const activeAlerts =
      getActiveAlerts(liveAlerts);

    const criticalCount =
      activeAlerts.filter(
        (alert) =>
          String(
            alert?.severity || ""
          ).toUpperCase() === "CRITICAL"
      ).length;

    const highCount =
      activeAlerts.filter(
        (alert) =>
          String(
            alert?.severity || ""
          ).toUpperCase() === "HIGH"
      ).length;

    const mediumCount =
      activeAlerts.filter(
        (alert) =>
          String(
            alert?.severity || ""
          ).toUpperCase() === "MEDIUM"
      ).length;

    return (

      <div className="module-page">

        {/* PAGE HEADER */}

        <div className="module-page-header">

          <button
            className="back-button"
            onClick={() =>
              navigateTo("command")
            }
          >
            ← COMMAND CENTRE
          </button>

          <div>

            <span>
              SIH26002
            </span>

            <h2>
              INCIDENT MONITOR
            </h2>

          </div>

        </div>

        {/* INCIDENT KPI */}

        <div className="incident-page-content">

          <div className="page-kpi-grid">

            <div className="page-kpi">

              <span>
                ACTIVE INCIDENTS
              </span>

              <strong>
                {activeAlerts.length}
              </strong>

            </div>

            <div className="page-kpi">

              <span>
                CRITICAL
              </span>

              <strong>
                {criticalCount}
              </strong>

            </div>

            <div className="page-kpi">

              <span>
                HIGH
              </span>

              <strong>
                {highCount}
              </strong>

            </div>

            <div className="page-kpi">

              <span>
                MEDIUM
              </span>

              <strong>
                {mediumCount}
              </strong>

            </div>

          </div>

          {/* INCIDENT FEED */}

          <div className="incident-feed">

            <div className="section-heading">

              <div>

                <span className="section-eyebrow">
                  LIVE OPERATIONS
                </span>

                <h3>
                  INCIDENT FEED
                </h3>

              </div>

              <span>

                {alertLoading
                  ? "LOADING..."
                  : alertError
                  ? "CONNECTION ERROR"
                  : alertConnected
                  ? "LIVE"
                  : "OFFLINE"}

              </span>

            </div>

            {/* ERROR */}

            {alertError && (

              <div className="empty-state">

                <strong>
                  ALERT SERVICE UNAVAILABLE
                </strong>

                <p>
                  {alertError}
                </p>

              </div>

            )}

            {/* NO ACTIVE ALERTS */}

            {!alertLoading &&
              !alertError &&
              activeAlerts.length === 0 && (

                <div className="empty-state">

                  <strong>
                    NO ACTIVE INCIDENTS
                  </strong>

                  <p>
                    The logistics network
                    currently has no active
                    alerts.
                  </p>

                </div>

              )}

            {/* ALERT LIST */}

            {activeAlerts.length > 0 && (

              <div className="alert-list">

                {activeAlerts.map(
                  (alert, index) => {

                    const severity =
                      String(
                        alert?.severity ||
                          "MEDIUM"
                      ).toUpperCase();

                    const alertType =
                      String(
                        alert?.alert_type ||
                          "OPERATIONAL_ALERT"
                      ).toUpperCase();

                    const vehicleNumber =
                      alert?.vehicle_number ||
                      `Vehicle #${
                        alert?.vehicle_id ||
                        "UNKNOWN"
                      }`;

                    return (

                      <div
                        className="alert-item"
                        key={
                          alert?.id ||
                          index
                        }
                      >

                        <div className="alert-severity">
                          {severity}
                        </div>

                        <div className="alert-content">

                          <strong>
                            {alertType}
                          </strong>

                          <span>
                            {alert?.message ||
                              "Active logistics event"}
                          </span>

                          <small>
                            🚛{" "}
                            {vehicleNumber}
                          </small>

                          {alert?.latitude != null &&
                            alert?.longitude != null && (

                              <small>
                                📍{" "}
                                {Number(
                                  alert.latitude
                                ).toFixed(5)}
                                ,{" "}
                                {Number(
                                  alert.longitude
                                ).toFixed(5)}
                              </small>

                            )}

                          {alert?.created_at && (

                            <small>
                              🕒{" "}
                              {new Date(
                                alert.created_at
                              ).toLocaleString()}
                            </small>

                          )}

                        </div>

                        <div
                          className="alert-actions"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            marginLeft: "auto",
                            paddingLeft: "20px",
                          }}
                        >

                          <button
                            className="primary-action"
                            onClick={() =>
                              handleResolveIncident(
                                alert.id
                              )
                            }
                            disabled={!alert?.id}
                          >
                            ✓ RESOLVE
                          </button>

                        </div>

                      </div>

                    );

                  }
                )}

              </div>

            )}

          </div>

        </div>

      </div>

    );

  }

  /* =======================================================
     ROUTE INTELLIGENCE
  ======================================================= */

  if (view === "routes") {

    return (

      <div className="fleet-page-wrapper">

        <div className="module-page-header">

          <button
            className="back-button"
            onClick={() =>
              navigateTo("command")
            }
          >
            ← COMMAND CENTRE
          </button>

          <div>

            <span>
              SIH26002
            </span>

            <h2>
              ROUTE INTELLIGENCE
            </h2>

          </div>

        </div>

        <GISMap
          alerts={liveAlerts}
          routeMode={true}
        />

      </div>

    );

  }

  /* =======================================================
     WEATHER INTELLIGENCE
  ======================================================= */

  if (view === "weather") {

    return (

      <div className="module-page">

        <div className="module-page-header">

          <button
            className="back-button"
            onClick={() =>
              navigateTo("command")
            }
          >
            ← COMMAND CENTRE
          </button>

          <div>

            <span>
              SIH26002
            </span>

            <h2>
              WEATHER INTELLIGENCE
            </h2>

          </div>

        </div>

        <div className="placeholder-module">

          <div className="placeholder-icon">
            🌦️
          </div>

          <h2>
            WEATHER INTELLIGENCE
          </h2>

          <p>
            Weather-to-route risk
            correlation engine is
            active in the Command
            Centre.
          </p>

          <button
            className="primary-action"
            onClick={() =>
              navigateTo("command")
            }
          >
            RETURN TO COMMAND CENTRE
          </button>

        </div>

      </div>

    );

  }

  /* =======================================================
     AI INTELLIGENCE
  ======================================================= */

  if (view === "ai") {

    return (

      <AIIntelligence
        onBack={() =>
          navigateTo("command")
        }
      />

    );

  }

  /* =======================================================
     DEFAULT — COMMAND CENTRE
  ======================================================= */

  return (

    <CommandCentre
      setView={navigateTo}
      liveAlerts={liveAlerts}
      alertConnected={alertConnected}
      authUser={authUser}
      onLogout={handleLogout}
    />

  );
}