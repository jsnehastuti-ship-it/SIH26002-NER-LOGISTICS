import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Popup,
  Polyline,
  Marker,
  Tooltip,
  LayersControl,
  LayerGroup,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import RouteCopilot from "./RouteCopilot";
import { apiGet } from "../api";

/* =========================================================
   MAP CONFIG
========================================================= */

const INDIA_CENTER = [25.0, 92.8];
const INDIA_ZOOM = 6;

const RISK_ZONES = [
  {
    name: "Guwahati High Traffic Zone",
    center: [26.1445, 91.7362],
    radius: 28000,
    level: "HIGH",
  },
  {
    name: "Shillong Landslide Risk Zone",
    center: [25.5788, 91.8933],
    radius: 22000,
    level: "HIGH",
  },
  {
    name: "Manipur Security Risk Zone",
    center: [24.817, 93.9368],
    radius: 30000,
    level: "CRITICAL",
  },
  {
    name: "Mizoram Terrain Risk Zone",
    center: [23.7271, 92.7176],
    radius: 24000,
    level: "MEDIUM",
  },
  {
    name: "Arunachal Pradesh Mountain Risk Zone",
    center: [27.0844, 93.6053],
    radius: 30000,
    level: "HIGH",
  },
  {
    name: "Sikkim Terrain Risk Zone",
    center: [27.3389, 88.6065],
    radius: 24000,
    level: "MEDIUM",
  },
];

/* =========================================================
   LOGISTICS HUBS
========================================================= */

const LOGISTICS_HUBS = [
  {
    name: "Guwahati Hub",
    location: "Guwahati, Assam",
    coordinates: [26.1445, 91.7362],
    type: "Primary Hub",
  },
  {
    name: "Shillong Hub",
    location: "Shillong, Meghalaya",
    coordinates: [25.5788, 91.8933],
    type: "Regional Hub",
  },
  {
    name: "Imphal Hub",
    location: "Imphal, Manipur",
    coordinates: [24.817, 93.9368],
    type: "Regional Hub",
  },
  {
    name: "Aizawl Hub",
    location: "Aizawl, Mizoram",
    coordinates: [23.7271, 92.7176],
    type: "Regional Hub",
  },
  {
    name: "Kohima Hub",
    location: "Kohima, Nagaland",
    coordinates: [25.6751, 94.1086],
    type: "Regional Hub",
  },
  {
    name: "Agartala Hub",
    location: "Agartala, Tripura",
    coordinates: [23.8315, 91.2868],
    type: "Regional Hub",
  },
  {
  name: "Itanagar Hub",
  location: "Itanagar, Arunachal Pradesh",
  coordinates: [27.0844, 93.6053],
  type: "Regional Hub",
},
{
  name: "Gangtok Hub",
  location: "Gangtok, Sikkim",
  coordinates: [27.3389, 88.6065],
  type: "Regional Hub",
},
];

/* =========================================================
   PRIMARY ROUTES
========================================================= */

const PRIMARY_ROUTES = [
  {
    name: "Guwahati → Shillong",
    coordinates: [
      [26.1445, 91.7362],
      [26.0, 91.8],
      [25.8, 91.85],
      [25.5788, 91.8933],
    ],
  },
  {
    name: "Guwahati → Imphal",
    coordinates: [
      [26.1445, 91.7362],
      [25.9, 92.2],
      [25.5, 92.7],
      [25.1, 93.2],
      [24.817, 93.9368],
    ],
  },
  {
    name: "Guwahati → Aizawl",
    coordinates: [
      [26.1445, 91.7362],
      [25.5, 92.0],
      [24.9, 92.3],
      [24.3, 92.5],
      [23.7271, 92.7176],
    ],
  },
  {
    name: "Guwahati → Kohima",
    coordinates: [
      [26.1445, 91.7362],
      [26.2, 92.3],
      [26.1, 93.0],
      [25.9, 93.6],
      [25.6751, 94.1086],
    ],
  },
  {
    name: "Guwahati → Agartala",
    coordinates: [
      [26.1445, 91.7362],
      [25.7, 91.7],
      [25.2, 91.5],
      [24.6, 91.4],
      [23.8315, 91.2868],
    ],
  },
];

/* =========================================================
   SECONDARY ROUTES
========================================================= */

const SECONDARY_ROUTES = [
  {
    name: "Shillong → Imphal",
    coordinates: [
      [25.5788, 91.8933],
      [25.3, 92.3],
      [25.0, 92.9],
      [24.817, 93.9368],
    ],
  },
  {
    name: "Shillong → Aizawl",
    coordinates: [
      [25.5788, 91.8933],
      [25.0, 92.2],
      [24.4, 92.5],
      [23.7271, 92.7176],
    ],
  },
  {
    name: "Imphal → Kohima",
    coordinates: [
      [24.817, 93.9368],
      [25.1, 94.0],
      [25.6751, 94.1086],
    ],
  },
  {
    name: "Guwahati → Itanagar",
    coordinates: [
      [26.1445, 91.7362],
      [26.4, 92.2],
      [26.7, 92.8],
      [27.0844, 93.6053],
    ],
  },
  {
    name: "Gangtok → Guwahati",
    coordinates: [
      [27.3389, 88.6065],
      [27.1, 89.0],
      [26.8, 90.0],
      [26.5, 91.0],
      [26.1445, 91.7362],
    ],
  },
];

/* =========================================================
   DEMO VEHICLES
========================================================= */

const DEMO_VEHICLES = [
  {
    id: 1,
    vehicle_number: "AS-01-AB-1234",
    vehicle_type: "Truck",
    driver_name: "Rajesh Kumar",
    status: "ACTIVE",
    latitude: 26.1445,
    longitude: 91.7362,
    speed: 48,
    fuel_level: 82,
  },
  {
    id: 2,
    vehicle_number: "MN-01-CD-5678",
    vehicle_type: "Truck",
    driver_name: "Suresh Das",
    status: "ACTIVE",
    latitude: 24.8170,
    longitude: 93.9368,
    speed: 62,
    fuel_level: 64,
  },
  {
    id: 3,
    vehicle_number: "ML-01-EF-9012",
    vehicle_type: "Van",
    driver_name: "Amit Nayak",
    status: "IDLE",
    latitude: 25.5788,
    longitude: 91.8933,
    speed: 0,
    fuel_level: 91,
  },
  {
    id: 4,
    vehicle_number: "MZ-01-GH-3456",
    vehicle_type: "Truck",
    driver_name: "Manoj Rout",
    status: "ACTIVE",
    latitude: 23.7271,
    longitude: 92.7176,
    speed: 55,
    fuel_level: 47,
  },
  {
    id: 5,
    vehicle_number: "NL-01-IJ-7890",
    vehicle_type: "Van",
    driver_name: "Rakesh Sahu",
    status: "MAINTENANCE",
    latitude: 25.6751,
    longitude: 94.1086,
    speed: 0,
    fuel_level: 23,
  },
];

/* =========================================================
   NER STATES
========================================================= */

const NER_STATES = [
  {
    name: "Assam",
    code: "AS",
    center: [26.2, 92.9],
    risk: "HIGH",
    status: "OPERATIONAL",
  },
  {
    name: "Meghalaya",
    code: "ML",
    center: [25.5, 91.3],
    risk: "MEDIUM",
    status: "OPERATIONAL",
  },
  {
    name: "Manipur",
    code: "MN",
    center: [24.7, 93.9],
    risk: "CRITICAL",
    status: "RESTRICTED",
  },
  {
    name: "Mizoram",
    code: "MZ",
    center: [23.4, 92.8],
    risk: "MEDIUM",
    status: "OPERATIONAL",
  },
  {
    name: "Nagaland",
    code: "NL",
    center: [26.1, 94.1],
    risk: "HIGH",
    status: "MONITORED",
  },
  {
    name: "Tripura",
    code: "TR",
    center: [23.8, 91.3],
    risk: "LOW",
    status: "OPERATIONAL",
  },
    {
    name: "Arunachal Pradesh",
    code: "AR",
    center: [28.2180, 94.7278],
    risk: "MEDIUM",
    status: "OPERATIONAL",
  },
  {
    name: "Sikkim",
    code: "SK",
    center: [27.5330, 88.5122],
    risk: "LOW",
    status: "OPERATIONAL",
  },
];

/* =========================================================
   HELPERS
========================================================= */

function riskColor(level) {
  const normalized = String(level || "").toUpperCase();

  if (normalized === "CRITICAL") return "#ff3b3b";
  if (normalized === "HIGH") return "#e66a6a";
  if (normalized === "MEDIUM") return "#e5a75c";
  if (normalized === "LOW") return "#65d8c8";

  return "#65d8c8";
}

function incidentSeverityColor(severity) {
  const normalized = String(severity || "").toUpperCase();

  if (normalized === "CRITICAL") return "#ff2d2d";
  if (normalized === "HIGH") return "#ff6b35";
  if (normalized === "MEDIUM") return "#f5b642";
  if (normalized === "LOW") return "#4dd4c6";

  return "#8fa3b8";
}

function normalizeSeverity(severity) {
  const value = String(severity || "LOW").toUpperCase();

  if (
    ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(value)
  ) {
    return value;
  }

  return "LOW";
}

function getIncidentStatus(alert) {
  return alert?.is_resolved === true
    ? "RESOLVED"
    : "ACTIVE";
}

function isValidCoordinate(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function normalizeLocation(value) {
  if (!value) return "";

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/→/g, "->")
    .replace(/\s+/g, " ");
}

function getDatabaseRouteCoordinates(route) {
  if (!route) return null;

  const start = normalizeLocation(
    route.start_location
  );

  const destination = normalizeLocation(
    route.destination
  );

  let startKey = "";
  let destinationKey = "";

  Object.keys(CITY_COORDINATES).forEach((city) => {
    if (start.includes(city)) {
      startKey = city;
    }

    if (destination.includes(city)) {
      destinationKey = city;
    }
  });

  if (startKey && destinationKey) {
    return [
      CITY_COORDINATES[startKey],
      CITY_COORDINATES[destinationKey],
    ];
  }

  const routeName = normalizeLocation(
    route.route_name
  );

  if (
    routeName.includes("guwahati") &&
    routeName.includes("shillong")
  ) {
    return PRIMARY_ROUTES[0].coordinates;
  }

  if (
    routeName.includes("guwahati") &&
    routeName.includes("imphal")
  ) {
    return PRIMARY_ROUTES[1].coordinates;
  }

  if (
    routeName.includes("guwahati") &&
    routeName.includes("aizawl")
  ) {
    return PRIMARY_ROUTES[2].coordinates;
  }

  if (
    routeName.includes("guwahati") &&
    routeName.includes("kohima")
  ) {
    return PRIMARY_ROUTES[3].coordinates;
  }

  if (
    routeName.includes("guwahati") &&
    routeName.includes("agartala")
  ) {
    return PRIMARY_ROUTES[4].coordinates;
  }

  return null;
}

function formatVehicle(vehicle) {
  return {
    ...vehicle,
    latitude: Number(vehicle.latitude),
    longitude: Number(vehicle.longitude),
    speed: Number(vehicle.speed || 0),
    fuel_level: Number(vehicle.fuel_level || 0),
  };
}

function formatDatabaseRoute(route) {
  return {
    ...route,
    distance_km: Number(route.distance_km || 0),
    estimated_time_minutes: Number(
      route.estimated_time_minutes || 0
    ),
    coordinates:
      getDatabaseRouteCoordinates(route),
  };
}

function formatIncidentDate(dateValue) {
  if (!dateValue) return "N/A";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleString();
}

/* =========================================================
   MAP SIZE FIX
========================================================= */

function MapSizeFix() {
  const map = useMap();

  useEffect(() => {
    const refreshMap = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    refreshMap();

    const timers = [
      setTimeout(
        () => map.invalidateSize(),
        300
      ),
      setTimeout(
        () => map.invalidateSize(),
        800
      ),
    ];

    window.addEventListener(
      "resize",
      refreshMap
    );

    return () => {
      window.removeEventListener(
        "resize",
        refreshMap
      );

      timers.forEach(clearTimeout);
    };
  }, [map]);

  return null;
}

/* =========================================================
   VEHICLE MAP CONTROLLER
========================================================= */

function VehicleMapController({
  selectedVehicle,
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedVehicle) return;

    const lat = Number(
      selectedVehicle.latitude
    );

    const lng = Number(
      selectedVehicle.longitude
    );

    if (isValidCoordinate(lat, lng)) {
      map.flyTo(
        [lat, lng],
        12,
        {
          duration: 1.2,
        }
      );
    }
  }, [selectedVehicle, map]);

  return null;
}

/* =========================================================
   ROUTE MAP CONTROLLER
========================================================= */

function RouteMapController({
  selectedRoute,
  coordinates,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      !selectedRoute ||
      !coordinates ||
      coordinates.length < 2
    ) {
      return;
    }

    try {
      const bounds =
        L.latLngBounds(coordinates);

      map.fitBounds(
        bounds,
        {
          padding: [50, 50],
          maxZoom: 10,
        }
      );
    } catch (error) {
      console.error(
        "Route map controller error:",
        error
      );
    }
  }, [
    selectedRoute,
    coordinates,
    map,
  ]);

  return null;
}

/* =========================================================
   NER STATE LAYER
========================================================= */

function NERStateLayer({
  setSelectedState,
}) {
  return (
    <>
      {NER_STATES.map((state) => {
        const color =
          riskColor(state.risk);

        return (
          <CircleMarker
            key={state.code}
            center={state.center}
            radius={18}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.14,
              weight: 2,
            }}
            eventHandlers={{
              click: () =>
                setSelectedState(
                  state
                ),
            }}
          >
            <Tooltip direction="top">
              <strong>
                {state.name}
              </strong>

              <br />

              Risk: {state.risk}

              <br />

              Status: {state.status}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

/* =========================================================
   STATE INTELLIGENCE PANEL
========================================================= */

function StateIntelligencePanel({
  state,
}) {
  if (!state) return null;

  return (
    <div className="gis-intelligence-panel state-intelligence-panel">

      <div className="gis-panel-title">
        STATE INTELLIGENCE
      </div>

      <div className="gis-panel-main">

        <div>
          <div className="gis-panel-label">
            REGION
          </div>

          <div className="gis-panel-value">
            {state.name}
          </div>
        </div>

        <div>
          <div className="gis-panel-label">
            RISK
          </div>

          <div
            className="gis-panel-value"
            style={{
              color: riskColor(
                state.risk
              ),
            }}
          >
            {state.risk}
          </div>
        </div>

      </div>

      <div className="gis-panel-row">
        <span>STATUS</span>
        <strong>{state.status}</strong>
      </div>

      <div className="gis-panel-row">
        <span>STATE CODE</span>
        <strong>{state.code}</strong>
      </div>

    </div>
  );
}

/* =========================================================
   VEHICLE INTELLIGENCE PANEL
========================================================= */

function VehicleIntelligencePanel({
  vehicle,
}) {
  if (!vehicle) return null;

  return (
    <div className="gis-intelligence-panel vehicle-intelligence-panel">

      <div className="gis-panel-title">
        VEHICLE INTELLIGENCE
      </div>

      <div className="gis-panel-main">

        <div>
          <div className="gis-panel-label">
            VEHICLE
          </div>

          <div className="gis-panel-value">
            {vehicle.vehicle_number}
          </div>
        </div>

        <div>
          <div className="gis-panel-label">
            STATUS
          </div>

          <div
            className="gis-panel-value"
            style={{
              color:
                vehicle.status ===
                "ACTIVE"
                  ? "#65d8c8"
                  : vehicle.status ===
                    "IDLE"
                    ? "#e5a75c"
                    : "#e66a6a",
            }}
          >
            {vehicle.status}
          </div>
        </div>

      </div>

      <div className="gis-panel-row">
        <span>DRIVER</span>

        <strong>
          {vehicle.driver_name ||
            "N/A"}
        </strong>
      </div>

      <div className="gis-panel-row">
        <span>SPEED</span>

        <strong>
          {vehicle.speed || 0} km/h
        </strong>
      </div>

      <div className="gis-panel-row">
        <span>FUEL</span>

        <strong>
          {vehicle.fuel_level || 0}%
        </strong>
      </div>

      <div className="gis-panel-row">
        <span>GPS</span>

        <strong>
          {Number(
            vehicle.latitude
          ).toFixed(4)}
          ,{" "}
          {Number(
            vehicle.longitude
          ).toFixed(4)}
        </strong>
      </div>

      <div className="gis-panel-row">
        <span>TELEMETRY</span>

        <strong
          style={{
            color: "#65d8c8",
          }}
        >
          ● LIVE
        </strong>
      </div>

    </div>
  );
}

/* =========================================================
   VEHICLE ICON
========================================================= */

function getVehicleIcon(vehicle) {
  const status = String(
    vehicle?.status || ""
  ).toUpperCase();

  let color = "#65d8c8";

  if (status === "IDLE") {
    color = "#e5a75c";
  }

  if (status === "MAINTENANCE") {
    color = "#e66a6a";
  }

  return L.divIcon({
    className:
      "fleet-map-marker",

    html: `
      <div
        style="
          width:34px;
          height:34px;
          border-radius:50%;
          background:${color};
          border:3px solid #ffffff;
          box-shadow:0 0 18px ${color};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:16px;
          font-weight:900;
          color:#071018;
        "
      >
        🚛
      </div>
    `,

    iconSize: [34, 34],

    iconAnchor: [17, 17],

    popupAnchor: [0, -17],
  });
}

/* =========================================================
   SMOOTH LIVE VEHICLE MARKER
========================================================= */

function SmoothVehicleMarker({
  vehicle,
  setSelectedVehicle,
}) {
  const [position, setPosition] =
    useState([
      Number(vehicle.latitude),
      Number(vehicle.longitude),
    ]);

  const animationRef =
    useRef(null);

  const previousPositionRef =
    useRef([
      Number(vehicle.latitude),
      Number(vehicle.longitude),
    ]);

  useEffect(() => {
    const targetLat =
      Number(vehicle.latitude);

    const targetLng =
      Number(vehicle.longitude);

    if (
      !isValidCoordinate(
        targetLat,
        targetLng
      )
    ) {
      return;
    }

    const startLat =
      Number(
        previousPositionRef.current[0]
      );

    const startLng =
      Number(
        previousPositionRef.current[1]
      );

    const startTime =
      performance.now();

    /*
      Backend telemetry updates every
      approximately 5 seconds.

      We animate for 4.8 seconds,
      leaving a small gap before the
      next backend update.
    */

    const animationDuration =
      4800;

    const animate = (
      currentTime
    ) => {
      const elapsed =
        currentTime -
        startTime;

      const progress =
        Math.min(
          elapsed /
            animationDuration,
          1
        );

      /*
        Smooth ease-in/ease-out
      */

      const easedProgress =
        progress < 0.5
          ? 2 *
            progress *
            progress
          : 1 -
            Math.pow(
              -2 *
                progress +
                2,
              2
            ) /
              2;

      const nextLat =
        startLat +
        (targetLat -
          startLat) *
          easedProgress;

      const nextLng =
        startLng +
        (targetLng -
          startLng) *
          easedProgress;

      setPosition([
        nextLat,
        nextLng,
      ]);

      if (
        progress < 1
      ) {
        animationRef.current =
          requestAnimationFrame(
            animate
          );
      } else {
        previousPositionRef.current =
          [
            targetLat,
            targetLng,
          ];
      }
    };

    if (
      animationRef.current
    ) {
      cancelAnimationFrame(
        animationRef.current
      );
    }

    animationRef.current =
      requestAnimationFrame(
        animate
      );

    return () => {
      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );
      }
    };
  }, [
    vehicle.latitude,
    vehicle.longitude,
  ]);

  return (
    <Marker
      position={position}
      icon={getVehicleIcon(
        vehicle
      )}
      eventHandlers={{
        click: () =>
          setSelectedVehicle({
            ...vehicle,
            latitude:
              position[0],
            longitude:
              position[1],
          }),
      }}
    >

      <Tooltip direction="top">

        <strong>
          {vehicle.vehicle_number}
        </strong>

        <br />

        {vehicle.status}

        <br />

        {vehicle.speed || 0}{" "}
        km/h

        <br />

        <span
          style={{
            color: "#65d8c8",
            fontWeight: 900,
          }}
        >
          ● LIVE GPS
        </span>

      </Tooltip>

      <Popup>

        <div className="gis-popup">

          <strong>
            {vehicle.vehicle_number}
          </strong>

          <hr />

          <div>
            <b>Type:</b>{" "}
            {vehicle.vehicle_type ||
              "N/A"}
          </div>

          <div>
            <b>Driver:</b>{" "}
            {vehicle.driver_name ||
              "N/A"}
          </div>

          <div>
            <b>Status:</b>{" "}
            {vehicle.status ||
              "N/A"}
          </div>

          <div>
            <b>Speed:</b>{" "}
            {vehicle.speed ||
              0}{" "}
            km/h
          </div>

          <div>
            <b>Fuel:</b>{" "}
            {vehicle.fuel_level ||
              0}%
          </div>

          <div>
            <b>GPS:</b>{" "}
            {position[0].toFixed(5)}
            ,{" "}
            {position[1].toFixed(5)}
          </div>

          <div>
            <b>Telemetry:</b>{" "}

            <span
              style={{
                color: "#65d8c8",
                fontWeight: 900,
              }}
            >
              ● LIVE
            </span>
          </div>

          <div>
            <b>Data Source:</b>{" "}
            PostgreSQL
          </div>

          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop:
                "1px solid #d7dce2",
              fontSize: 11,
              opacity: 0.75,
            }}
          >
            Smooth live GPS
            telemetry
          </div>

        </div>

      </Popup>

    </Marker>
  );
}

/* =========================================================
   MAIN GIS MAP
========================================================= */

export default function GISMap({
  selectedVehicleId,
  selectedRoute,
  alerts = [],
  alertConnected = false,
}) {
  const [
    selectedState,
    setSelectedState,
  ] = useState(null);

  const [
    selectedVehicle,
    setSelectedVehicle,
  ] = useState(null);

  const [fleet, setFleet] =
    useState([]);

  const [
    databaseRoutes,
    setDatabaseRoutes,
  ] = useState([]);

  const [
    databaseLoading,
    setDatabaseLoading,
  ] = useState(true);

  const [
    routeDatabaseLoading,
    setRouteDatabaseLoading,
  ] = useState(true);

  const [
    databaseError,
    setDatabaseError,
  ] = useState("");

  const [
    routeDatabaseError,
    setRouteDatabaseError,
  ] = useState("");

  /* =======================================================
     FETCH LIVE FLEET
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const fetchFleet = async () => {
      try {
        const data =
          await apiGet(
            "/vehicles"
          );

        if (!mounted) return;

        const formatted =
          Array.isArray(data)
            ? data.map(
                formatVehicle
              )
            : [];

        setFleet(
          formatted
        );

        setDatabaseError("");

        setDatabaseLoading(
          false
        );
      } catch (error) {
        console.error(
          "Vehicle API error:",
          error
        );

        if (!mounted) return;

        setDatabaseError(
          "Vehicle database offline"
        );

        setDatabaseLoading(
          false
        );

        setFleet(
          DEMO_VEHICLES
        );
      }
    };

    fetchFleet();

    const interval =
      setInterval(
        fetchFleet,
        5000
      );

    return () => {
      mounted = false;
      clearInterval(
        interval
      );
    };
  }, []);

  /* =======================================================
     DATABASE ROUTES
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    const fetchRoutes = async () => {
      try {
        const data =
          await apiGet(
            "/routes"
          );

        if (!mounted) return;

        const formatted =
          Array.isArray(data)
            ? data.map(
                formatDatabaseRoute
              )
            : [];

        setDatabaseRoutes(
          formatted
        );

        setRouteDatabaseError(
          ""
        );

        setRouteDatabaseLoading(
          false
        );
      } catch (error) {
        console.error(
          "Route API error:",
          error
        );

        if (!mounted) return;

        setRouteDatabaseError(
          "Route database offline"
        );

        setRouteDatabaseLoading(
          false
        );

        setDatabaseRoutes([]);
      }
    };

    fetchRoutes();

    const interval =
      setInterval(
        fetchRoutes,
        5000
      );

    return () => {
      mounted = false;

      clearInterval(
        interval
      );
    };
  }, []);

  /* =======================================================
     KEEP SELECTED VEHICLE SYNCHRONIZED
  ======================================================= */

  useEffect(() => {
    if (
      selectedVehicleId ==
      null
    ) {
      return;
    }

    const vehicle =
      fleet.find(
        (item) =>
          String(item.id) ===
          String(
            selectedVehicleId
          )
      );

    if (vehicle) {
      setSelectedVehicle({
        ...vehicle,

        latitude:
          Number(
            vehicle.latitude
          ),

        longitude:
          Number(
            vehicle.longitude
          ),
      });
    }
  }, [
    selectedVehicleId,
    fleet,
  ]);

  /* =======================================================
     SELECTED ROUTE COORDINATES
  ======================================================= */

  const selectedRouteCoordinates =
    useMemo(() => {
      if (!selectedRoute) {
        return null;
      }

      if (
        selectedRoute.coordinates
          ?.length >= 2
      ) {
        return selectedRoute.coordinates;
      }

      const databaseRoute =
        databaseRoutes.find(
          (route) =>
            String(route.id) ===
            String(
              selectedRoute.id
            )
        );

      if (
        databaseRoute
          ?.coordinates
          ?.length >= 2
      ) {
        return databaseRoute.coordinates;
      }

      return getDatabaseRouteCoordinates(
        selectedRoute
      );
    }, [
      selectedRoute,
      databaseRoutes,
    ]);

  /* =======================================================
     FLEET KPIs
  ======================================================= */

  const fleetSummary =
    useMemo(() => {
      const vehicles =
        fleet.length > 0
          ? fleet
          : DEMO_VEHICLES;

      const active =
        vehicles.filter(
          (vehicle) =>
            String(
              vehicle.status
            ).toUpperCase() ===
            "ACTIVE"
        ).length;

      const idle =
        vehicles.filter(
          (vehicle) =>
            String(
              vehicle.status
            ).toUpperCase() ===
            "IDLE"
        ).length;

      const maintenance =
        vehicles.filter(
          (vehicle) =>
            String(
              vehicle.status
            ).toUpperCase() ===
            "MAINTENANCE"
        ).length;

      const averageSpeed =
        vehicles.length > 0
          ? Math.round(
              vehicles.reduce(
                (
                  sum,
                  vehicle
                ) =>
                  sum +
                  Number(
                    vehicle.speed ||
                      0
                  ),
                0
              ) /
                vehicles.length
            )
          : 0;

      return {
        total:
          vehicles.length,

        active,

        idle,

        maintenance,

        averageSpeed,
      };
    }, [fleet]);

  /* =======================================================
     INCIDENT SUMMARY
  ======================================================= */

  const incidentSummary =
    useMemo(() => {
      const safeAlerts =
        Array.isArray(
          alerts
        )
          ? alerts
          : [];

      const active =
        safeAlerts.filter(
          (alert) =>
            getIncidentStatus(
              alert
            ) ===
            "ACTIVE"
        );

      const critical =
        active.filter(
          (alert) =>
            normalizeSeverity(
              alert.severity
            ) ===
            "CRITICAL"
        );

      const high =
        active.filter(
          (alert) =>
            normalizeSeverity(
              alert.severity
            ) ===
            "HIGH"
        );

      return {
        total:
          safeAlerts.length,

        active:
          active.length,

        critical:
          critical.length,

        high:
          high.length,
      };
    }, [alerts]);

  /* =======================================================
     MAP
  ======================================================= */

  return (
    <div className="gis-map-root">

      <MapContainer
        center={INDIA_CENTER}
        zoom={INDIA_ZOOM}
        minZoom={4}
        maxZoom={15}
        scrollWheelZoom={true}
        className="command-map"
        style={{
          width: "100%",
          height: "100%",
          minHeight: "650px",
        }}
      >

        <MapSizeFix />

        <VehicleMapController
          selectedVehicle={
            selectedVehicle
          }
        />

        <RouteMapController
          selectedRoute={
            selectedRoute
          }
          coordinates={
            selectedRouteCoordinates
          }
        />

        <LayersControl position="topright">

          {/* =================================================
              OPERATIONAL MAP
          ================================================= */}

          <LayersControl.BaseLayer
            checked
            name="Operational Map"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          {/* =================================================
              TERRAIN MAP
          ================================================= */}

          <LayersControl.BaseLayer
            name="Terrain Map"
          >
            <TileLayer
              attribution="&copy; OpenTopoMap contributors"
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          {/* =================================================
              NER STATE INTELLIGENCE
          ================================================= */}

          <LayersControl.Overlay
            checked
            name="NER State Intelligence"
          >
            <LayerGroup>

              <NERStateLayer
                setSelectedState={
                  setSelectedState
                }
              />

            </LayerGroup>
          </LayersControl.Overlay>

          {/* =================================================
              PRIMARY CORRIDORS
          ================================================= */}

          <LayersControl.Overlay
            checked
            name="Primary Corridors"
          >
            <LayerGroup>

              {PRIMARY_ROUTES.map(
                (route) => (
                  <Polyline
                    key={
                      route.name
                    }
                    positions={
                      route.coordinates
                    }
                    pathOptions={{
                      color:
                        "#65d8c8",
                      weight: 4,
                      opacity: 0.75,
                    }}
                  >
                    <Tooltip sticky>

                      <strong>
                        {route.name}
                      </strong>

                      <br />

                      Primary NER
                      corridor

                    </Tooltip>
                  </Polyline>
                )
              )}

            </LayerGroup>
          </LayersControl.Overlay>

          {/* =================================================
              SECONDARY CORRIDORS
          ================================================= */}

          <LayersControl.Overlay
            checked
            name="Secondary Corridors"
          >
            <LayerGroup>

              {SECONDARY_ROUTES.map(
                (route) => (
                  <Polyline
                    key={
                      route.name
                    }
                    positions={
                      route.coordinates
                    }
                    pathOptions={{
                      color:
                        "#8fa3b8",
                      weight: 2,
                      opacity: 0.55,
                      dashArray:
                        "8 8",
                    }}
                  >
                    <Tooltip sticky>

                      <strong>
                        {route.name}
                      </strong>

                      <br />

                      Secondary
                      corridor

                    </Tooltip>
                  </Polyline>
                )
              )}

            </LayerGroup>
          </LayersControl.Overlay>

          {/* =================================================
              POSTGRESQL ROUTES
          ================================================= */}

          <LayersControl.Overlay
            checked
            name="PostgreSQL Routes"
          >
            <LayerGroup>

              {databaseRoutes.map(
                (route) => {
                  if (
                    !route.coordinates ||
                    route.coordinates
                      .length < 2
                  ) {
                    return null;
                  }

                  const isSelected =
                    selectedRoute &&
                    String(
                      selectedRoute.id
                    ) ===
                      String(
                        route.id
                      );

                  return (
                    <Polyline
                      key={`db-route-${route.id}`}
                      positions={
                        route.coordinates
                      }
                      pathOptions={{
                        color:
                          isSelected
                            ? "#ffffff"
                            : "#4f9cff",

                        weight:
                          isSelected
                            ? 7
                            : 4,

                        opacity:
                          isSelected
                            ? 1
                            : 0.8,

                        dashArray:
                          isSelected
                            ? undefined
                            : "12 7",
                      }}
                    >

                      <Tooltip sticky>

                        <strong>
                          {route.route_name ||
                            `${route.start_location} → ${route.destination}`}
                        </strong>

                        <br />

                        PostgreSQL
                        Route

                        <br />

                        Status:{" "}
                        {route.route_status ||
                          "N/A"}

                      </Tooltip>

                      <Popup>

                        <div className="gis-popup">

                          <strong>
                            {route.route_name ||
                              "Database Route"}
                          </strong>

                          <hr />

                          <div>
                            <b>
                              Start:
                            </b>{" "}
                            {route.start_location ||
                              "N/A"}
                          </div>

                          <div>
                            <b>
                              Destination:
                            </b>{" "}
                            {route.destination ||
                              "N/A"}
                          </div>

                          <div>
                            <b>
                              Distance:
                            </b>{" "}
                            {route.distance_km ||
                              0}{" "}
                            km
                          </div>

                          <div>
                            <b>
                              ETA:
                            </b>{" "}
                            {route.estimated_time_minutes ||
                              0}{" "}
                            min
                          </div>

                          <div>
                            <b>
                              Status:
                            </b>{" "}
                            {route.route_status ||
                              "N/A"}
                          </div>

                          <div>
                            <b>
                              Vehicle:
                            </b>{" "}
                            {route.vehicle_number ||
                              "N/A"}
                          </div>

                          <div>
                            <b>
                              PostgreSQL ID:
                            </b>{" "}
                            {route.id}
                          </div>

                        </div>

                      </Popup>

                    </Polyline>
                  );
                }
              )}

            </LayerGroup>
          </LayersControl.Overlay>

          {/* =================================================
              LOGISTICS HUBS
          ================================================= */}

          <LayersControl.Overlay
            checked
            name="Logistics Hubs"
          >
            <LayerGroup>

              {LOGISTICS_HUBS.map(
                (hub) => (
                  <CircleMarker
                    key={
                      hub.name
                    }
                    center={
                      hub.coordinates
                    }
                    radius={8}
                    pathOptions={{
                      color:
                        "#ffffff",

                      fillColor:
                        "#4f9cff",

                      fillOpacity:
                        0.9,

                      weight: 2,
                    }}
                  >

                    <Tooltip>

                      <strong>
                        {hub.name}
                      </strong>

                      <br />

                      {hub.type}

                    </Tooltip>

                    <Popup>

                      <div className="gis-popup">

                        <strong>
                          {hub.name}
                        </strong>

                        <hr />

                        <div>
                          <b>
                            Location:
                          </b>{" "}
                          {hub.location}
                        </div>

                        <div>
                          <b>
                            Type:
                          </b>{" "}
                          {hub.type}
                        </div>

                        <div>
                          <b>
                            Coordinates:
                          </b>{" "}
                          {hub.coordinates[0].toFixed(
                            4
                          )}
                          ,{" "}
                          {hub.coordinates[1].toFixed(
                            4
                          )}
                        </div>

                      </div>

                    </Popup>

                  </CircleMarker>
                )
              )}

            </LayerGroup>
          </LayersControl.Overlay>

          {/* =================================================
              RISK ZONES
          ================================================= */}

          <LayersControl.Overlay
            checked
            name="Risk Zones"
          >
            <LayerGroup>

              {RISK_ZONES.map(
                (zone) => {
                  const color =
                    riskColor(
                      zone.level
                    );

                  return (
                    <Circle
                      key={
                        zone.name
                      }
                      center={
                        zone.center
                      }
                      radius={
                        zone.radius
                      }
                      pathOptions={{
                        color,

                        fillColor:
                          color,

                        fillOpacity:
                          0.07,

                        weight: 2,

                        dashArray:
                          "7 6",
                      }}
                    >

                      <Tooltip sticky>

                        <strong>
                          {zone.name}
                        </strong>

                        <br />

                        Risk:{" "}
                        {zone.level}

                      </Tooltip>

                    </Circle>
                  );
                }
              )}

            </LayerGroup>
          </LayersControl.Overlay>

          {/* =================================================
              LIVE FLEET VEHICLES
          ================================================= */}

          <LayersControl.Overlay
            checked
            name="Fleet Vehicles"
          >
            <LayerGroup>

              {(fleet.length > 0
                ? fleet
                : DEMO_VEHICLES
              ).map(
                (vehicle) => {

                  if (
                    !isValidCoordinate(
                      vehicle.latitude,
                      vehicle.longitude
                    )
                  ) {
                    return null;
                  }

                  return (
                    <SmoothVehicleMarker
                      key={`vehicle-${vehicle.id}`}
                      vehicle={
                        vehicle
                      }
                      setSelectedVehicle={
                        setSelectedVehicle
                      }
                    />
                  );
                }
              )}

            </LayerGroup>
          </LayersControl.Overlay>

          {/* =================================================
              LIVE INCIDENT ALERTS
          ================================================= */}

          <LayersControl.Overlay
            checked
            name="Live Incident Alerts"
          >
            <LayerGroup>

             {(Array.isArray(alerts)
  ? alerts.filter(
      (alert) => !(
        alert?.is_resolved === true ||
        String(alert?.is_resolved).toLowerCase() === "true"
      )
    )
  : []
).map(
  (alert) => {

                  if (
                    !isValidCoordinate(
                      alert.latitude,
                      alert.longitude
                    )
                  ) {
                    return null;
                  }

                  const severity =
                    normalizeSeverity(
                      alert.severity
                    );

                  const color =
                    incidentSeverityColor(
                      severity
                    );

                  const status =
                    getIncidentStatus(
                      alert
                    );

                  const latitude =
                    Number(
                      alert.latitude
                    );

                  const longitude =
                    Number(
                      alert.longitude
                    );

                  return (
                    <CircleMarker
                      key={`incident-${alert.id}`}
                      center={[
                        latitude,
                        longitude,
                      ]}
                      radius={
                        severity ===
                        "CRITICAL"
                          ? 12
                          : severity ===
                            "HIGH"
                            ? 11
                            : 9
                      }
                      pathOptions={{
                        color:
                          "#ffffff",

                        fillColor:
                          color,

                        fillOpacity:
                          status ===
                          "RESOLVED"
                            ? 0.35
                            : 0.9,

                        weight: 2,
                      }}
                    >

                      <Tooltip direction="top">

                        <strong>
                          {severity}{" "}
                          INCIDENT
                        </strong>

                        <br />

                        Vehicle:{" "}
                        {alert.vehicle_number ||
                          "N/A"}

                      </Tooltip>

                      <Popup>

                        <div className="gis-popup">

                          <strong>
                            🚨 INCIDENT #
                            {alert.id}
                          </strong>

                          <hr />

                          <div
                            style={{
                              color,
                              fontWeight: 900,
                              marginBottom: 8,
                            }}
                          >
                            {severity}
                          </div>

                          <div>
                            <b>
                              Alert Type:
                            </b>{" "}
                            {alert.alert_type ||
                              "N/A"}
                          </div>

                          <div>
                            <b>
                              Vehicle:
                            </b>{" "}
                            {alert.vehicle_number ||
                              "N/A"}
                          </div>

                          <div>
                            <b>
                              Status:
                            </b>{" "}
                            {status}
                          </div>

                          <div>
                            <b>
                              Message:
                            </b>{" "}
                            {alert.message ||
                              "No message"}
                          </div>

                          <div>
                            <b>
                              Coordinates:
                            </b>{" "}
                            {latitude.toFixed(
                              5
                            )}
                            ,{" "}
                            {longitude.toFixed(
                              5
                            )}
                          </div>

                          <div>
                            <b>
                              Created:
                            </b>{" "}
                            {formatIncidentDate(
                              alert.created_at
                            )}
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              paddingTop: 8,
                              borderTop:
                                "1px solid #d7dce2",
                              fontSize: 11,
                              opacity: 0.75,
                            }}
                          >
                            Live PostgreSQL
                            Incident
                          </div>

                        </div>

                      </Popup>

                    </CircleMarker>
                  );
                }
              )}

            </LayerGroup>
          </LayersControl.Overlay>

        </LayersControl>

        {/* =================================================
            INTELLIGENCE PANELS
        ================================================= */}

        <StateIntelligencePanel
          state={
            selectedState
          }
        />

        <VehicleIntelligencePanel
          vehicle={
            selectedVehicle
          }
        />

      </MapContainer>

      {/* =====================================================
          DATABASE STATUS HUD
      ===================================================== */}

      <div className="gis-hud gis-database-hud">

        <div className="gis-hud-title">
          FLEET DATABASE
        </div>

        <div className="gis-hud-status">

          <span
            className="gis-status-dot"
            style={{
              background:
                databaseError
                  ? "#e66a6a"
                  : "#65d8c8",

              boxShadow:
                databaseError
                  ? "0 0 12px #e66a6a"
                  : "0 0 12px #65d8c8",
            }}
          />

          {databaseLoading
            ? "CONNECTING..."
            : databaseError
              ? "OFFLINE"
              : "LIVE"}

        </div>

        <div className="gis-hud-row">
          <span>
            VEHICLES
          </span>

          <strong>
            {fleetSummary.total}
          </strong>
        </div>

        <div className="gis-hud-row">
          <span>
            ACTIVE
          </span>

          <strong>
            {fleetSummary.active}
          </strong>
        </div>

        <div className="gis-hud-row">
          <span>
            AVG SPEED
          </span>

          <strong>
            {fleetSummary.averageSpeed}{" "}
            km/h
          </strong>
        </div>

      </div>

      {/* =====================================================
          ROUTE DATABASE HUD
      ===================================================== */}

      <div className="gis-hud gis-route-database-hud">

        <div className="gis-hud-title">
          ROUTE DATABASE
        </div>

        <div className="gis-hud-status">

          <span
            className="gis-status-dot"
            style={{
              background:
                routeDatabaseError
                  ? "#e66a6a"
                  : "#65d8c8",

              boxShadow:
                routeDatabaseError
                  ? "0 0 12px #e66a6a"
                  : "0 0 12px #65d8c8",
            }}
          />

          {routeDatabaseLoading
            ? "CONNECTING..."
            : routeDatabaseError
              ? "OFFLINE"
              : "LIVE"}

        </div>

        <div className="gis-hud-row">
          <span>
            CORRIDORS
          </span>

          <strong>
            {databaseRoutes.length ||
              42}
          </strong>
        </div>

      </div>

      {/* =====================================================
          INCIDENT HUD
      ===================================================== */}

      <div className="gis-hud gis-incident-hud">

        <div className="gis-hud-title">
          INCIDENT MONITOR
        </div>

        <div className="gis-hud-status">

          <span
            className="gis-status-dot"
            style={{
              background:
                alertConnected
                  ? "#65d8c8"
                  : "#e66a6a",

              boxShadow:
                alertConnected
                  ? "0 0 12px #65d8c8"
                  : "0 0 12px #e66a6a",
            }}
          />

          {alertConnected
            ? "LIVE INCIDENT FEED"
            : "INCIDENT FEED OFFLINE"}

        </div>

        <div className="gis-hud-row">
          <span>
            ACTIVE INCIDENTS
          </span>

          <strong>
            {incidentSummary.active}
          </strong>
        </div>

        <div className="gis-hud-row">
          <span>
            CRITICAL
          </span>

          <strong
            style={{
              color: "#ff3b3b",
            }}
          >
            {incidentSummary.critical}
          </strong>
        </div>

        <div className="gis-hud-row">
          <span>
            HIGH
          </span>

          <strong
            style={{
              color: "#ff6b35",
            }}
          >
            {incidentSummary.high}
          </strong>
        </div>

      </div>

      {/* =====================================================
          ROUTE INTELLIGENCE HUD
      ===================================================== */}

      <div className="gis-hud gis-route-intelligence-hud">

        <div className="gis-hud-title">
          ROUTE INTELLIGENCE
        </div>

        <div className="gis-hud-row">
          <span>
            PRIMARY
          </span>

          <strong>
            {PRIMARY_ROUTES.length}
          </strong>
        </div>

        <div className="gis-hud-row">
          <span>
            SECONDARY
          </span>

          <strong>
            {SECONDARY_ROUTES.length}
          </strong>
        </div>

        <div className="gis-hud-row">
          <span>
            DB ROUTES
          </span>

          <strong>
            {databaseRoutes.length}
          </strong>
        </div>

      </div>

      {/* =====================================================
          NETWORK INTELLIGENCE HUD
      ===================================================== */}

      <div className="gis-hud gis-network-hud">

        <div className="gis-hud-title">
          NETWORK INTELLIGENCE
        </div>

        <div className="gis-hud-row">
          <span>
            NER STATES
          </span>

          <strong>
            {NER_STATES.length}
          </strong>
        </div>

        <div className="gis-hud-row">
          <span>
            HUBS
          </span>

          <strong>
            {LOGISTICS_HUBS.length}
          </strong>
        </div>

        <div className="gis-hud-row">
          <span>
            CORRIDORS
          </span>

          <strong>
            {databaseRoutes.length ||
              42}
          </strong>
        </div>

        <div className="gis-hud-row">
          <span>
            INCIDENTS
          </span>

          <strong>
            {incidentSummary.active}
          </strong>
        </div>

      </div>

      {/* =====================================================
          MAP LEGEND
      ===================================================== */}

      <div className="gis-map-legend">

        <div className="gis-legend-title">
          LIVE MAP LEGEND
        </div>

        <div className="gis-legend-row">

          <span
            className="gis-legend-dot"
            style={{
              background:
                "#65d8c8",
            }}
          />

          Fleet Active

        </div>

        <div className="gis-legend-row">

          <span
            className="gis-legend-dot"
            style={{
              background:
                "#e5a75c",
            }}
          />

          Fleet Idle

        </div>

        <div className="gis-legend-row">

          <span
            className="gis-legend-dot"
            style={{
              background:
                "#e66a6a",
            }}
          />

          Maintenance

        </div>

        <div className="gis-legend-divider" />

        <div className="gis-legend-row">

          <span
            className="gis-legend-dot"
            style={{
              background:
                "#ff2d2d",
            }}
          />

          CRITICAL Incident

        </div>

        <div className="gis-legend-row">

          <span
            className="gis-legend-dot"
            style={{
              background:
                "#ff6b35",
            }}
          />

          HIGH Incident

        </div>

        <div className="gis-legend-row">

          <span
            className="gis-legend-dot"
            style={{
              background:
                "#f5b642",
            }}
          />

          MEDIUM Incident

        </div>

        <div className="gis-legend-row">

          <span
            className="gis-legend-dot"
            style={{
              background:
                "#4dd4c6",
            }}
          />

          LOW Incident

        </div>

        <div className="gis-legend-divider" />

        <div className="gis-legend-row">

          <span
            className="gis-legend-line"
            style={{
              background:
                "#65d8c8",
            }}
          />

          Primary Corridor

        </div>

        <div className="gis-legend-row">

          <span
            className="gis-legend-line"
            style={{
              background:
                "#8fa3b8",
            }}
          />

          Secondary Corridor

        </div>

        <div className="gis-legend-row">

          <span
            className="gis-legend-line"
            style={{
              background:
                "#4f9cff",
            }}
          />

          PostgreSQL Route

        </div>

      </div>

      {/* =====================================================
          ROUTE COPILOT
      ===================================================== */}

      <RouteCopilot
        selectedRoute={
          selectedRoute
        }
        selectedVehicle={
          selectedVehicle
        }
        fleet={fleet}
        databaseRoutes={
          databaseRoutes
        }
        alerts={alerts}
      />

    </div>
  );
}