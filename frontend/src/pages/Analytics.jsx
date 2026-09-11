import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

const getFirstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return undefined;
};

const normalizeKey = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase();
};

const parseNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const getStatusColor = (status) => {
  const value = String(
    status || ""
  ).toUpperCase();

  if (
    [
      "ACTIVE",
      "RUNNING",
      "IN_PROGRESS",
      "ONGOING",
      "COMPLETED",
      "RESOLVED",
    ].includes(value)
  ) {
    return "#16a34a";
  }

  if (
    [
      "IDLE",
      "PENDING",
      "ASSIGNED",
      "DISPATCHED",
      "MEDIUM",
    ].includes(value)
  ) {
    return "#d97706";
  }

  if (
    [
      "MAINTENANCE",
      "HIGH",
      "DELAYED",
    ].includes(value)
  ) {
    return "#ea580c";
  }

  if (
    [
      "INACTIVE",
      "CRITICAL",
      "FAILED",
      "OFFLINE",
    ].includes(value)
  ) {
    return "#dc2626";
  }

  return "#64748b";
};

const getPerformanceColor = (
  score
) => {
  const value = parseNumber(score);

  if (value >= 85) {
    return "#16a34a";
  }

  if (value >= 70) {
    return "#d97706";
  }

  if (value >= 50) {
    return "#ea580c";
  }

  return "#dc2626";
};

const getRiskColor = (risk) => {
  const value = String(
    risk || ""
  ).toUpperCase();

  if (value === "LOW") {
    return "#16a34a";
  }

  if (value === "MEDIUM") {
    return "#d97706";
  }

  if (value === "HIGH") {
    return "#ea580c";
  }

  if (value === "CRITICAL") {
    return "#dc2626";
  }

  return "#64748b";
};

const getPerformanceLabel = (
  score
) => {
  const value = parseNumber(score);

  if (value >= 85) {
    return "EXCELLENT";
  }

  if (value >= 70) {
    return "GOOD";
  }

  if (value >= 50) {
    return "AVERAGE";
  }

  return "ATTENTION";
};

/* =========================================================
   MAIN ANALYTICS COMPONENT
   ========================================================= */

export default function Analytics() {
  /* =======================================================
     STATE
     ======================================================= */

  const [vehicles, setVehicles] =
    useState([]);

  const [routes, setRoutes] =
    useState([]);

  const [alerts, setAlerts] =
    useState([]);

  const [drivers, setDrivers] =
    useState([]);

  const [gps, setGps] =
    useState([]);

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  /* =======================================================
     LOAD ANALYTICS DATA
     ======================================================= */

  useEffect(() => {
    let mounted = true;

    const loadAnalyticsData =
      async () => {
        try {
          const endpoints = [
            `${API_BASE_URL}/vehicles`,
            `${API_BASE_URL}/routes`,
            `${API_BASE_URL}/alerts`,
            `${API_BASE_URL}/drivers`,
            `${API_BASE_URL}/gps`,
          ];

          const responses =
            await Promise.allSettled(
              endpoints.map((url) =>
                fetch(url)
              )
            );

          const parsed =
            await Promise.all(
              responses.map(
                async (result) => {
                  if (
                    result.status !==
                    "fulfilled"
                  ) {
                    return [];
                  }

                  try {
                    if (
                      !result.value.ok
                    ) {
                      return [];
                    }

                    return await result.value.json();
                  } catch {
                    return [];
                  }
                }
              )
            );

          if (!mounted) {
            return;
          }

          const [
            vehicleData,
            routeData,
            alertData,
            driverData,
            gpsData,
          ] = parsed;

          setVehicles(
            Array.isArray(vehicleData)
              ? vehicleData
              : vehicleData?.vehicles ||
                vehicleData?.data ||
                []
          );

          setRoutes(
            Array.isArray(routeData)
              ? routeData
              : routeData?.routes ||
                routeData?.data ||
                []
          );

          setAlerts(
            Array.isArray(alertData)
              ? alertData
              : alertData?.alerts ||
                alertData?.data ||
                []
          );

          setDrivers(
            Array.isArray(driverData)
              ? driverData
              : driverData?.drivers ||
                driverData?.data ||
                []
          );

          setGps(
            Array.isArray(gpsData)
              ? gpsData
              : gpsData?.gps ||
                gpsData?.data ||
                []
          );

          setLastUpdated(
            new Date()
          );
        } catch (error) {
          console.error(
            "Analytics data loading error:",
            error
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadAnalyticsData();

    const interval =
      setInterval(
        loadAnalyticsData,
        5000
      );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  /* =======================================================
     FLEET STATISTICS
     ======================================================= */

  const fleetStats = useMemo(() => {
    const total =
      vehicles.length;

    const active =
      vehicles.filter(
        (vehicle) =>
          String(
            getFirstValue(
              vehicle.status,
              vehicle.vehicle_status,
              vehicle.vehicleStatus
            ) || ""
          ).toUpperCase() ===
          "ACTIVE"
      ).length;

    const idle =
      vehicles.filter(
        (vehicle) =>
          String(
            getFirstValue(
              vehicle.status,
              vehicle.vehicle_status,
              vehicle.vehicleStatus
            ) || ""
          ).toUpperCase() ===
          "IDLE"
      ).length;

    const maintenance =
      vehicles.filter(
        (vehicle) =>
          String(
            getFirstValue(
              vehicle.status,
              vehicle.vehicle_status,
              vehicle.vehicleStatus
            ) || ""
          ).toUpperCase() ===
          "MAINTENANCE"
      ).length;

    const inactive =
      vehicles.filter(
        (vehicle) =>
          String(
            getFirstValue(
              vehicle.status,
              vehicle.vehicle_status,
              vehicle.vehicleStatus
            ) || ""
          ).toUpperCase() ===
          "INACTIVE"
      ).length;

    const averageSpeed =
      total > 0
        ? Math.round(
            vehicles.reduce(
              (sum, vehicle) =>
                sum +
                parseNumber(
                  getFirstValue(
                    vehicle.speed,
                    vehicle.current_speed,
                    vehicle.currentSpeed
                  )
                ),
              0
            ) / total
          )
        : 0;

    const averageFuel =
      total > 0
        ? Math.round(
            vehicles.reduce(
              (sum, vehicle) =>
                sum +
                parseNumber(
                  getFirstValue(
                    vehicle.fuel_level,
                    vehicle.fuelLevel,
                    vehicle.fuel
                  )
                ),
              0
            ) / total
          )
        : 0;

    return {
      total,
      active,
      idle,
      maintenance,
      inactive,
      averageSpeed,
      averageFuel,
    };
  }, [vehicles]);

  /* =======================================================
     INCIDENT → VEHICLE MAP
     ======================================================= */

  const incidentMap = useMemo(() => {
    const map = new Map();

    alerts.forEach((alert) => {
      const vehicleId =
        getFirstValue(
          alert.vehicle_id,
          alert.vehicleId,
          alert.vehicle_number,
          alert.vehicleNumber,
          alert.vehicle
        );

      const key =
        normalizeKey(vehicleId);

      if (!key) {
        return;
      }

      if (!map.has(key)) {
        map.set(key, []);
      }

      map
        .get(key)
        .push(alert);
    });

    return map;
  }, [alerts]);

  /* =======================================================
     GPS → VEHICLE MAP
     ======================================================= */

  const gpsMap = useMemo(() => {
    const map = new Map();

    gps.forEach((item) => {
      const vehicleId =
        getFirstValue(
          item.vehicle_id,
          item.vehicleId,
          item.vehicle_number,
          item.vehicleNumber,
          item.vehicle
        );

      const key =
        normalizeKey(vehicleId);

      if (!key) {
        return;
      }

      if (!map.has(key)) {
        map.set(key, []);
      }

      map
        .get(key)
        .push(item);
    });

    return map;
  }, [gps]);

  /* =======================================================
     VEHICLE PERFORMANCE INTELLIGENCE
     ======================================================= */

  const vehiclePerformance =
    useMemo(() => {
      return vehicles
        .map((vehicle, index) => {
          const vehicleId =
            getFirstValue(
              vehicle.id,
              vehicle.vehicle_id,
              vehicle.vehicleId
            ) ||
            `vehicle-${index + 1}`;

          const vehicleNumber =
            getFirstValue(
              vehicle.vehicle_number,
              vehicle.vehicleNumber,
              vehicle.registration_number,
              vehicle.registrationNumber,
              vehicle.number
            ) ||
            vehicleId;

          const speed =
            parseNumber(
              getFirstValue(
                vehicle.speed,
                vehicle.current_speed,
                vehicle.currentSpeed
              )
            );

          const fuel =
            parseNumber(
              getFirstValue(
                vehicle.fuel_level,
                vehicle.fuelLevel,
                vehicle.fuel
              )
            );

          const status =
            String(
              getFirstValue(
                vehicle.status,
                vehicle.vehicle_status,
                vehicle.vehicleStatus
              ) || "UNKNOWN"
            ).toUpperCase();

          const vehicleAlerts =
            incidentMap.get(
              normalizeKey(
                vehicleNumber
              )
            ) ||
            incidentMap.get(
              normalizeKey(vehicleId)
            ) ||
            [];

          const unresolvedAlerts =
            vehicleAlerts.filter(
              (alert) => {
                const alertStatus =
                  String(
                    getFirstValue(
                      alert.status,
                      alert.alert_status,
                      alert.alertStatus
                    ) || ""
                  ).toUpperCase();

                return ![
                  "RESOLVED",
                  "CLOSED",
                  "COMPLETED",
                ].includes(
                  alertStatus
                );
              }
            );

          let score = 100;

          if (speed > 90) {
            score -= 20;
          } else if (speed > 75) {
            score -= 10;
          }

          if (fuel < 20) {
            score -= 25;
          } else if (fuel < 40) {
            score -= 10;
          }

          if (
            status === "MAINTENANCE"
          ) {
            score -= 25;
          } else if (
            status === "INACTIVE"
          ) {
            score -= 20;
          } else if (
            status === "IDLE"
          ) {
            score -= 5;
          }

          score -= Math.min(
            30,
            unresolvedAlerts.length * 10
          );

          score = Math.max(
            0,
            Math.min(
              100,
              Math.round(score)
            )
          );

          return {
            ...vehicle,
            vehicleId,
            vehicleNumber,
            speed,
            fuel,
            status,
            unresolvedAlerts,
            score,
            performance:
              getPerformanceLabel(
                score
              ),
          };
        })
        .sort(
          (a, b) =>
            b.score - a.score
        );
    }, [vehicles, incidentMap]);

  /* =======================================================
     PERFORMANCE SUMMARY
     ======================================================= */

  const performanceSummary =
    useMemo(() => {
      const total =
        vehiclePerformance.length;

      const average =
        total > 0
          ? Math.round(
              vehiclePerformance.reduce(
                (sum, vehicle) =>
                  sum + vehicle.score,
                0
              ) / total
            )
          : 0;

      const excellent =
        vehiclePerformance.filter(
          (vehicle) =>
            vehicle.score >= 85
        ).length;

      const good =
        vehiclePerformance.filter(
          (vehicle) =>
            vehicle.score >= 70 &&
            vehicle.score < 85
        ).length;

      const averageCount =
        vehiclePerformance.filter(
          (vehicle) =>
            vehicle.score >= 50 &&
            vehicle.score < 70
        ).length;

      const attention =
        vehiclePerformance.filter(
          (vehicle) =>
            vehicle.score < 50
        ).length;

      return {
        total,
        average,
        excellent,
        good,
        averageCount,
        attention,
      };
    }, [vehiclePerformance]);

  /* =======================================================
     ROUTE STATISTICS
     ======================================================= */

  const routeStats =
    useMemo(() => {
      const total =
        routes.length;

      const completed =
        routes.filter(
          (route) =>
            [
              "COMPLETED",
              "COMPLETE",
              "DELIVERED",
            ].includes(
              String(
                getFirstValue(
                  route.status,
                  route.route_status,
                  route.routeStatus
                ) || ""
              ).toUpperCase()
            )
        ).length;

      const active =
        routes.filter(
          (route) =>
            [
              "ACTIVE",
              "IN_PROGRESS",
              "ONGOING",
            ].includes(
              String(
                getFirstValue(
                  route.status,
                  route.route_status,
                  route.routeStatus
                ) || ""
              ).toUpperCase()
            )
        ).length;

      const delayed =
        routes.filter(
          (route) =>
            parseNumber(
              getFirstValue(
                route.delay,
                route.delay_minutes,
                route.delayMinutes
              )
            ) > 5
        ).length;

      const averageDistance =
        total > 0
          ? Math.round(
              routes.reduce(
                (sum, route) =>
                  sum +
                  parseNumber(
                    getFirstValue(
                      route.distance,
                      route.distance_km,
                      route.distanceKm,
                      route.total_distance
                    )
                  ),
                0
              ) / total
            )
          : 0;

      const completionRate =
        total > 0
          ? Math.round(
              (completed / total) *
                100
            )
          : 0;

      return {
        total,
        completed,
        active,
        delayed,
        averageDistance,
        completionRate,
      };
    }, [routes]);

  /* =======================================================
     INCIDENT STATISTICS
     ======================================================= */

  const incidentStats =
    useMemo(() => {
      const total =
        alerts.length;

      const unresolved =
        alerts.filter(
          (alert) => {
            const status =
              String(
                getFirstValue(
                  alert.status,
                  alert.alert_status,
                  alert.alertStatus
                ) || ""
              ).toUpperCase();

            return ![
              "RESOLVED",
              "CLOSED",
              "COMPLETED",
            ].includes(status);
          }
        ).length;

      const high =
        alerts.filter(
          (alert) =>
            String(
              getFirstValue(
                alert.severity,
                alert.priority,
                alert.alert_level,
                alert.alertLevel
              ) || ""
            ).toUpperCase() ===
            "HIGH"
        ).length;

      const medium =
        alerts.filter(
          (alert) =>
            String(
              getFirstValue(
                alert.severity,
                alert.priority,
                alert.alert_level,
                alert.alertLevel
              ) || ""
            ).toUpperCase() ===
            "MEDIUM"
        ).length;

      const critical =
        alerts.filter(
          (alert) =>
            String(
              getFirstValue(
                alert.severity,
                alert.priority,
                alert.alert_level,
                alert.alertLevel
              ) || ""
            ).toUpperCase() ===
            "CRITICAL"
        ).length;

      return {
        total,
        unresolved,
        high,
        medium,
        critical,
      };
    }, [alerts]);

  /* =======================================================
     DRIVER STATISTICS
     ======================================================= */

  const driverStats =
    useMemo(() => {
      const total =
        drivers.length;

      const active =
        drivers.filter(
          (driver) =>
            String(
              getFirstValue(
                driver.status,
                driver.driver_status,
                driver.driverStatus
              ) || ""
            ).toUpperCase() ===
            "ACTIVE"
        ).length;

      const inactive =
        total - active;

      return {
        total,
        active,
        inactive,
      };
    }, [drivers]);

  /* =======================================================
     GPS STATISTICS
     ======================================================= */

  const gpsStats =
    useMemo(() => {
      const total =
        gps.length;

      const uniqueVehicles =
        new Set(
          gps
            .map((item) =>
              normalizeKey(
                getFirstValue(
                  item.vehicle_id,
                  item.vehicleId,
                  item.vehicle_number,
                  item.vehicleNumber,
                  item.vehicle
                )
              )
            )
            .filter(Boolean)
        ).size;

      return {
        total,
        uniqueVehicles,
      };
    }, [gps]);

  /* =======================================================
     FUEL HEALTH
     ======================================================= */

  const fuelHealth =
    useMemo(() => {
      const low =
        vehicles.filter(
          (vehicle) =>
            parseNumber(
              getFirstValue(
                vehicle.fuel_level,
                vehicle.fuelLevel,
                vehicle.fuel
              )
            ) < 20
        ).length;

      const warning =
        vehicles.filter(
          (vehicle) => {
            const fuel =
              parseNumber(
                getFirstValue(
                  vehicle.fuel_level,
                  vehicle.fuelLevel,
                  vehicle.fuel
                )
              );

            return (
              fuel >= 20 &&
              fuel < 40
            );
          }
        ).length;

      const healthy =
        vehicles.filter(
          (vehicle) =>
            parseNumber(
              getFirstValue(
                vehicle.fuel_level,
                vehicle.fuelLevel,
                vehicle.fuel
              )
            ) >= 40
        ).length;

      return {
        low,
        warning,
        healthy,
      };
    }, [vehicles]);

  /* =======================================================
     VEHICLE RISK INTELLIGENCE
     ======================================================= */

  const vehicleRisk =
    useMemo(() => {
      return vehicles
        .map((vehicle, index) => {
          const vehicleId =
            getFirstValue(
              vehicle.id,
              vehicle.vehicle_id,
              vehicle.vehicleId
            ) ||
            `vehicle-${index + 1}`;

          const vehicleNumber =
            getFirstValue(
              vehicle.vehicle_number,
              vehicle.vehicleNumber,
              vehicle.registration_number,
              vehicle.registrationNumber,
              vehicle.number
            ) ||
            vehicleId;

          const speed =
            parseNumber(
              getFirstValue(
                vehicle.speed,
                vehicle.current_speed,
                vehicle.currentSpeed
              )
            );

          const fuel =
            parseNumber(
              getFirstValue(
                vehicle.fuel_level,
                vehicle.fuelLevel,
                vehicle.fuel
              )
            );

          const status =
            String(
              getFirstValue(
                vehicle.status,
                vehicle.vehicle_status,
                vehicle.vehicleStatus
              ) || "UNKNOWN"
            ).toUpperCase();

          const vehicleAlerts =
            incidentMap.get(
              normalizeKey(
                vehicleNumber
              )
            ) ||
            incidentMap.get(
              normalizeKey(vehicleId)
            ) ||
            [];

          const unresolvedAlerts =
            vehicleAlerts.filter(
              (alert) => {
                const alertStatus =
                  String(
                    getFirstValue(
                      alert.status,
                      alert.alert_status,
                      alert.alertStatus
                    ) || ""
                  ).toUpperCase();

                return ![
                  "RESOLVED",
                  "CLOSED",
                  "COMPLETED",
                ].includes(
                  alertStatus
                );
              }
            );

          let riskScore = 0;

          if (speed > 90) {
            riskScore += 30;
          } else if (speed > 75) {
            riskScore += 15;
          } else if (speed > 60) {
            riskScore += 5;
          }

          if (fuel < 15) {
            riskScore += 30;
          } else if (fuel < 25) {
            riskScore += 20;
          } else if (fuel < 40) {
            riskScore += 10;
          }

          if (
            status === "MAINTENANCE"
          ) {
            riskScore += 25;
          } else if (
            status === "INACTIVE"
          ) {
            riskScore += 15;
          }

          unresolvedAlerts.forEach(
            (alert) => {
              const severity =
                String(
                  getFirstValue(
                    alert.severity,
                    alert.priority,
                    alert.alert_level,
                    alert.alertLevel
                  ) || ""
                ).toUpperCase();

              if (
                severity ===
                "CRITICAL"
              ) {
                riskScore += 25;
              } else if (
                severity === "HIGH"
              ) {
                riskScore += 15;
              } else if (
                severity === "MEDIUM"
              ) {
                riskScore += 8;
              } else {
                riskScore += 4;
              }
            }
          );

          riskScore = Math.max(
            0,
            Math.min(
              100,
              Math.round(riskScore)
            )
          );

          let risk = "LOW";

          if (riskScore >= 80) {
            risk = "CRITICAL";
          } else if (riskScore >= 60) {
            risk = "HIGH";
          } else if (riskScore >= 35) {
            risk = "MEDIUM";
          }

          return {
            ...vehicle,
            vehicleId,
            vehicleNumber,
            speed,
            fuel,
            status,
            unresolvedAlerts,
            riskScore,
            risk,
          };
        })
        .sort(
          (a, b) =>
            b.riskScore -
            a.riskScore
        );
    }, [vehicles, incidentMap]);

  /* =======================================================
     RISK SUMMARY
     ======================================================= */

  const riskSummary =
    useMemo(() => {
      return {
        critical:
          vehicleRisk.filter(
            (vehicle) =>
              vehicle.risk ===
              "CRITICAL"
          ).length,

        high:
          vehicleRisk.filter(
            (vehicle) =>
              vehicle.risk === "HIGH"
          ).length,

        medium:
          vehicleRisk.filter(
            (vehicle) =>
              vehicle.risk ===
              "MEDIUM"
          ).length,

        low:
          vehicleRisk.filter(
            (vehicle) =>
              vehicle.risk === "LOW"
          ).length,
      };
    }, [vehicleRisk]);

    /* =========================================================
     ROUTE INTELLIGENCE ENGINE
     ========================================================= */

  const routeIntelligence = useMemo(() => {
    const vehicleLookup = new Map();

    vehicleRisk.forEach((vehicle) => {
      const keys = [
        vehicle.vehicleId,
        vehicle.vehicleNumber,
        vehicle.id,
        vehicle.vehicle,
      ];

      keys.forEach((key) => {
        const normalized = normalizeKey(key);

        if (normalized) {
          vehicleLookup.set(
            normalized,
            vehicle
          );
        }
      });
    });

    return routes
      .map((route, index) => {
        const routeId =
          getFirstValue(
            route.id,
            route.route_id,
            route.routeId,
            route.route_number,
            route.routeNumber
          ) ||
          `ROUTE-${index + 1}`;

        const status = String(
          getFirstValue(
            route.status,
            route.route_status,
            route.routeStatus
          ) || "ACTIVE"
        ).toUpperCase();

        const routeVehicle =
          getFirstValue(
            route.vehicle_id,
            route.vehicleId,
            route.vehicle_number,
            route.vehicleNumber,
            route.vehicle,
            route.assigned_vehicle
          );

        const origin =
          getFirstValue(
            route.origin,
            route.source,
            route.start_location,
            route.startLocation,
            route.from
          ) || "Unknown";

        const destination =
          getFirstValue(
            route.destination,
            route.dest,
            route.end_location,
            route.endLocation,
            route.to
          ) || "Unknown";

        const distance =
          parseNumber(
            getFirstValue(
              route.distance,
              route.distance_km,
              route.distanceKm,
              route.total_distance
            )
          );

        const eta =
          parseNumber(
            getFirstValue(
              route.eta,
              route.eta_minutes,
              route.etaMinutes,
              route.estimated_time
            )
          );

        const delay =
          parseNumber(
            getFirstValue(
              route.delay,
              route.delay_minutes,
              route.delayMinutes,
              route.delay_time
            )
          );

        const progress =
          parseNumber(
            getFirstValue(
              route.progress,
              route.completion,
              route.completion_percentage,
              route.completionPercentage
            )
          );

        const priority = String(
          getFirstValue(
            route.priority,
            route.priority_level,
            route.priorityLevel
          ) || "NORMAL"
        ).toUpperCase();

        const normalizedVehicle =
          normalizeKey(
            routeVehicle
          );

        const vehicle =
          vehicleLookup.get(
            normalizedVehicle
          ) || null;

        const routeAlerts =
          alerts.filter((alert) => {
            const alertVehicle =
              getFirstValue(
                alert.vehicle_id,
                alert.vehicleId,
                alert.vehicle_number,
                alert.vehicleNumber,
                alert.vehicle
              );

            return (
              normalizedVehicle &&
              normalizeKey(
                alertVehicle
              ) ===
                normalizedVehicle
            );
          });

        const unresolvedAlerts =
          routeAlerts.filter(
            (alert) => {
              const alertStatus =
                String(
                  getFirstValue(
                    alert.status,
                    alert.alert_status,
                    alert.alertStatus
                  ) || ""
                ).toUpperCase();

              return ![
                "RESOLVED",
                "CLOSED",
                "COMPLETED",
              ].includes(
                alertStatus
              );
            }
          );

        let riskScore =
          vehicle?.riskScore || 0;

        if (delay > 30) {
          riskScore += 25;
        } else if (delay > 15) {
          riskScore += 15;
        } else if (delay > 5) {
          riskScore += 8;
        }

        if (
          unresolvedAlerts.length >
          0
        ) {
          riskScore += Math.min(
            30,
            unresolvedAlerts.length *
              10
          );
        }

        if (
          priority === "HIGH" ||
          priority === "URGENT"
        ) {
          riskScore += 10;
        }

        riskScore = Math.max(
          0,
          Math.min(
            100,
            Math.round(riskScore)
          )
        );

        let risk = "LOW";

        if (riskScore >= 80) {
          risk = "CRITICAL";
        } else if (riskScore >= 60) {
          risk = "HIGH";
        } else if (riskScore >= 35) {
          risk = "MEDIUM";
        }

        const performanceScore =
          Math.max(
            0,
            Math.min(
              100,
              100 - riskScore
            )
          );

        let reason =
          "Route operating normally.";

        if (risk === "CRITICAL") {
          reason =
            "Critical route risk requires immediate attention.";
        } else if (risk === "HIGH") {
          reason =
            "High route risk detected. Monitor route closely.";
        } else if (delay > 15) {
          reason =
            "Route delay is affecting operational efficiency.";
        } else if (
          unresolvedAlerts.length >
          0
        ) {
          reason =
            "Unresolved vehicle incidents are affecting route safety.";
        } else if (
          vehicle &&
          vehicle.risk === "MEDIUM"
        ) {
          reason =
            "Vehicle condition requires moderate monitoring.";
        }

        return {
          ...route,
          routeId,
          status,
          routeVehicle,
          origin,
          destination,
          distance,
          eta,
          delay,
          progress,
          priority,
          vehicle,
          routeAlerts,
          unresolvedAlerts,
          riskScore,
          risk,
          performanceScore,
          reason,
        };
      })
      .sort(
        (a, b) =>
          b.riskScore -
          a.riskScore
      );
  }, [
    routes,
    vehicleRisk,
    alerts,
  ]);

  /* =========================================================
     ROUTE SUMMARY
     ========================================================= */

  const routeSummary = useMemo(() => {
    const total =
      routeIntelligence.length;

    const active =
      routeIntelligence.filter(
        (route) =>
          [
            "ACTIVE",
            "IN_PROGRESS",
            "ONGOING",
          ].includes(route.status)
      ).length;

    const completed =
      routeIntelligence.filter(
        (route) =>
          [
            "COMPLETED",
            "COMPLETE",
            "DELIVERED",
          ].includes(route.status)
      ).length;

    const delayed =
      routeIntelligence.filter(
        (route) =>
          route.delay > 5
      ).length;

    const critical =
      routeIntelligence.filter(
        (route) =>
          route.risk === "CRITICAL"
      ).length;

    const high =
      routeIntelligence.filter(
        (route) =>
          route.risk === "HIGH"
      ).length;

    const medium =
      routeIntelligence.filter(
        (route) =>
          route.risk === "MEDIUM"
      ).length;

    const low =
      routeIntelligence.filter(
        (route) =>
          route.risk === "LOW"
      ).length;

    const averageRisk =
      total > 0
        ? Math.round(
            routeIntelligence.reduce(
              (sum, route) =>
                sum +
                route.riskScore,
              0
            ) / total
          )
        : 0;

    const averageScore =
      total > 0
        ? Math.round(
            routeIntelligence.reduce(
              (sum, route) =>
                sum +
                route.performanceScore,
              0
            ) / total
          )
        : 0;

    const highestRiskRoute =
      routeIntelligence.length >
      0
        ? routeIntelligence[0]
        : null;

    return {
      total,
      active,
      completed,
      delayed,
      critical,
      high,
      medium,
      low,
      averageRisk,
      averageScore,
      highestRiskRoute,
    };
  }, [routeIntelligence]);

  /* =========================================================
     ADVANCED ROUTE INTELLIGENCE ENGINE
     ========================================================= */

  const advancedRouteIntelligence =
    useMemo(() => {
      if (
        !routeIntelligence.length
      ) {
        return [];
      }

      return routeIntelligence
        .map((route) => {
          const vehicleKey =
            normalizeKey(
              route.routeVehicle
            );

          const gpsRecords =
            vehicleKey
              ? gpsMap.get(
                  vehicleKey
                ) || []
              : [];

          const gpsCount =
            gpsRecords.length;

          const routeAlerts =
            route.unresolvedAlerts ||
            [];

          let efficiencyScore = 100;
          let gpsScore = 100;
          let stabilityScore = 100;

          const insights = [];

          /* GPS TELEMETRY QUALITY */

          if (gpsCount === 0) {
            gpsScore -= 25;

            insights.push(
              "No recent GPS telemetry"
            );
          } else if (
            gpsCount < 3
          ) {
            gpsScore -= 10;

            insights.push(
              "Limited GPS telemetry"
            );
          }

          /* ROUTE DELAY IMPACT */

          if (route.delay > 30) {
            efficiencyScore -= 30;

            insights.push(
              "Severe route delay"
            );
          } else if (
            route.delay > 15
          ) {
            efficiencyScore -= 20;

            insights.push(
              "Significant route delay"
            );
          } else if (
            route.delay > 5
          ) {
            efficiencyScore -= 10;

            insights.push(
              "Minor route delay"
            );
          }

          /* ETA IMPACT */

          if (route.eta > 240) {
            efficiencyScore -= 15;

            insights.push(
              "Very high ETA"
            );
          } else if (
            route.eta > 120
          ) {
            efficiencyScore -= 8;

            insights.push(
              "Elevated ETA"
            );
          }

          /* INCIDENT IMPACT */

          if (
            routeAlerts.length > 0
          ) {
            stabilityScore -= Math.min(
              30,
              routeAlerts.length * 8
            );

            insights.push(
              `${routeAlerts.length} unresolved route incident${
                routeAlerts.length >
                1
                  ? "s"
                  : ""
              }`
            );
          }

          /* VEHICLE RISK IMPACT */

          if (route.vehicle) {
            if (
              route.vehicle.risk ===
              "CRITICAL"
            ) {
              stabilityScore -= 25;

              insights.push(
                "Critical vehicle risk"
              );
            } else if (
              route.vehicle.risk ===
              "HIGH"
            ) {
              stabilityScore -= 15;

              insights.push(
                "High vehicle risk"
              );
            } else if (
              route.vehicle.risk ===
              "MEDIUM"
            ) {
              stabilityScore -= 8;

              insights.push(
                "Medium vehicle risk"
              );
            }
          }

          /* PROGRESS IMPACT */

          if (
            route.status ===
              "ACTIVE" &&
            route.progress <
              20 &&
            route.delay > 10
          ) {
            efficiencyScore -= 10;

            insights.push(
              "Low route progress with delay"
            );
          }

          efficiencyScore =
            Math.max(
              0,
              Math.min(
                100,
                efficiencyScore
              )
            );

          gpsScore =
            Math.max(
              0,
              Math.min(
                100,
                gpsScore
              )
            );

          stabilityScore =
            Math.max(
              0,
              Math.min(
                100,
                stabilityScore
              )
            );

          /* ADVANCED ROUTE SCORE */

          const advancedScore =
            Math.round(
              efficiencyScore *
                0.45 +
                gpsScore * 0.2 +
                stabilityScore *
                  0.35
            );

          /* INTELLIGENCE LEVEL */

          let intelligenceLevel =
            "OPTIMAL";

          if (
            advancedScore < 50
          ) {
            intelligenceLevel =
              "CRITICAL";
          } else if (
            advancedScore < 70
          ) {
            intelligenceLevel =
              "HIGH ATTENTION";
          } else if (
            advancedScore < 85
          ) {
            intelligenceLevel =
              "MONITOR";
          }

          /* AI RECOMMENDATION */

          let recommendation =
            "Continue current route operations.";

          if (
            route.delay > 30
          ) {
            recommendation =
              "Consider rerouting or dispatch intervention due to severe delay.";
          } else if (
            routeAlerts.length >
            0
          ) {
            recommendation =
              "Investigate active incidents before continuing normal route operations.";
          } else if (
            route.vehicle &&
            (
              route.vehicle.risk ===
                "HIGH" ||
              route.vehicle.risk ===
                "CRITICAL"
            )
          ) {
            recommendation =
              "Review vehicle condition before assigning additional route workload.";
          } else if (
            gpsCount === 0
          ) {
            recommendation =
              "Restore GPS telemetry to improve route monitoring accuracy.";
          } else if (
            route.eta > 120
          ) {
            recommendation =
              "Monitor ETA closely and evaluate route optimization.";
          } else if (
            advancedScore >= 85
          ) {
            recommendation =
              "Route is operating efficiently with reliable telemetry.";
          }

          return {
            ...route,

            gpsRecords:
              gpsCount,

            efficiencyScore,

            gpsScore,

            stabilityScore,

            advancedScore,

            intelligenceLevel,

            recommendation,

            insight:
              insights.length > 0
                ? insights
                    .slice(0, 3)
                    .join(" • ")
                : "Route operating efficiently with stable telemetry.",
          };
        })
        .sort(
          (a, b) =>
            a.advancedScore -
            b.advancedScore
        );
    }, [
      routeIntelligence,
      gpsMap,
    ]);

  /* =========================================================
     ADVANCED ROUTE SUMMARY
     ========================================================= */

  const advancedRouteSummary =
    useMemo(() => {
      const total =
        advancedRouteIntelligence.length;

      const averageScore =
        total > 0
          ? Math.round(
              advancedRouteIntelligence.reduce(
                (sum, route) =>
                  sum +
                  route.advancedScore,
                0
              ) / total
            )
          : 0;

      const critical =
        advancedRouteIntelligence.filter(
          (route) =>
            route.intelligenceLevel ===
            "CRITICAL"
        ).length;

      const highAttention =
        advancedRouteIntelligence.filter(
          (route) =>
            route.intelligenceLevel ===
            "HIGH ATTENTION"
        ).length;

      const monitor =
        advancedRouteIntelligence.filter(
          (route) =>
            route.intelligenceLevel ===
            "MONITOR"
        ).length;

      const optimal =
        advancedRouteIntelligence.filter(
          (route) =>
            route.intelligenceLevel ===
            "OPTIMAL"
        ).length;

      const gpsReliable =
        advancedRouteIntelligence.filter(
          (route) =>
            route.gpsRecords > 0
        ).length;

      const highestPriorityRoute =
        advancedRouteIntelligence.length >
        0
          ? advancedRouteIntelligence[0]
          : null;

      return {
        total,
        averageScore,
        critical,
        highAttention,
        monitor,
        optimal,
        gpsReliable,
        highestPriorityRoute,
      };
    }, [
      advancedRouteIntelligence,
    ]);

      /* =========================================================
     LIVE VEHICLE INTELLIGENCE ENGINE
     ========================================================= */

  const liveVehicleIntelligence = useMemo(() => {
    return vehicleRisk.map((vehicle) => {
      const vehicleKey =
        normalizeKey(vehicle.vehicleNumber) ||
        normalizeKey(vehicle.vehicleId);

      const gpsRecords =
        vehicleKey
          ? gpsMap.get(vehicleKey) || []
          : [];

      const gpsCount =
        gpsRecords.length;

      let intelligenceScore = 100;

      const insights = [];
      let recommendation =
        "Vehicle operating normally.";

      /* SPEED INTELLIGENCE */
      if (vehicle.speed > 90) {
        intelligenceScore -= 30;
        insights.push(
          "Severe speeding detected"
        );
      } else if (vehicle.speed > 75) {
        intelligenceScore -= 15;
        insights.push(
          "High speed detected"
        );
      }

      /* FUEL INTELLIGENCE */
      if (vehicle.fuel < 15) {
        intelligenceScore -= 25;
        insights.push(
          "Critical fuel level"
        );
      } else if (vehicle.fuel < 25) {
        intelligenceScore -= 15;
        insights.push(
          "Low fuel level"
        );
      }

      /* INCIDENT INTELLIGENCE */
      if (
        vehicle.unresolvedAlerts.length > 0
      ) {
        intelligenceScore -= Math.min(
          25,
          vehicle.unresolvedAlerts.length * 8
        );

        insights.push(
          `${vehicle.unresolvedAlerts.length} unresolved incident${
            vehicle.unresolvedAlerts.length > 1
              ? "s"
              : ""
          }`
        );
      }

      /* GPS INTELLIGENCE */
      if (gpsCount === 0) {
        intelligenceScore -= 15;
        insights.push(
          "No GPS telemetry detected"
        );
      } else if (gpsCount < 3) {
        intelligenceScore -= 5;
        insights.push(
          "Limited GPS telemetry"
        );
      }

      /* VEHICLE RISK */
      if (vehicle.risk === "CRITICAL") {
        intelligenceScore -= 20;
        insights.push(
          "Critical vehicle risk"
        );
      } else if (vehicle.risk === "HIGH") {
        intelligenceScore -= 12;
        insights.push(
          "High vehicle risk"
        );
      } else if (
        vehicle.risk === "MEDIUM"
      ) {
        intelligenceScore -= 6;
      }

      intelligenceScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            intelligenceScore
          )
        )
      );

      /* INTELLIGENCE LEVEL */

      let intelligenceLevel =
        "OPTIMAL";

      if (
        intelligenceScore < 50
      ) {
        intelligenceLevel =
          "CRITICAL";
      } else if (
        intelligenceScore < 70
      ) {
        intelligenceLevel =
          "HIGH ATTENTION";
      } else if (
        intelligenceScore < 85
      ) {
        intelligenceLevel =
          "MONITOR";
      }

      /* AI RECOMMENDATION */

      if (vehicle.speed > 90) {
        recommendation =
          "Reduce vehicle speed immediately and investigate speeding risk.";
      } else if (
        vehicle.fuel < 15
      ) {
        recommendation =
          "Refuel vehicle immediately before continuing long-distance operations.";
      } else if (
        vehicle.unresolvedAlerts.length > 0
      ) {
        recommendation =
          "Investigate unresolved incidents before assigning additional workload.";
      } else if (
        vehicle.risk === "CRITICAL" ||
        vehicle.risk === "HIGH"
      ) {
        recommendation =
          "Inspect vehicle condition before continuing normal operations.";
      } else if (
        gpsCount === 0
      ) {
        recommendation =
          "Restore GPS telemetry to maintain reliable fleet monitoring.";
      } else if (
        intelligenceScore >= 85
      ) {
        recommendation =
          "Vehicle is operating efficiently with stable telemetry.";
      }

      return {
        ...vehicle,
        gpsRecords: gpsCount,
        intelligenceScore,
        intelligenceLevel,
        recommendation,
        insight:
          insights.length > 0
            ? insights
                .slice(0, 3)
                .join(" • ")
            : "Vehicle operating efficiently with stable telemetry.",
      };
    }).sort(
      (a, b) =>
        a.intelligenceScore -
        b.intelligenceScore
    );
  }, [
    vehicleRisk,
    gpsMap,
  ]);

  /* =========================================================
     AI INTELLIGENCE ENGINE
     ========================================================= */

  const aiIntelligence =
    useMemo(() => {
      const predictions = [];
      const recommendations = [];

      /* SPEEDING PREDICTION */

      const speedingVehicles =
        vehicles.filter(
          (vehicle) =>
            parseNumber(
              getFirstValue(
                vehicle.speed,
                vehicle.current_speed,
                vehicle.currentSpeed
              )
            ) > 75
        );

      if (
        speedingVehicles.length >
        0
      ) {
        predictions.push(
          `${speedingVehicles.length} vehicle${
            speedingVehicles.length >
            1
              ? "s"
              : ""
          } showing elevated speed behaviour.`
        );

        recommendations.push(
          "Monitor high-speed vehicles and verify route speed compliance."
        );
      }

      /* LOW FUEL PREDICTION */

      const lowFuelVehicles =
        vehicles.filter(
          (vehicle) =>
            parseNumber(
              getFirstValue(
                vehicle.fuel_level,
                vehicle.fuelLevel,
                vehicle.fuel
              )
            ) < 25
        );

      if (
        lowFuelVehicles.length >
        0
      ) {
        predictions.push(
          `${lowFuelVehicles.length} vehicle${
            lowFuelVehicles.length >
            1
              ? "s"
              : ""
          } may require fuel intervention soon.`
        );

        recommendations.push(
          "Prioritize refuelling for vehicles below the safe fuel threshold."
        );
      }

      /* HIGH VEHICLE RISK */

      const highRiskVehicles =
        vehicleRisk.filter(
          (vehicle) =>
            vehicle.risk ===
              "HIGH" ||
            vehicle.risk ===
              "CRITICAL"
        );

      if (
        highRiskVehicles.length >
        0
      ) {
        predictions.push(
          `${highRiskVehicles.length} vehicle${
            highRiskVehicles.length >
            1
              ? "s"
              : ""
          } currently have high or critical operational risk.`
        );

        recommendations.push(
          "Inspect high-risk vehicles before assigning additional workload."
        );
      }

      /* HIGH ROUTE RISK */

      const highRiskRoutes =
        routeIntelligence.filter(
          (route) =>
            route.risk ===
              "HIGH" ||
            route.risk ===
              "CRITICAL"
        );

      if (
        highRiskRoutes.length >
        0
      ) {
        predictions.push(
          `${highRiskRoutes.length} route${
            highRiskRoutes.length >
            1
              ? "s"
              : ""
          } require enhanced operational monitoring.`
        );

        recommendations.push(
          "Review delayed and high-risk routes for rerouting or dispatch intervention."
        );
      }

      /* ADVANCED ROUTE RISK */

      const criticalAdvancedRoutes =
        advancedRouteIntelligence.filter(
          (route) =>
            route.intelligenceLevel ===
              "CRITICAL" ||
            route.intelligenceLevel ===
              "HIGH ATTENTION"
        );

      if (
        criticalAdvancedRoutes.length >
        0
      ) {
        predictions.push(
          `${criticalAdvancedRoutes.length} route${
            criticalAdvancedRoutes.length >
            1
              ? "s"
              : ""
          } show advanced intelligence risk indicators.`
        );

        recommendations.push(
          "Use advanced route scores, GPS quality and incident conditions to prioritize dispatch decisions."
        );
      }

      /* UNRESOLVED INCIDENT PREDICTION */

      if (
        incidentStats.unresolved >
        0
      ) {
        predictions.push(
          `${incidentStats.unresolved} unresolved incident${
            incidentStats.unresolved >
            1
              ? "s"
              : ""
          } remain active in the fleet.`
        );

        recommendations.push(
          "Resolve outstanding incidents to reduce operational risk."
        );
      }

      /* FLEET HEALTH PREDICTION */

      if (
        performanceSummary.average <
        70
      ) {
        predictions.push(
          "Overall fleet performance is below the preferred operating range."
        );

        recommendations.push(
          "Investigate low-performing vehicles and recurring incident patterns."
        );
      } else if (
        performanceSummary.average >=
        85
      ) {
        predictions.push(
          "Fleet performance is currently within an efficient operating range."
        );
      }

      /* ROUTE HEALTH */

      if (
        routeSummary.averageScore <
        70
      ) {
        predictions.push(
          "Average route performance indicates increased route-level operational pressure."
        );

        recommendations.push(
          "Prioritize route optimization for low-performing routes."
        );
      }

      /* GPS HEALTH */

      if (
        gpsStats.uniqueVehicles <
        fleetStats.active
      ) {
        predictions.push(
          "GPS telemetry coverage is lower than the number of active vehicles."
        );

        recommendations.push(
          "Verify GPS connectivity for active vehicles without recent telemetry."
        );
      }

      /* DEFAULT STATE */

      if (
        predictions.length === 0
      ) {
        predictions.push(
          "No major operational anomalies detected."
        );
      }

      if (
        recommendations.length === 0
      ) {
        recommendations.push(
          "Continue monitoring fleet, route and telemetry conditions."
        );
      }

      let status =
        "STABLE";

      if (
        riskSummary.critical >
          0 ||
        routeSummary.critical >
          0 ||
        advancedRouteSummary.critical >
          0
      ) {
        status = "CRITICAL";
      } else if (
        riskSummary.high >
          0 ||
        routeSummary.high >
          0 ||
        advancedRouteSummary.highAttention >
          0
      ) {
        status = "HIGH ATTENTION";
      } else if (
        riskSummary.medium >
          0 ||
        routeSummary.medium >
          0
      ) {
        status = "MONITOR";
      }

      let statusMessage =
        "Fleet operations are currently stable.";

      if (
        status === "CRITICAL"
      ) {
        statusMessage =
          "Critical operational indicators require immediate attention.";
      } else if (
        status === "HIGH ATTENTION"
      ) {
        statusMessage =
          "Several operational indicators require enhanced monitoring.";
      } else if (
        status === "MONITOR"
      ) {
        statusMessage =
          "Fleet operations are acceptable but some indicators should be monitored.";
      }

      return {
        status,
        statusMessage,
        predictions,
        recommendations,
        counts: {
          speeding:
            speedingVehicles.length,

          lowFuel:
            lowFuelVehicles.length,

          highRiskVehicles:
            highRiskVehicles.length,

          highRiskRoutes:
            highRiskRoutes.length,

          advancedRiskRoutes:
            criticalAdvancedRoutes.length,

          unresolved:
            incidentStats.unresolved,
        },
      };
    }, [
      vehicles,
      vehicleRisk,
      routeIntelligence,
      advancedRouteIntelligence,
      advancedRouteSummary,
      incidentStats,
      performanceSummary,
      riskSummary,
      routeSummary,
      gpsStats,
      fleetStats,
    ]);

  /* =========================================================
     OPERATIONAL SCORE
     ========================================================= */

  const operationalScore =
    useMemo(() => {
      const fleetScore =
        performanceSummary.average;

      const riskPenalty =
        Math.min(
          30,
          riskSummary.critical *
            10 +
            riskSummary.high * 5 +
            riskSummary.medium * 2
        );

      const incidentPenalty =
        Math.min(
          20,
          incidentStats.unresolved *
            3
        );

      const routeScore =
  advancedRouteSummary.averageScore;

      const score =
        fleetScore * 0.45 +
        routeScore * 0.35 +
        Math.max(
          0,
          100 - riskPenalty
        ) *
          0.15 +
        Math.max(
          0,
          100 - incidentPenalty
        ) *
          0.05;

           return Math.max(
        0,
        Math.min(
          100,
          Math.round(score)
        )
      );
    }, [
      performanceSummary,
      riskSummary,
      incidentStats,
      advancedRouteSummary,
    ]);

  /* =========================================================
     OPERATIONAL RISK LEVEL
     ========================================================= */

  const riskLevel = useMemo(() => {
    if (
      operationalScore < 50
    ) {
      return "CRITICAL";
    }

    if (
      operationalScore < 70
    ) {
      return "HIGH";
    }

    if (
      operationalScore < 85
    ) {
      return "MEDIUM";
    }

    return "LOW";
  }, [
    operationalScore,
  ]);

  /* =========================================================
     OPERATIONAL ASSESSMENT
     ========================================================= */

  const operationalAssessment =
    useMemo(() => {
      if (
        riskLevel ===
        "CRITICAL"
      ) {
        return {
          title:
            "Immediate Intervention Required",
          message:
            "Multiple fleet or route indicators suggest critical operational risk.",
          recommendation:
            "Inspect critical vehicles, unresolved incidents and high-risk routes immediately.",
        };
      }

      if (
        riskLevel === "HIGH"
      ) {
        return {
          title:
            "Enhanced Monitoring Required",
          message:
            "Fleet operations are experiencing elevated risk conditions.",
          recommendation:
            "Review vehicle health, route delays and unresolved incidents.",
        };
      }

      if (
        riskLevel === "MEDIUM"
      ) {
        return {
          title:
            "Operations Require Monitoring",
          message:
            "Fleet performance is acceptable but several indicators require attention.",
          recommendation:
            "Continue monitoring telemetry and address emerging route or vehicle risks.",
        };
      }

      return {
        title:
          "Fleet Operations Stable",
        message:
          "Current fleet and route indicators are within an acceptable operating range.",
        recommendation:
          "Continue real-time monitoring and preventive maintenance.",
      };
    }, [riskLevel]);

    /* =========================================================
     DASHBOARD UI
     ========================================================= */

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: "28px",
            marginBottom: "10px",
          }}
        >
          ⏳
        </div>

        <h2>Loading Fleet Intelligence...</h2>

        <p
          style={{
            color: "#64748b",
          }}
        >
          Fetching vehicles, routes, incidents,
          drivers and GPS telemetry.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        background: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "Inter, Arial, sans-serif",
        color: "#0f172a",
      }}
    >
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "30px",
              fontWeight: 800,
            }}
          >
            Fleet Analytics Intelligence
          </h1>

          <p
            style={{
              margin: "7px 0 0",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            Real-time fleet performance, risk
            prediction and advanced route intelligence.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
          }}
        >
          <span
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: "#16a34a",
              display: "inline-block",
            }}
          />

          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Live Intelligence
          </span>

          {lastUpdated && (
            <span
              style={{
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* =====================================================
          KPI GRID
          ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {[
          {
            title: "Total Vehicles",
            value: fleetStats.total,
            icon: "🚛",
            subtitle: `${fleetStats.active} active`,
          },
          {
            title: "Fleet Performance",
            value: `${performanceSummary.average}%`,
            icon: "📊",
            subtitle: getPerformanceLabel(
              performanceSummary.average
            ),
          },
          {
            title: "Vehicle Risk",
            value:
              riskSummary.critical +
              riskSummary.high,
            icon: "⚠️",
            subtitle: "High / Critical",
          },
          {
            title: "Routes",
            value: routeStats.total,
            icon: "🛣️",
            subtitle: `${routeStats.active} active`,
          },
          {
            title: "Unresolved Alerts",
            value: incidentStats.unresolved,
            icon: "🚨",
            subtitle: `${incidentStats.critical} critical`,
          },
          {
            title: "GPS Coverage",
            value: gpsStats.uniqueVehicles,
            icon: "📡",
            subtitle: `${gpsStats.total} telemetry records`,
          },
        ].map((card, index) => (
          <div
            key={index}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              padding: "18px",
              boxShadow:
                "0 3px 10px rgba(15,23,42,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  color: "#64748b",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                {card.title}
              </span>

              <span
                style={{
                  fontSize: "22px",
                }}
              >
                {card.icon}
              </span>
            </div>

            <div
              style={{
                fontSize: "28px",
                fontWeight: 800,
                marginBottom: "4px",
              }}
            >
              {card.value}
            </div>

            <div
              style={{
                fontSize: "12px",
                color: "#64748b",
              }}
            >
              {card.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* =====================================================
          VEHICLE PERFORMANCE INTELLIGENCE
          ===================================================== */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow:
            "0 3px 10px rgba(15,23,42,0.05)",
        }}
      >
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
            }}
          >
            🚛 Vehicle Performance Intelligence
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            Performance scoring based on speed,
            fuel, status and active incidents.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
          }}
        >
          {[
            [
              "Average",
              `${performanceSummary.average}%`,
            ],
            [
              "Excellent",
              performanceSummary.excellent,
            ],
            [
              "Good",
              performanceSummary.good,
            ],
            [
              "Average",
              performanceSummary.averageCount,
            ],
            [
              "Attention",
              performanceSummary.attention,
            ],
          ].map(([label, value], index) => (
            <div
              key={index}
              style={{
                padding: "14px",
                background: "#f8fafc",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                  marginBottom: "5px",
                }}
              >
                {label}
              </div>

              <strong
                style={{
                  fontSize: "22px",
                }}
              >
                {value}
              </strong>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          FLEET STATUS / FUEL / DRIVER
          ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px",
          marginBottom: "24px",
        }}
      >
        {/* FLEET STATUS */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "20px",
            boxShadow:
              "0 3px 10px rgba(15,23,42,0.05)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            🚦 Fleet Status
          </h3>

          {[
            ["Active", fleetStats.active, "#16a34a"],
            ["Idle", fleetStats.idle, "#d97706"],
            [
              "Maintenance",
              fleetStats.maintenance,
              "#ea580c",
            ],
            [
              "Inactive",
              fleetStats.inactive,
              "#dc2626",
            ],
          ].map(([label, value, color]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom:
                  "1px solid #f1f5f9",
              }}
            >
              <span>{label}</span>

              <strong
                style={{
                  color,
                }}
              >
                {value}
              </strong>
            </div>
          ))}

          <div
            style={{
              marginTop: "14px",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            Average speed:{" "}
            <strong>
              {fleetStats.averageSpeed} km/h
            </strong>
          </div>
        </section>

        {/* FUEL */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "20px",
            boxShadow:
              "0 3px 10px rgba(15,23,42,0.05)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            ⛽ Fuel Intelligence
          </h3>

          {[
            ["Healthy", fuelHealth.healthy, "#16a34a"],
            ["Warning", fuelHealth.warning, "#d97706"],
            ["Low", fuelHealth.low, "#dc2626"],
          ].map(([label, value, color]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom:
                  "1px solid #f1f5f9",
              }}
            >
              <span>{label}</span>

              <strong
                style={{
                  color,
                }}
              >
                {value}
              </strong>
            </div>
          ))}

          <div
            style={{
              marginTop: "14px",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            Fleet average fuel:{" "}
            <strong>
              {fleetStats.averageFuel}%
            </strong>
          </div>
        </section>

        {/* DRIVER */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "16px",
            padding: "20px",
            boxShadow:
              "0 3px 10px rgba(15,23,42,0.05)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            👨‍✈️ Driver Intelligence
          </h3>

          {[
            ["Total Drivers", driverStats.total, "#334155"],
            ["Active Drivers", driverStats.active, "#16a34a"],
            [
              "Inactive Drivers",
              driverStats.inactive,
              "#dc2626",
            ],
          ].map(([label, value, color]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom:
                  "1px solid #f1f5f9",
              }}
            >
              <span>{label}</span>

              <strong
                style={{
                  color,
                }}
              >
                {value}
              </strong>
            </div>
          ))}
        </section>
      </div>

      {/* =====================================================
          VEHICLE PERFORMANCE TABLE
          ===================================================== */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow:
            "0 3px 10px rgba(15,23,42,0.05)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          📈 Vehicle Performance Ranking
        </h2>

        {vehiclePerformance.length === 0 ? (
          <p
            style={{
              color: "#64748b",
            }}
          >
            No vehicle performance data
            available.
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "760px",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Vehicle",
                    "Status",
                    "Speed",
                    "Fuel",
                    "Incidents",
                    "Score",
                    "Performance",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        background: "#f8fafc",
                        borderBottom:
                          "1px solid #e2e8f0",
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {vehiclePerformance.map(
                  (vehicle) => (
                    <tr key={vehicle.vehicleId}>
                      <td
                        style={{
                          padding: "13px 12px",
                          fontWeight: 700,
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        {vehicle.vehicleNumber}
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        <span
                          style={{
                            color:
                              getStatusColor(
                                vehicle.status
                              ),
                            fontWeight: 700,
                          }}
                        >
                          {vehicle.status}
                        </span>
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        {vehicle.speed} km/h
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        {vehicle.fuel}%
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        {
                          vehicle.unresolvedAlerts
                            .length
                        }
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                          fontWeight: 800,
                          color:
                            getPerformanceColor(
                              vehicle.score
                            ),
                        }}
                      >
                        {vehicle.score}%
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        <span
                          style={{
                            color:
                              getPerformanceColor(
                                vehicle.score
                              ),
                            fontWeight: 700,
                          }}
                        >
                          {vehicle.performance}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          VEHICLE RISK SCORING
          ===================================================== */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow:
            "0 3px 10px rgba(15,23,42,0.05)",
        }}
      >
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <h2
            style={{
              margin: 0,
            }}
          >
            ⚠️ Vehicle Risk Scoring
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            Risk score combines speed, fuel
            condition, vehicle status and
            unresolved incidents.
          </p>
        </div>

        {vehicleRisk.length === 0 ? (
          <p
            style={{
              color: "#64748b",
            }}
          >
            No vehicle risk data available.
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "780px",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Vehicle",
                    "Risk Score",
                    "Risk",
                    "Speed",
                    "Fuel",
                    "Open Incidents",
                    "Status",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        background: "#f8fafc",
                        borderBottom:
                          "1px solid #e2e8f0",
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {vehicleRisk.map((vehicle) => (
                  <tr key={vehicle.vehicleId}>
                    <td
                      style={{
                        padding: "13px 12px",
                        fontWeight: 700,
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      {vehicle.vehicleNumber}
                    </td>

                    <td
                      style={{
                        padding: "13px 12px",
                        fontWeight: 800,
                        color: getRiskColor(
                          vehicle.risk
                        ),
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      {vehicle.riskScore}%
                    </td>

                    <td
                      style={{
                        padding: "13px 12px",
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      <span
                        style={{
                          color: getRiskColor(
                            vehicle.risk
                          ),
                          fontWeight: 800,
                        }}
                      >
                        {vehicle.risk}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: "13px 12px",
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      {vehicle.speed} km/h
                    </td>

                    <td
                      style={{
                        padding: "13px 12px",
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      {vehicle.fuel}%
                    </td>

                    <td
                      style={{
                        padding: "13px 12px",
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      {
                        vehicle.unresolvedAlerts
                          .length
                      }
                    </td>

                    <td
                      style={{
                        padding: "13px 12px",
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      {vehicle.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

            {/* =====================================================
         LIVE VEHICLE INTELLIGENCE
         ===================================================== */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow:
            "0 3px 10px rgba(15,23,42,0.05)",
        }}
      >
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <h2
            style={{
              margin: 0,
            }}
          >
            🤖 Live Vehicle Intelligence
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            AI-generated vehicle insights based on
            speed, fuel, incidents, GPS telemetry
            and real-time vehicle risk.
          </p>
        </div>

        {liveVehicleIntelligence.length === 0 ? (
          <p
            style={{
              color: "#64748b",
            }}
          >
            No live vehicle intelligence data available.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {liveVehicleIntelligence.map(
              (vehicle) => (
                <div
                  key={vehicle.vehicleId}
                  style={{
                    border:
                      "1px solid #e2e8f0",
                    borderRadius: "14px",
                    padding: "16px",
                    background: "#f8fafc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "15px",
                        }}
                      >
                        {vehicle.vehicleNumber}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "3px",
                        }}
                      >
                        {vehicle.status}
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: 900,
                          color:
                            getPerformanceColor(
                              vehicle.intelligenceScore
                            ),
                        }}
                      >
                        {vehicle.intelligenceScore}
                      </div>

                      <div
                        style={{
                          fontSize: "10px",
                          color: "#64748b",
                          fontWeight: 700,
                        }}
                      >
                        INTELLIGENCE SCORE
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "inline-block",
                      padding:
                        "5px 9px",
                      borderRadius: "999px",
                      fontSize: "11px",
                      fontWeight: 800,
                      marginBottom: "12px",
                      background:
                        vehicle.intelligenceLevel ===
                        "CRITICAL"
                          ? "#fee2e2"
                          : vehicle.intelligenceLevel ===
                            "HIGH ATTENTION"
                          ? "#ffedd5"
                          : vehicle.intelligenceLevel ===
                            "MONITOR"
                          ? "#fef3c7"
                          : "#dcfce7",
                      color:
                        vehicle.intelligenceLevel ===
                        "CRITICAL"
                          ? "#b91c1c"
                          : vehicle.intelligenceLevel ===
                            "HIGH ATTENTION"
                          ? "#c2410c"
                          : vehicle.intelligenceLevel ===
                            "MONITOR"
                          ? "#a16207"
                          : "#15803d",
                    }}
                  >
                    {vehicle.intelligenceLevel}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr 1fr",
                      gap: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        padding: "9px",
                        background: "#ffffff",
                        borderRadius: "10px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#64748b",
                        }}
                      >
                        SPEED
                      </div>

                      <div
                        style={{
                          fontWeight: 800,
                          marginTop: "3px",
                        }}
                      >
                        {vehicle.speed} km/h
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "9px",
                        background: "#ffffff",
                        borderRadius: "10px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#64748b",
                        }}
                      >
                        FUEL
                      </div>

                      <div
                        style={{
                          fontWeight: 800,
                          marginTop: "3px",
                        }}
                      >
                        {vehicle.fuel}%
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "9px",
                        background: "#ffffff",
                        borderRadius: "10px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#64748b",
                        }}
                      >
                        GPS
                      </div>

                      <div
                        style={{
                          fontWeight: 800,
                          marginTop: "3px",
                        }}
                      >
                        {vehicle.gpsRecords}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "11px",
                      borderRadius: "10px",
                      background: "#ffffff",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        color: "#64748b",
                        marginBottom: "5px",
                      }}
                    >
                      AI INSIGHT
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        lineHeight: 1.5,
                      }}
                    >
                      {vehicle.insight}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "11px",
                      borderRadius: "10px",
                      background: "#eff6ff",
                      border:
                        "1px solid #dbeafe",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        color: "#2563eb",
                        marginBottom: "5px",
                      }}
                    >
                      AI RECOMMENDATION
                    </div>

                    <div
                      style={{
                        fontSize: "12px",
                        lineHeight: 1.5,
                        color: "#1e3a8a",
                      }}
                    >
                      {vehicle.recommendation}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          ROUTE INTELLIGENCE
          ===================================================== */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow:
            "0 3px 10px rgba(15,23,42,0.05)",
        }}
      >
        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <h2
            style={{
              margin: 0,
            }}
          >
            🛣️ Route Intelligence
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            Route risk analysis using vehicle
            condition, delay, incidents and
            priority.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          {[
            ["Total", routeSummary.total],
            ["Active", routeSummary.active],
            ["Completed", routeSummary.completed],
            ["Delayed", routeSummary.delayed],
            ["Critical", routeSummary.critical],
            ["High", routeSummary.high],
            [
              "Avg Risk",
              `${routeSummary.averageRisk}%`,
            ],
            [
              "Avg Score",
              `${routeSummary.averageScore}%`,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "13px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  marginBottom: "5px",
                }}
              >
                {label}
              </div>

              <strong
                style={{
                  fontSize: "20px",
                }}
              >
                {value}
              </strong>
            </div>
          ))}
        </div>

        {routeIntelligence.length === 0 ? (
          <p
            style={{
              color: "#64748b",
            }}
          >
            No route intelligence data
            available.
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1050px",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Route",
                    "Vehicle",
                    "Origin",
                    "Destination",
                    "Status",
                    "Delay",
                    "Risk",
                    "Score",
                    "Reason",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        background: "#f8fafc",
                        borderBottom:
                          "1px solid #e2e8f0",
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {routeIntelligence.map(
                  (route) => (
                    <tr key={route.routeId}>
                      <td
                        style={{
                          padding: "13px 12px",
                          fontWeight: 800,
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        {route.routeId}
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        {route.routeVehicle ||
                          "Unassigned"}
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        {route.origin}
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        {route.destination}
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                          color:
                            getStatusColor(
                              route.status
                            ),
                          fontWeight: 700,
                        }}
                      >
                        {route.status}
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                        }}
                      >
                        {route.delay} min
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                          color: getRiskColor(
                            route.risk
                          ),
                          fontWeight: 800,
                        }}
                      >
                        {route.risk}
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                          color:
                            getPerformanceColor(
                              route.performanceScore
                            ),
                          fontWeight: 800,
                        }}
                      >
                        {route.performanceScore}%
                      </td>

                      <td
                        style={{
                          padding: "13px 12px",
                          borderBottom:
                            "1px solid #f1f5f9",
                          maxWidth: "300px",
                        }}
                      >
                        {route.reason}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          ROUTE PERFORMANCE
          ===================================================== */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow:
            "0 3px 10px rgba(15,23,42,0.05)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          📍 Route Performance
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
          }}
        >
          {[
            ["Total Routes", routeStats.total],
            ["Completed", routeStats.completed],
            ["Active", routeStats.active],
            ["Delayed", routeStats.delayed],
            [
              "Average Distance",
              `${routeStats.averageDistance} km`,
            ],
            [
              "Completion Rate",
              `${routeStats.completionRate}%`,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: "16px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginBottom: "7px",
                }}
              >
                {label}
              </div>

              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          ADVANCED ROUTE INTELLIGENCE
          ===================================================== */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "18px",
          padding: "22px",
          marginBottom: "24px",
          boxShadow:
            "0 5px 18px rgba(15,23,42,0.07)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "21px",
              }}
            >
              🧠 Advanced Route Intelligence
            </h2>

            <p
              style={{
                margin: "7px 0 0",
                color: "#64748b",
                fontSize: "13px",
                maxWidth: "760px",
              }}
            >
              AI-style route assessment combining
              route efficiency, GPS telemetry quality,
              vehicle stability, incidents, delay and
              ETA indicators.
            </p>
          </div>

          <div
            style={{
              padding: "9px 14px",
              borderRadius: "999px",
              background: "#f1f5f9",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            INTELLIGENCE ENGINE
          </div>
        </div>

        {/* ADVANCED SUMMARY */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            marginBottom: "22px",
          }}
        >
          {[
            [
              "Routes Analyzed",
              advancedRouteSummary.total,
              "#334155",
            ],
            [
              "Average AI Score",
              `${advancedRouteSummary.averageScore}%`,
              getPerformanceColor(
                advancedRouteSummary.averageScore
              ),
            ],
            [
              "Critical",
              advancedRouteSummary.critical,
              "#dc2626",
            ],
            [
              "High Attention",
              advancedRouteSummary.highAttention,
              "#ea580c",
            ],
            [
              "Monitor",
              advancedRouteSummary.monitor,
              "#d97706",
            ],
            [
              "Optimal",
              advancedRouteSummary.optimal,
              "#16a34a",
            ],
            [
              "GPS Covered",
              advancedRouteSummary.gpsReliable,
              "#2563eb",
            ],
          ].map(([label, value, color]) => (
            <div
              key={label}
              style={{
                padding: "15px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  marginBottom: "6px",
                }}
              >
                {label}
              </div>

              <div
                style={{
                  fontSize: "23px",
                  fontWeight: 800,
                  color,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* HIGHEST PRIORITY ROUTE */}

        {advancedRouteSummary.highestPriorityRoute && (
          <div
            style={{
              padding: "15px 17px",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: "13px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#9a3412",
                marginBottom: "5px",
              }}
            >
              🚨 HIGHEST PRIORITY ROUTE
            </div>

            <div
              style={{
                fontSize: "15px",
                fontWeight: 800,
              }}
            >
              {
                advancedRouteSummary
                  .highestPriorityRoute.routeId
              }

              {" — "}

              {
                advancedRouteSummary
                  .highestPriorityRoute.origin
              }

              {" → "}

              {
                advancedRouteSummary
                  .highestPriorityRoute.destination
              }
            </div>

            <div
              style={{
                marginTop: "5px",
                fontSize: "12px",
                color: "#7c2d12",
              }}
            >
              {
                advancedRouteSummary
                  .highestPriorityRoute.recommendation
              }
            </div>
          </div>
        )}

        {/* ADVANCED ROUTE TABLE */}

        {advancedRouteIntelligence.length === 0 ? (
          <div
            style={{
              padding: "25px",
              textAlign: "center",
              color: "#64748b",
              background: "#f8fafc",
              borderRadius: "12px",
            }}
          >
            No advanced route intelligence
            data available.
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1250px",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Route",
                    "Vehicle",
                    "Efficiency",
                    "GPS",
                    "Stability",
                    "AI Score",
                    "Intelligence",
                    "Insight",
                    "Recommendation",
                  ].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        textAlign: "left",
                        padding: "12px",
                        background: "#f8fafc",
                        borderBottom:
                          "1px solid #e2e8f0",
                        fontSize: "11px",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {advancedRouteIntelligence.map(
                  (route) => {
                    const intelligenceColor =
                      route.intelligenceLevel ===
                      "OPTIMAL"
                        ? "#16a34a"
                        : route.intelligenceLevel ===
                          "MONITOR"
                        ? "#d97706"
                        : route.intelligenceLevel ===
                          "HIGH ATTENTION"
                        ? "#ea580c"
                        : "#dc2626";

                    return (
                      <tr
                        key={`${route.routeId}-${route.routeVehicle}`}
                      >
                        <td
                          style={{
                            padding: "14px 12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                            fontWeight: 800,
                          }}
                        >
                          {route.routeId}
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          {route.routeVehicle ||
                            "Unassigned"}
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                            color:
                              getPerformanceColor(
                                route.efficiencyScore
                              ),
                            fontWeight: 800,
                          }}
                        >
                          {route.efficiencyScore}%
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 800,
                              color:
                                getPerformanceColor(
                                  route.gpsScore
                                ),
                            }}
                          >
                            {route.gpsScore}%
                          </div>

                          <div
                            style={{
                              fontSize: "10px",
                              color: "#64748b",
                            }}
                          >
                            {route.gpsRecords} records
                          </div>
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                            color:
                              getPerformanceColor(
                                route.stabilityScore
                              ),
                            fontWeight: 800,
                          }}
                        >
                          {route.stabilityScore}%
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                            fontSize: "16px",
                            fontWeight: 900,
                            color:
                              getPerformanceColor(
                                route.advancedScore
                              ),
                          }}
                        >
                          {route.advancedScore}%
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "5px 9px",
                              borderRadius: "999px",
                              background:
                                `${intelligenceColor}15`,
                              color:
                                intelligenceColor,
                              fontWeight: 800,
                              fontSize: "10px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {route.intelligenceLevel}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                            maxWidth: "270px",
                            fontSize: "12px",
                            color: "#475569",
                          }}
                        >
                          {route.insight}
                        </td>

                        <td
                          style={{
                            padding: "14px 12px",
                            borderBottom:
                              "1px solid #f1f5f9",
                            maxWidth: "330px",
                            fontSize: "12px",
                          }}
                        >
                          {route.recommendation}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          BEST / WORST VEHICLES
          ===================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px",
          marginBottom: "24px",
        }}
      >
        {/* BEST VEHICLE */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #bbf7d0",
            borderRadius: "16px",
            padding: "20px",
            boxShadow:
              "0 3px 10px rgba(15,23,42,0.05)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              color: "#166534",
            }}
          >
            🏆 Best Performing Vehicle
          </h3>

          {vehiclePerformance.length > 0 ? (
            <>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                }}
              >
                {vehiclePerformance[0].vehicleNumber}
              </div>

              <div
                style={{
                  marginTop: "6px",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Performance Score
              </div>

              <div
                style={{
                  fontSize: "34px",
                  fontWeight: 900,
                  color:
                    getPerformanceColor(
                      vehiclePerformance[0].score
                    ),
                }}
              >
                {vehiclePerformance[0].score}%
              </div>
            </>
          ) : (
            <p>No vehicle data.</p>
          )}
        </section>

        {/* WORST VEHICLE */}

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #fecaca",
            borderRadius: "16px",
            padding: "20px",
            boxShadow:
              "0 3px 10px rgba(15,23,42,0.05)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              color: "#991b1b",
            }}
          >
            ⚠️ Vehicle Requiring Attention
          </h3>

          {vehiclePerformance.length > 0 ? (
            <>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                }}
              >
                {
                  vehiclePerformance[
                    vehiclePerformance.length - 1
                  ].vehicleNumber
                }
              </div>

              <div
                style={{
                  marginTop: "6px",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Performance Score
              </div>

              <div
                style={{
                  fontSize: "34px",
                  fontWeight: 900,
                  color:
                    getPerformanceColor(
                      vehiclePerformance[
                        vehiclePerformance.length - 1
                      ].score
                    ),
                }}
              >
                {
                  vehiclePerformance[
                    vehiclePerformance.length - 1
                  ].score
                }%
              </div>
            </>
          ) : (
            <p>No vehicle data.</p>
          )}
        </section>
      </div>

      {/* =====================================================
          GPS TELEMETRY
          ===================================================== */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          boxShadow:
            "0 3px 10px rgba(15,23,42,0.05)",
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          📡 GPS Telemetry & Vehicle Health
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
          }}
        >
          {[
            ["GPS Records", gpsStats.total],
            [
              "Reporting Vehicles",
              gpsStats.uniqueVehicles,
            ],
            ["Active Vehicles", fleetStats.active],
            [
              "Telemetry Coverage",
              `${
                fleetStats.active > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (gpsStats.uniqueVehicles /
                          fleetStats.active) *
                          100
                      )
                    )
                  : 100
              }%`,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                {label}
              </div>

              <strong
                style={{
                  fontSize: "26px",
                }}
              >
                {value}
              </strong>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          AI OPERATIONS ASSESSMENT
          ===================================================== */}

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "18px",
          padding: "22px",
          marginBottom: "24px",
          boxShadow:
            "0 5px 18px rgba(15,23,42,0.07)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 6px",
              }}
            >
              🤖 AI Operations Assessment
            </h2>

            <p
              style={{
                margin: 0,
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              Predictive operational assessment
              generated from current fleet telemetry.
            </p>
          </div>

          <div
            style={{
              padding: "8px 13px",
              borderRadius: "999px",
              background: "#f1f5f9",
              fontWeight: 900,
              fontSize: "11px",
            }}
          >
            {aiIntelligence.status}
          </div>
        </div>

        <div
          style={{
            marginTop: "18px",
            padding: "15px",
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          <strong>
            {operationalAssessment.title}
          </strong>

          <p
            style={{
              margin: "7px 0 0",
              color: "#475569",
              fontSize: "13px",
            }}
          >
            {operationalAssessment.message}
          </p>
        </div>

        {/* OPERATIONAL SCORE */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(180px, 260px) 1fr",
            gap: "20px",
            alignItems: "center",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: "18px",
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "12px",
                marginBottom: "7px",
              }}
            >
              Overall Operational Score
            </div>

            <div
              style={{
                fontSize: "48px",
                lineHeight: 1,
                fontWeight: 900,
                color:
                  getPerformanceColor(
                    operationalScore
                  ),
              }}
            >
              {operationalScore}
            </div>

            <div
              style={{
                marginTop: "6px",
                color: "#64748b",
                fontSize: "12px",
              }}
            >
              / 100
            </div>
          </div>

          <div>
            <h3
              style={{
                marginTop: 0,
              }}
            >
              🔮 Predictions
            </h3>

            {aiIntelligence.predictions.map(
              (prediction, index) => (
                <div
                  key={index}
                  style={{
                    padding: "10px 12px",
                    marginBottom: "8px",
                    background: "#f8fafc",
                    borderRadius: "9px",
                    borderLeft:
                      "3px solid #64748b",
                    fontSize: "13px",
                  }}
                >
                  {prediction}
                </div>
              )
            )}

            <h3
              style={{
                marginTop: "18px",
              }}
            >
              💡 Recommendations
            </h3>

            {aiIntelligence.recommendations.map(
              (recommendation, index) => (
                <div
                  key={index}
                  style={{
                    padding: "10px 12px",
                    marginBottom: "8px",
                    background: "#f0fdf4",
                    borderRadius: "9px",
                    borderLeft:
                      "3px solid #16a34a",
                    fontSize: "13px",
                  }}
                >
                  {recommendation}
                </div>
              )
            )}
          </div>
        </div>

        {/* LIVE AI PRIORITY SUMMARY */}

        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            borderRadius: "14px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px",
            }}
          >
            🎯 Live AI Priority Summary
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
            }}
          >
            <div
              style={{
                padding: "12px",
                background: "#ffffff",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontWeight: 800,
                }}
              >
                CRITICAL VEHICLES
              </div>

              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  marginTop: "4px",
                  color: "#dc2626",
                }}
              >
                {riskSummary.critical}
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                background: "#ffffff",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontWeight: 800,
                }}
              >
                HIGH ATTENTION ROUTES
              </div>

              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  marginTop: "4px",
                  color: "#ea580c",
                }}
              >
                {advancedRouteSummary.highAttention}
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                background: "#ffffff",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontWeight: 800,
                }}
              >
                LOW FUEL VEHICLES
              </div>

              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  marginTop: "4px",
                  color: "#ca8a04",
                }}
              >
                {fuelHealth.low}
              </div>
            </div>

            <div
              style={{
                padding: "12px",
                background: "#ffffff",
                borderRadius: "10px",
              }}
            >
                <div
                  style={{
                    fontSize: "10px",
                    color: "#64748b",
                    fontWeight: 800,
                  }}
                >
                  UNRESOLVED INCIDENTS
                </div>

                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    marginTop: "4px",
                    color: "#7c3aed",
                  }}
                >
                  {incidentStats.unresolved}
                </div>
              </div>
            </div>
          </div>

          {advancedRouteSummary.highestPriorityRoute && (
            <div
              style={{
                marginTop: "14px",
                padding: "12px",
                background: "#ffffff",
                borderRadius: "10px",
                border:
                  "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontWeight: 800,
                  marginBottom: "5px",
                }}
              >
                HIGHEST PRIORITY ROUTE
              </div>

              <strong>
                {
                  advancedRouteSummary
                    .highestPriorityRoute
                    .routeId
                }
              </strong>

              <div
                style={{
                  fontSize: "12px",
                  color: "#475569",
                  marginTop: "4px",
                }}
              >
                {
                  advancedRouteSummary
                    .highestPriorityRoute
                    .origin
                }{" "}
                →{" "}
                {
                  advancedRouteSummary
                    .highestPriorityRoute
                    .destination
                }
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  marginTop: "5px",
                }}
              >
                Intelligence Score:{" "}
                {
                  advancedRouteSummary
                    .highestPriorityRoute
                    .advancedScore
                }
                /100
              </div>
            </div>
          )}
              
        {/* AI COUNTERS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          {[
            [
              "Speeding",
              aiIntelligence.counts.speeding,
            ],
            [
              "Low Fuel",
              aiIntelligence.counts.lowFuel,
            ],
            [
              "High Risk Vehicles",
              aiIntelligence.counts.highRiskVehicles,
            ],
            [
              "High Risk Routes",
              aiIntelligence.counts.highRiskRoutes,
            ],
            [
              "Advanced Risk Routes",
              aiIntelligence.counts.advancedRiskRoutes,
            ],
            [
              "Unresolved",
              aiIntelligence.counts.unresolved,
            ],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                {label}
              </div>

              <strong
                style={{
                  fontSize: "20px",
                }}
              >
                {value}
              </strong>
            </div>
          ))}
        </div>

        {/* SYSTEM RECOMMENDATION */}

        <div
          style={{
            marginTop: "20px",
            padding: "14px 16px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "12px",
          }}
        >
          <strong
            style={{
              color: "#1d4ed8",
              fontSize: "12px",
            }}
          >
            SYSTEM RECOMMENDATION
          </strong>

          <div
            style={{
              marginTop: "5px",
              fontSize: "13px",
              color: "#1e3a8a",
            }}
          >
            {operationalAssessment.recommendation}
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div
        style={{
          textAlign: "center",
          padding: "10px",
          color: "#94a3b8",
          fontSize: "11px",
        }}
      >
        SIH26002 • NER Logistics Fleet Monitor •
        Advanced Fleet Intelligence
      </div>
    </div>
  );
}