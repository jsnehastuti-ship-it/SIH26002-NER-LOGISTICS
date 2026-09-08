import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "https://blah-robbie-deaf-trailer.trycloudflare.com/api";
export default function Drivers({ onBack }) {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);

  const fetchDriverData = async () => {
    try {
      const [driversResponse, vehiclesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/drivers`),
        fetch(`${API_BASE_URL}/vehicles`),
      ]);

      if (!driversResponse.ok || !vehiclesResponse.ok) {
        throw new Error("Failed to fetch driver data");
      }

      const driversData = await driversResponse.json();
      const vehiclesData = await vehiclesResponse.json();

      setDrivers(Array.isArray(driversData) ? driversData : []);
      setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
      setConnected(true);
    } catch (error) {
      console.error("Driver data error:", error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverData();

    const interval = setInterval(fetchDriverData, 5000);

    return () => clearInterval(interval);
  }, []);

  const getDriverStatus = (driver) => {
    const status = String(driver.driver_status || "").toUpperCase();

    if (status === "ACTIVE") return "ACTIVE";
    if (status === "INACTIVE") return "INACTIVE";
    return status || "UNKNOWN";
  };

  const getAssignedVehicle = (driver) => {
    const driverName = String(driver.driver_name || "")
      .trim()
      .toLowerCase();

    return vehicles.find(
      (vehicle) =>
        String(vehicle.driver_name || "")
          .trim()
          .toLowerCase() === driverName
    );
  };

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return drivers;

    return drivers.filter((driver) => {
      const vehicle = getAssignedVehicle(driver);

      return (
        String(driver.driver_name || "")
          .toLowerCase()
          .includes(query) ||
        String(driver.phone || "")
          .toLowerCase()
          .includes(query) ||
        String(driver.license_number || "")
          .toLowerCase()
          .includes(query) ||
        String(driver.driver_status || "")
          .toLowerCase()
          .includes(query) ||
        String(vehicle?.vehicle_number || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [drivers, vehicles, search]);

  const statistics = useMemo(() => {
    const total = drivers.length;

    const active = drivers.filter(
      (driver) => getDriverStatus(driver) === "ACTIVE"
    ).length;

    const inactive = drivers.filter(
      (driver) => getDriverStatus(driver) === "INACTIVE"
    ).length;

    const totalExperience = drivers.reduce(
      (sum, driver) => sum + Number(driver.experience_years || 0),
      0
    );

    const averageExperience =
      total > 0 ? (totalExperience / total).toFixed(1) : "0.0";

    const assigned = drivers.filter((driver) =>
      getAssignedVehicle(driver)
    ).length;

    return {
      total,
      active,
      inactive,
      averageExperience,
      assigned,
    };
  }, [drivers, vehicles]);

  return (
    <div className="drivers-page">
      {/* HEADER */}
      <div className="drivers-header">
        <div>
          <div className="drivers-eyebrow">
            SIH26002 • NER LOGISTICS INTELLIGENCE
          </div>

          <h1>DRIVER MANAGEMENT</h1>

          <p>
            Monitor driver availability, experience, assignments and
            operational status.
          </p>
        </div>

        <div className="drivers-header-actions">
          <div
            className={`drivers-db-status ${
              connected ? "connected" : "disconnected"
            }`}
          >
            <span className="drivers-status-dot"></span>

            {connected
              ? "POSTGRESQL CONNECTED"
              : "DATABASE OFFLINE"}
          </div>

          <button
            className="drivers-back-button"
            onClick={onBack}
          >
            ← COMMAND CENTRE
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="drivers-kpi-grid">
        <div className="drivers-kpi-card">
          <span>TOTAL DRIVERS</span>
          <strong>{statistics.total}</strong>
          <small>Registered personnel</small>
        </div>

        <div className="drivers-kpi-card">
          <span>ACTIVE DRIVERS</span>
          <strong>{statistics.active}</strong>
          <small>Currently available</small>
        </div>

        <div className="drivers-kpi-card">
          <span>INACTIVE</span>
          <strong>{statistics.inactive}</strong>
          <small>Currently unavailable</small>
        </div>

        <div className="drivers-kpi-card">
          <span>AVG EXPERIENCE</span>
          <strong>{statistics.averageExperience}</strong>
          <small>Years per driver</small>
        </div>

        <div className="drivers-kpi-card">
          <span>VEHICLE ASSIGNMENTS</span>
          <strong>{statistics.assigned}</strong>
          <small>Drivers linked to fleet</small>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="drivers-main-panel">
        <div className="drivers-panel-header">
          <div>
            <h2>DRIVER REGISTRY</h2>

            <p>
              Live driver records from PostgreSQL
            </p>
          </div>

          <div className="drivers-controls">
            <input
              type="text"
              placeholder="Search driver, vehicle, license..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <button onClick={fetchDriverData}>
              ↻ REFRESH
            </button>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="drivers-empty-state">
            <div className="drivers-loading">
              LOADING DRIVER TELEMETRY...
            </div>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="drivers-empty-state">
            <strong>NO DRIVER RECORDS FOUND</strong>
            <span>
              Try another search or check the PostgreSQL connection.
            </span>
          </div>
        ) : (
          <div className="drivers-table-wrapper">
            <table className="drivers-table">
              <thead>
                <tr>
                  <th>DRIVER</th>
                  <th>CONTACT</th>
                  <th>LICENSE</th>
                  <th>EXPERIENCE</th>
                  <th>ASSIGNED VEHICLE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredDrivers.map((driver) => {
                  const vehicle = getAssignedVehicle(driver);
                  const status = getDriverStatus(driver);

                  return (
                    <tr key={driver.id}>
                      <td>
                        <div className="driver-name-cell">
                          <div className="driver-avatar">
                            {String(
                              driver.driver_name || "D"
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {driver.driver_name ||
                                "Unknown Driver"}
                            </strong>

                            <small>
                              DRIVER ID:{" "}
                              {String(driver.id).padStart(
                                3,
                                "0"
                              )}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {driver.phone || "N/A"}
                      </td>

                      <td>
                        <span className="driver-license">
                          {driver.license_number || "N/A"}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {Number(
                            driver.experience_years || 0
                          )}
                        </strong>{" "}
                        yrs
                      </td>

                      <td>
                        {vehicle ? (
                          <div className="driver-vehicle">
                            <strong>
                              {vehicle.vehicle_number}
                            </strong>

                            <small>
                              {vehicle.vehicle_type ||
                                "Vehicle"}
                            </small>
                          </div>
                        ) : (
                          <span className="driver-unassigned">
                            UNASSIGNED
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`driver-status ${status.toLowerCase()}`}
                        >
                          <span></span>
                          {status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="driver-view-button"
                          onClick={() =>
                            setSelectedDriver(driver)
                          }
                        >
                          VIEW
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OPERATIONS SUMMARY */}
      <div className="drivers-summary-grid">
        <div className="drivers-summary-card">
          <span>DRIVER UTILIZATION</span>

          <div className="drivers-summary-number">
            {statistics.total > 0
              ? Math.round(
                  (statistics.active /
                    statistics.total) *
                    100
                )
              : 0}
            %
          </div>

          <div className="drivers-progress">
            <div
              style={{
                width: `${
                  statistics.total > 0
                    ? (statistics.active /
                        statistics.total) *
                      100
                    : 0
                }%`,
              }}
            ></div>
          </div>

          <small>
            Active drivers relative to total registered
            personnel.
          </small>
        </div>

        <div className="drivers-summary-card">
          <span>FLEET ASSIGNMENT</span>

          <div className="drivers-summary-number">
            {statistics.total > 0
              ? Math.round(
                  (statistics.assigned /
                    statistics.total) *
                    100
                )
              : 0}
            %
          </div>

          <div className="drivers-progress">
            <div
              style={{
                width: `${
                  statistics.total > 0
                    ? (statistics.assigned /
                        statistics.total) *
                      100
                    : 0
                }%`,
              }}
            ></div>
          </div>

          <small>
            Drivers currently linked to a fleet vehicle.
          </small>
        </div>

        <div className="drivers-summary-card">
          <span>DATA SOURCE</span>

          <div className="drivers-summary-source">
            PostgreSQL
          </div>

          <small>
            Automatic synchronization every 5 seconds.
          </small>
        </div>
      </div>

      {/* DRIVER DETAIL MODAL */}
      {selectedDriver && (
        <div
          className="driver-modal-overlay"
          onClick={() => setSelectedDriver(null)}
        >
          <div
            className="driver-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="driver-modal-header">
              <div>
                <span>DRIVER PROFILE</span>

                <h2>
                  {selectedDriver.driver_name}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedDriver(null)
                }
              >
                ×
              </button>
            </div>

            <div className="driver-modal-grid">
              <div>
                <span>DRIVER ID</span>
                <strong>
                  {selectedDriver.id}
                </strong>
              </div>

              <div>
                <span>STATUS</span>
                <strong>
                  {getDriverStatus(selectedDriver)}
                </strong>
              </div>

              <div>
                <span>PHONE</span>
                <strong>
                  {selectedDriver.phone || "N/A"}
                </strong>
              </div>

              <div>
                <span>LICENSE</span>
                <strong>
                  {selectedDriver.license_number ||
                    "N/A"}
                </strong>
              </div>

              <div>
                <span>EXPERIENCE</span>
                <strong>
                  {Number(
                    selectedDriver.experience_years || 0
                  )}{" "}
                  years
                </strong>
              </div>

              <div>
                <span>ASSIGNED VEHICLE</span>
                <strong>
                  {getAssignedVehicle(selectedDriver)
                    ?.vehicle_number || "UNASSIGNED"}
                </strong>
              </div>
            </div>

            <div className="driver-modal-footer">
              LIVE RECORD • POSTGRESQL
            </div>
          </div>
        </div>
      )}
    </div>
  );
}