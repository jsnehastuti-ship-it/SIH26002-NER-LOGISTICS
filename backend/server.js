const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());
app.use(express.json());

/* =========================================================
   CONFIGURATION
========================================================= */

const PORT = process.env.PORT || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "SIH26002_SECRET_KEY_CHANGE_LATER";

/* =========================================================
   WEATHER INTELLIGENCE CONFIGURATION
========================================================= */

const WEATHER_API_KEY =
  process.env.WEATHER_API_KEY || "";

console.log(
  "Weather API key loaded:",
  WEATHER_API_KEY ? "YES" : "NO"
);

const WEATHER_LOCATION =
  process.env.WEATHER_LOCATION || "";

/* =========================================================
   NORTH EASTERN REGION CONFIGURATION
========================================================= */

/*
 * SIH26002 prototype geography:
 *
 * Assam
 * Arunachal Pradesh
 * Manipur
 * Meghalaya
 * Mizoram
 * Nagaland
 * Tripura
 * Sikkim
 *
 * The simulation is restricted to the
 * North Eastern Region of India.
 */

const NER_BOUNDS = {
  minLatitude: 23.0,
  maxLatitude: 28.8,
  minLongitude: 88.0,
  maxLongitude: 95.5,
};

/* =========================================================
   NER VEHICLE STARTING POSITIONS
========================================================= */

const NER_VEHICLE_POSITIONS = {
  1: {
    latitude: 26.1445,
    longitude: 91.7362,
  },

  2: {
    latitude: 24.8170,
    longitude: 93.9368,
  },

  3: {
    latitude: 25.5788,
    longitude: 91.8933,
  },

  4: {
    latitude: 23.7271,
    longitude: 92.7176,
  },

  5: {
    latitude: 25.6751,
    longitude: 94.1086,
  },
};

/* =========================================================
   POSTGRESQL CONNECTION
========================================================= */

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

/* =========================================================
   DATABASE CONNECTION TEST
========================================================= */

pool.connect()
  .then((client) => {
    console.log(
      "✅ PostgreSQL connected successfully"
    );

    client.release();
  })
  .catch((error) => {
    console.error(
      "❌ PostgreSQL connection failed:",
      error.message
    );
  });

/* =========================================================
   AUTHENTICATION HELPERS
========================================================= */

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: "8h",
    }
  );
}

/* =========================================================
   AUTHENTICATION MIDDLEWARE
========================================================= */

function authenticateToken(req, res, next) {
  const authHeader =
    req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  const token =
    authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Invalid authentication token",
    });
  }

  try {
    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = decoded;

    next();

  } catch (error) {
    return res.status(403).json({
      error:
        "Invalid or expired token",
    });
  }
}

/* =========================================================
   ROLE MIDDLEWARE
========================================================= */

function requireRole(...allowedRoles) {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        error:
          "Authentication required",
      });
    }

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        error:
          "Access denied for this role",
      });
    }

    next();
  };
}

/* =========================================================
   CREATE DEMO USERS
========================================================= */

async function createDemoUsers() {

  try {

    const users = [

      {
        username: "admin",
        password: "admin123",
        role: "ADMIN",
        full_name:
          "System Administrator",
      },

      {
        username: "authority",
        password: "authority123",
        role: "AUTHORITY",
        full_name:
          "Authority Operator",
      },

    ];

    for (
      const user of users
    ) {

      const existingUser =
        await pool.query(
          `
          SELECT id
          FROM users
          WHERE username = $1
          `,
          [user.username]
        );

      if (
        existingUser.rows.length === 0
      ) {

        const passwordHash =
          await bcrypt.hash(
            user.password,
            10
          );

        await pool.query(
          `
          INSERT INTO users
          (
            username,
            password_hash,
            role,
            full_name
          )
          VALUES
          ($1, $2, $3, $4)
          `,
          [
            user.username,
            passwordHash,
            user.role,
            user.full_name,
          ]
        );

        console.log(
          `✅ Demo user created: ${user.username}`
        );
      }
    }

    console.log(
      "✅ Authentication users ready"
    );

  } catch (error) {

    console.error(
      "❌ Failed to create demo users:",
      error.message
    );

  }
}

/* =========================================================
   RESET VEHICLES TO NER STARTING POSITIONS
========================================================= */

async function resetVehiclesToNER() {

  try {

    console.log(
      "🌏 Initializing fleet inside North Eastern Region..."
    );

    for (
      const [vehicleId, position]
      of Object.entries(
        NER_VEHICLE_POSITIONS
      )
    ) {

      await pool.query(
        `
        UPDATE vehicles
        SET
          latitude = $1,
          longitude = $2,
          last_updated = CURRENT_TIMESTAMP
        WHERE id = $3
        `,
        [
          position.latitude,
          position.longitude,
          Number(vehicleId),
        ]
      );

    }

    console.log(
      "✅ All demo vehicles positioned inside NER"
    );

  } catch (error) {

    console.error(
      "❌ Failed to initialize NER vehicle positions:",
      error.message
    );

  }
}

/* =========================================================
   HOME ROUTE
========================================================= */

app.get("/", (req, res) => {

  res.json({
    message:
      "SIH26002 NER Logistics Intelligence Backend is running 🚛🌏",
    region:
      "North Eastern Region",
    states: [
      "Assam",
      "Arunachal Pradesh",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Tripura",
      "Sikkim",
    ],
  });

});

/* =========================================================
   AUTH — LOGIN
========================================================= */

app.post(
  "/api/auth/login",
  async (req, res) => {

    try {

      const {
        username,
        password,
        role,
      } = req.body;

      if (
        !username ||
        !password ||
        !role
      ) {

        return res.status(400).json({
          error:
            "Username, password and role are required",
        });

      }

      const result =
        await pool.query(
          `
          SELECT
            id,
            username,
            password_hash,
            role,
            full_name,
            is_active
          FROM users
          WHERE username = $1
          `,
          [username]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(401).json({
          error:
            "Invalid username or password",
        });

      }

      const user =
        result.rows[0];

      if (!user.is_active) {

        return res.status(403).json({
          error:
            "User account is inactive",
        });

      }

      if (
        user.role !== role
      ) {

        return res.status(401).json({
          error:
            "Selected role does not match the user account",
        });

      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (!passwordMatch) {

        return res.status(401).json({
          error:
            "Invalid username or password",
        });

      }

      const token =
        generateToken(user);

      res.json({

        message:
          "Login successful",

        token,

        user: {
          id: user.id,
          username:
            user.username,
          role:
            user.role,
          full_name:
            user.full_name,
        },

      });

    } catch (error) {

      console.error(
        "❌ Login error:",
        error
      );

      res.status(500).json({
        error:
          "Login failed",
      });

    }

  }
);

/* =========================================================
   AUTH — VERIFY TOKEN
========================================================= */

app.get(
  "/api/auth/verify",
  authenticateToken,
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            username,
            role,
            full_name,
            is_active
          FROM users
          WHERE id = $1
          `,
          [req.user.id]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "User not found",
        });

      }

      const user =
        result.rows[0];

      if (!user.is_active) {

        return res.status(403).json({
          error:
            "User account is inactive",
        });

      }

      res.json({

        authenticated: true,

        user: {
          id: user.id,
          username:
            user.username,
          role:
            user.role,
          full_name:
            user.full_name,
        },

      });

    } catch (error) {

      console.error(
        "❌ Token verification error:",
        error
      );

      res.status(500).json({
        error:
          "Verification failed",
      });

    }

  }
);

/* =========================================================
   GET ALL USERS
   ADMIN ONLY
========================================================= */

app.get(
  "/api/users",
  authenticateToken,
  requireRole("ADMIN"),
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            username,
            role,
            full_name,
            is_active,
            created_at
          FROM users
          ORDER BY id;
          `
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        "❌ Get users error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch users",
      });

    }

  }
);

/* =========================================================
   CREATE USER
   ADMIN ONLY
========================================================= */

app.post(
  "/api/users",
  authenticateToken,
  requireRole("ADMIN"),
  async (req, res) => {

    try {

      const {
        username,
        password,
        role,
        full_name,
      } = req.body;

      if (
        !username ||
        !password ||
        !role ||
        !full_name
      ) {

        return res.status(400).json({
          error:
            "Username, password, role and full name are required",
        });

      }

      const allowedRoles = [
        "ADMIN",
        "AUTHORITY",
      ];

      if (
        !allowedRoles.includes(role)
      ) {

        return res.status(400).json({
          error:
            "Invalid role. Allowed roles: ADMIN, AUTHORITY",
        });

      }

      const existingUser =
        await pool.query(
          `
          SELECT id
          FROM users
          WHERE username = $1
          `,
          [username]
        );

      if (
        existingUser.rows.length > 0
      ) {

        return res.status(409).json({
          error:
            "Username already exists",
        });

      }

      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );

      const result =
        await pool.query(
          `
          INSERT INTO users
          (
            username,
            password_hash,
            role,
            full_name,
            is_active
          )
          VALUES
          ($1, $2, $3, $4, true)
          RETURNING
            id,
            username,
            role,
            full_name,
            is_active,
            created_at;
          `,
          [
            username,
            passwordHash,
            role,
            full_name,
          ]
        );

      res.status(201).json({

        message:
          "User created successfully",

        user:
          result.rows[0],

      });

    } catch (error) {

      console.error(
        "❌ Create user error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to create user",
      });

    }

  }
);

/* =========================================================
   GET ALL VEHICLES
========================================================= */

app.get(
  "/api/vehicles",
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            vehicle_number,
            vehicle_type,
            driver_name,
            status,
            latitude,
            longitude,
            speed,
            fuel_level,
            last_updated
          FROM vehicles
          ORDER BY id;
          `
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        "❌ Get vehicles error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch vehicles",
      });

    }

  }
);

/* =========================================================
   GET GPS LOCATIONS
========================================================= */

app.get(
  "/api/gps",
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            g.id,
            g.vehicle_id,
            v.vehicle_number,
            g.latitude,
            g.longitude,
            g.speed,
            g.heading,
            g.recorded_at
          FROM gps_locations g
          JOIN vehicles v
            ON g.vehicle_id = v.id
          ORDER BY
            g.recorded_at DESC;
          `
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        "❌ Get GPS error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch GPS data",
      });

    }

  }
);

/* =========================================================
   WEATHER RISK INTELLIGENCE ENGINE
========================================================= */

function calculateWeatherRisk(
  weather
) {

  let riskScore = 0;

  const factors = [];

  const condition =
    String(
      weather.condition || ""
    ).toLowerCase();

  const description =
    String(
      weather.description || ""
    ).toLowerCase();

  const temperature =
    Number(
      weather.temperature ?? 0
    );

  const humidity =
    Number(
      weather.humidity ?? 0
    );

  const visibility =
    Number(
      weather.visibility ?? 10
    );

  const windSpeed =
    Number(
      weather.windSpeed ?? 0
    );

  /* ==============================================
     RAIN / STORM CONDITIONS
  ============================================== */

  if (
    condition.includes(
      "thunderstorm"
    )
  ) {

    riskScore += 40;

    factors.push(
      "Thunderstorm conditions detected"
    );

  } else if (
    condition.includes("rain") ||
    description.includes("rain")
  ) {

    riskScore += 25;

    factors.push(
      "Rain may reduce road safety"
    );

  } else if (
    condition.includes("drizzle")
  ) {

    riskScore += 15;

    factors.push(
      "Drizzle detected"
    );

  }

  /* ==============================================
     WIND RISK
  ============================================== */

  if (
    windSpeed >= 15
  ) {

    riskScore += 30;

    factors.push(
      "Very strong wind conditions"
    );

  } else if (
    windSpeed >= 10
  ) {

    riskScore += 20;

    factors.push(
      "High wind conditions"
    );

  } else if (
    windSpeed >= 7
  ) {

    riskScore += 10;

    factors.push(
      "Moderate wind conditions"
    );

  }

  /* ==============================================
     VISIBILITY RISK
  ============================================== */

  if (
    visibility < 2
  ) {

    riskScore += 30;

    factors.push(
      "Critical visibility reduction"
    );

  } else if (
    visibility < 5
  ) {

    riskScore += 20;

    factors.push(
      "Low visibility detected"
    );

  } else if (
    visibility < 8
  ) {

    riskScore += 10;

    factors.push(
      "Reduced visibility"
    );

  }

  /* ==============================================
     TEMPERATURE RISK
  ============================================== */

  if (
    temperature >= 42
  ) {

    riskScore += 20;

    factors.push(
      "Extreme heat conditions"
    );

  } else if (
    temperature >= 38
  ) {

    riskScore += 10;

    factors.push(
      "High temperature"
    );

  } else if (
    temperature <= 5
  ) {

    riskScore += 15;

    factors.push(
      "Very low temperature"
    );

  }

  /* ==============================================
     HUMIDITY
  ============================================== */

  if (
    humidity >= 90
  ) {

    riskScore += 10;

    factors.push(
      "Very high humidity"
    );

  }

  /* ==============================================
     LIMIT SCORE
  ============================================== */

  riskScore =
    Math.min(
      100,
      Math.round(
        riskScore
      )
    );

  /* ==============================================
     DETERMINE RISK LEVEL
  ============================================== */

  let riskLevel =
    "LOW";

  if (
    riskScore >= 70
  ) {

    riskLevel =
      "CRITICAL";

  } else if (
    riskScore >= 45
  ) {

    riskLevel =
      "HIGH";

  } else if (
    riskScore >= 20
  ) {

    riskLevel =
      "MODERATE";

  }

  /* ==============================================
     OPERATIONAL IMPACT
  ============================================== */

  let operationalImpact =
    "Minimal impact on fleet operations.";

  if (
    riskLevel ===
    "MODERATE"
  ) {

    operationalImpact =
      "Minor operational disruption possible. Drivers should remain cautious.";

  } else if (
    riskLevel ===
    "HIGH"
  ) {

    operationalImpact =
      "High possibility of delays and increased driving risk.";

  } else if (
    riskLevel ===
    "CRITICAL"
  ) {

    operationalImpact =
      "Severe weather conditions may significantly affect fleet operations.";

  }

  /* ==============================================
     RECOMMENDATION
  ============================================== */

  let recommendation =
    "Continue normal operations while monitoring weather conditions.";

  if (
    riskLevel ===
    "MODERATE"
  ) {

    recommendation =
      "Increase driver awareness and monitor weather conditions.";

  } else if (
    riskLevel ===
    "HIGH"
  ) {

    recommendation =
      "Reduce vehicle speed and consider route adjustments.";

  } else if (
    riskLevel ===
    "CRITICAL"
  ) {

    recommendation =
      "Consider delaying high-risk routes until weather conditions improve.";

  }

  return {
    riskScore,
    riskLevel,
    factors,
    operationalImpact,
    recommendation,
  };
}

/* =========================================================
   WEATHER INTELLIGENCE API
========================================================= */

app.get(
  "/api/weather",
  async (req, res) => {

    try {

      const {
        lat,
        lon,
      } = req.query;

      if (!lat || !lon) {

        return res.status(400).json({
          error:
            "Latitude and longitude are required",
        });

      }

      const latitude =
        Number(lat);

      const longitude =
        Number(lon);

      if (
        Number.isNaN(latitude) ||
        Number.isNaN(longitude)
      ) {

        return res.status(400).json({
          error:
            "Invalid latitude or longitude",
        });

      }

      if (
        !WEATHER_API_KEY
      ) {

        return res.status(500).json({
          error:
            "Weather API key is not configured",
        });

      }

      const weatherUrl =
        `https://api.openweathermap.org/data/2.5/weather` +
        `?lat=${latitude}` +
        `&lon=${longitude}` +
        `&appid=${WEATHER_API_KEY}` +
        `&units=metric`;

      const response =
        await fetch(weatherUrl);

      if (!response.ok) {

        const errorData =
          await response.json();

        console.error(
          "❌ Weather API error:",
          errorData
        );

        return res.status(
          response.status
        ).json({
          error:
            "Failed to fetch weather data",
        });

      }

      const data =
        await response.json();

      const weatherRisk =
        calculateWeatherRisk({

          condition:
            data.weather?.[0]?.main,

          description:
            data.weather?.[0]?.description,

          temperature:
            data.main?.temp,

          humidity:
            data.main?.humidity,

          visibility:
            data.visibility != null
              ? data.visibility / 1000
              : null,

          windSpeed:
            data.wind?.speed,

        });

      res.json({

        location: {

          latitude,
          longitude,

          city:
            data.name ||
            "Unknown",

          country:
            data.sys?.country ||
            "",

        },

        weather: {

          condition:
            data.weather?.[0]?.main ||
            "Unknown",

          description:
            data.weather?.[0]?.description ||
            "Unknown",

          temperature:
            data.main?.temp ??
            null,

          feelsLike:
            data.main?.feels_like ??
            null,

          humidity:
            data.main?.humidity ??
            null,

          pressure:
            data.main?.pressure ??
            null,

          visibility:
            data.visibility != null
              ? data.visibility / 1000
              : null,

          windSpeed:
            data.wind?.speed ??
            null,

          windDirection:
            data.wind?.deg ??
            null,

          cloudiness:
            data.clouds?.all ??
            null,

        },

        weatherRisk,

        timestamp:
          new Date().toISOString(),

      });

    } catch (error) {

      console.error(
        "❌ Weather intelligence error:",
        error.message
      );

      res.status(500).json({
        error:
          "Weather intelligence service failed",
      });

    }

  }
);

/* =========================================================
   GPS TELEMETRY SIMULATION
========================================================= */

const telemetryState =
  new Map();

/* =========================================================
   INCIDENT DETECTOR
========================================================= */

async function detectIncident(
  vehicle
) {

  try {

    let incident = null;

    const speed =
      Number(
        vehicle.speed
      ) || 0;

    const fuelLevel =
      Number(
        vehicle.fuel_level
      ) || 0;

    const status =
      vehicle.status || "";

    /* ==============================================
       INCIDENT 1 — OVERSPEED
    ============================================== */

    if (
      speed > 80
    ) {

      incident = {

        alertType:
          "OVERSPEED",

        message:
          `Vehicle ${vehicle.vehicle_number} is overspeeding at ${speed.toFixed(1)} km/h`,

        severity:
          "HIGH",

      };

    }

    /* ==============================================
       INCIDENT 2 — LOW FUEL
    ============================================== */

    else if (
      fuelLevel < 20
    ) {

      incident = {

        alertType:
          "LOW_FUEL",

        message:
          `Vehicle ${vehicle.vehicle_number} has low fuel: ${fuelLevel.toFixed(1)}% remaining`,

        severity:
          "MEDIUM",

      };

    }

    /* ==============================================
       INCIDENT 3 — VEHICLE INACTIVE
    ============================================== */

    else if (
      status !== "ACTIVE" &&
      status !== "IDLE" &&
      status !== "MAINTENANCE"
    ) {

      incident = {

        alertType:
          "VEHICLE_INACTIVE",

        message:
          `Vehicle ${vehicle.vehicle_number} has an unexpected status: ${status}`,

        severity:
          "HIGH",

      };

    }

    if (!incident) {
      return null;
    }

    /* ==============================================
       CHECK RECENT ALERT

       Prevent the same incident from being
       recreated immediately after resolution.

       An identical alert will only be allowed
       again after 60 seconds.
    ============================================== */

    const existingAlert =
      await pool.query(
        `
        SELECT
          id,
          is_resolved,
          created_at
        FROM alerts
        WHERE
          vehicle_id = $1
          AND alert_type = $2
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '60 seconds'
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [
          vehicle.id,
          incident.alertType,
        ]
      );

    if (
      existingAlert.rows.length > 0
    ) {

      return incident;

    }

    /* ==============================================
       CREATE NEW ALERT
    ============================================== */

    await pool.query(
      `
      INSERT INTO alerts
      (
        vehicle_id,
        alert_type,
        message,
        severity,
        latitude,
        longitude,
        is_resolved,
        created_at
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        false,
        CURRENT_TIMESTAMP
      )
      `,
      [
        vehicle.id,
        incident.alertType,
        incident.message,
        incident.severity,
        vehicle.latitude,
        vehicle.longitude,
      ]
    );

    console.log(
      `🚨 INCIDENT DETECTED → ${vehicle.vehicle_number} | ${incident.alertType} | ${incident.severity}`
    );

    return incident;

  } catch (error) {

    console.error(
      "❌ Incident detector error:",
      error.message
    );

    return null;

  }

}

/* =========================================================
   RANDOM NUMBER
========================================================= */

function randomBetween(
  min,
  max
) {

  return (
    Math.random() *
      (max - min) +
    min
  );

}

/* =========================================================
   CLAMP VALUE
========================================================= */

function clamp(
  value,
  min,
  max
) {

  return Math.min(
    Math.max(
      value,
      min
    ),
    max
  );

}

/* =========================================================
   INITIALIZE TELEMETRY
========================================================= */

function initializeTelemetry(
  vehicle
) {

  if (
    vehicle.latitude === null ||
    vehicle.longitude === null
  ) {

    return;

  }

  if (
    !telemetryState.has(
      vehicle.id
    )
  ) {

    telemetryState.set(
      vehicle.id,
      {

        latitude:
          Number(
            vehicle.latitude
          ),

        longitude:
          Number(
            vehicle.longitude
          ),

        speed:
          Number(
            vehicle.speed
          ) || 0,

        heading:
          90,

      }
    );

  }

}

/* =========================================================
   SIMULATE GPS + FUEL TELEMETRY
========================================================= */

async function simulateGPSTelemetry() {

  try {

    const result =
      await pool.query(
        `
        SELECT
          id,
          vehicle_number,
          status,
          latitude,
          longitude,
          speed,
          fuel_level
        FROM vehicles
        ORDER BY id;
        `
      );

    for (
      const vehicle of result.rows
    ) {

      initializeTelemetry(
        vehicle
      );

      const state =
        telemetryState.get(
          vehicle.id
        );

      if (!state) {
        continue;
      }

      /* ============================================
         CURRENT FUEL LEVEL
      ============================================ */

      const currentFuel =
        Number(
          vehicle.fuel_level
        ) || 0;

      /* ============================================
         MAINTENANCE VEHICLES
      ============================================ */

      if (
        vehicle.status ===
        "MAINTENANCE"
      ) {

        state.speed = 0;

        await pool.query(
          `
          UPDATE vehicles
          SET
            speed = 0,
            last_updated =
              CURRENT_TIMESTAMP
          WHERE id = $1
          `,
          [
            vehicle.id,
          ]
        );

        await detectIncident({

          ...vehicle,

          speed: 0,

          fuel_level:
            currentFuel,

          latitude:
            state.latitude,

          longitude:
            state.longitude,

        });

        continue;

      }

      /* ============================================
         IDLE VEHICLES
      ============================================ */

      if (
        vehicle.status ===
        "IDLE"
      ) {

        state.speed =
          randomBetween(
            0,
            2
          );

        await pool.query(
          `
          UPDATE vehicles
          SET
            speed = $1,
            last_updated =
              CURRENT_TIMESTAMP
          WHERE id = $2
          `,
          [

            Number(
              state.speed.toFixed(
                1
              )
            ),

            vehicle.id,

          ]
        );

        await detectIncident({

          ...vehicle,

          speed:
            state.speed,

          fuel_level:
            currentFuel,

          latitude:
            state.latitude,

          longitude:
            state.longitude,

        });

        continue;

      }

      /* ============================================
         ACTIVE VEHICLES
      ============================================ */

      const speedChange =
        randomBetween(
          -5,
          5
        );

      let simulatedSpeed =
        state.speed +
        speedChange;

      /* ============================================
         OCCASIONAL OVERSPEED EVENT
         5% CHANCE
      ============================================ */

      if (
        Math.random() < 0.05
      ) {

        simulatedSpeed =
          randomBetween(
            82,
            95
          );

        console.log(
          `⚠️ Simulated overspeed event for ${vehicle.vehicle_number}`
        );

      }

      state.speed =
        clamp(
          simulatedSpeed,
          25,
          95
        );

      /* ============================================
         HEADING CHANGE

         IMPORTANT:
         Do NOT modify latitude here.

         Previous bug:
         state.latitude =
           state.heading + ...

         This corrupted GPS coordinates.

         Correct implementation only updates
         the heading value.
      ============================================ */

      const headingChange =
        randomBetween(
          -12,
          12
        );

      state.heading =
        (
          state.heading +
          headingChange +
          360
        ) % 360;

      /* ============================================
         MOVEMENT
      ============================================ */

      const movement =
        state.speed *
        0.00001;

      const headingRadians =
        state.heading *
        Math.PI /
        180;

      state.latitude +=
        Math.cos(
          headingRadians
        ) *
        movement;

      state.longitude +=
        Math.sin(
          headingRadians
        ) *
        movement;

      /* ============================================
         KEEP VEHICLES INSIDE NER
      ============================================ */

      state.latitude =
        clamp(
          state.latitude,
          NER_BOUNDS.minLatitude,
          NER_BOUNDS.maxLatitude
        );

      state.longitude =
        clamp(
          state.longitude,
          NER_BOUNDS.minLongitude,
          NER_BOUNDS.maxLongitude
        );

      /* ============================================
         FUEL INTELLIGENCE

         Fuel consumption is based on
         simulated vehicle speed.

         25–39 km/h → 0.02% + variation
         40–69 km/h → 0.03% + variation
         70+ km/h   → 0.04% + variation

         Telemetry runs every 5 seconds.
      ============================================ */

      let fuelConsumption =
        0.02;

      if (
        state.speed >= 70
      ) {

        fuelConsumption =
          0.04;

      } else if (
        state.speed >= 40
      ) {

        fuelConsumption =
          0.03;

      } else {

        fuelConsumption =
          0.02;

      }

      /* ============================================
         SMALL RANDOM FUEL VARIATION
      ============================================ */

      fuelConsumption +=
        randomBetween(
          0,
          0.01
        );

      /* ============================================
         CALCULATE NEXT FUEL LEVEL
      ============================================ */

      const nextFuel =
        Math.max(
          0,
          currentFuel -
          fuelConsumption
        );

      const roundedFuel =
        Number(
          nextFuel.toFixed(
            2
          )
        );

      /* ============================================
         LOW FUEL WARNING
      ============================================ */

      if (
        roundedFuel < 20 &&
        currentFuel >= 20
      ) {

        console.log(
          `⛽ LOW FUEL WARNING → ${vehicle.vehicle_number} | ${roundedFuel.toFixed(1)}%`
        );

      }

      /* ============================================
         UPDATE VEHICLE
      ============================================ */

      await pool.query(
        `
        UPDATE vehicles
        SET
          latitude = $1,
          longitude = $2,
          speed = $3,
          fuel_level = $4,
          last_updated =
            CURRENT_TIMESTAMP
        WHERE id = $5
        `,
        [

          Number(
            state.latitude.toFixed(
              6
            )
          ),

          Number(
            state.longitude.toFixed(
              6
            )
          ),

          Number(
            state.speed.toFixed(
              1
            )
          ),

          roundedFuel,

          vehicle.id,

        ]
      );

      /* ============================================
         INCIDENT DETECTOR
      ============================================ */

      await detectIncident({

        ...vehicle,

        latitude:
          Number(
            state.latitude.toFixed(
              6
            )
          ),

        longitude:
          Number(
            state.longitude.toFixed(
              6
            )
          ),

        speed:
          Number(
            state.speed.toFixed(
              1
            )
          ),

        fuel_level:
          roundedFuel,

      });

      /* ============================================
         INSERT GPS HISTORY
      ============================================ */

      await pool.query(
        `
        INSERT INTO gps_locations
        (
          vehicle_id,
          latitude,
          longitude,
          speed,
          heading,
          recorded_at
        )
        VALUES
        (
          $1,
          $2,
          $3,
          $4,
          $5,
          CURRENT_TIMESTAMP
        )
        `,
        [

          vehicle.id,

          Number(
            state.latitude.toFixed(
              6
            )
          ),

          Number(
            state.longitude.toFixed(
              6
            )
          ),

          Number(
            state.speed.toFixed(
              1
            )
          ),

          Number(
            state.heading.toFixed(
              1
            )
          ),

        ]
      );

      /* ============================================
         TELEMETRY CONSOLE OUTPUT
      ============================================ */

      console.log(

        `📡 NER GPS ${vehicle.vehicle_number} → ` +

        `${state.latitude.toFixed(
          5
        )}, ` +

        `${state.longitude.toFixed(
          5
        )} | ` +

        `${state.speed.toFixed(
          1
        )} km/h | ` +

        `⛽ Fuel: ${roundedFuel.toFixed(
          1
        )}%`

      );

    }

  } catch (error) {

    console.error(
      "❌ GPS telemetry error:",
      error.message
    );

  }

}

/* =========================================================
   START GPS SIMULATION
========================================================= */

function startGPSSimulation() {

  console.log(
    "📡 GPS telemetry simulation started"
  );

  console.log(
    "🌏 GPS simulation region: North Eastern India"
  );

  console.log(
    `🗺️ Bounds: ${NER_BOUNDS.minLatitude}–${NER_BOUNDS.maxLatitude} latitude, ${NER_BOUNDS.minLongitude}–${NER_BOUNDS.maxLongitude} longitude`
  );

  setInterval(
    simulateGPSTelemetry,
    5000
  );

}

/* =========================================================
   GET ALERTS
========================================================= */

app.get(
  "/api/alerts",
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            a.id,
            a.vehicle_id,
            v.vehicle_number,
            a.alert_type,
            a.message,
            a.severity,
            a.latitude,
            a.longitude,
            a.is_resolved,
            a.created_at
          FROM alerts a
          JOIN vehicles v
            ON a.vehicle_id = v.id
          ORDER BY
            a.created_at DESC;
          `
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        "❌ Get alerts error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch alerts",
      });

    }

  }
);

/* =========================================================
   RESOLVE INCIDENT
========================================================= */

app.patch(
  "/api/alerts/:alertId/resolve",
  authenticateToken,
  requireRole(
    "ADMIN",
    "AUTHORITY"
  ),
  async (req, res) => {

    try {

      const {
        alertId,
      } = req.params;

      /* ==============================================
         VALIDATE ALERT ID
      ============================================== */

      if (!alertId) {

        return res.status(400).json({
          error:
            "Alert ID is required",
        });

      }

      /* ==============================================
         CHECK ALERT
      ============================================== */

      const existingAlert =
        await pool.query(
          `
          SELECT
            id,
            vehicle_id,
            is_resolved
          FROM alerts
          WHERE id = $1
          `,
          [alertId]
        );

      if (
        existingAlert.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "Alert not found",
        });

      }

      const alert =
        existingAlert.rows[0];

      /* ==============================================
         CHECK ALREADY RESOLVED
      ============================================== */

      if (
        alert.is_resolved === true
      ) {

        return res.status(409).json({
          error:
            "Alert is already resolved",
        });

      }

      /* ==============================================
         RESOLVE ALERT
      ============================================== */

      const result =
        await pool.query(
          `
          UPDATE alerts
          SET
            is_resolved = true
          WHERE id = $1
          RETURNING
            id,
            vehicle_id,
            alert_type,
            message,
            severity,
            latitude,
            longitude,
            is_resolved,
            created_at;
          `,
          [alertId]
        );

      /* ==============================================
         SUCCESS
      ============================================== */

      console.log(
        `✅ INCIDENT RESOLVED → Alert #${alertId} by ${req.user.username}`
      );

      res.json({

        message:
          "Incident resolved successfully",

        alert:
          result.rows[0],

      });

    } catch (error) {

      console.error(
        "❌ Resolve incident error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to resolve incident",
      });

    }

  }
);

/* =========================================================
   MANUAL INCIDENT DETECTION
========================================================= */

app.post(
  "/api/detect-incidents/:vehicleId",
  async (req, res) => {

    try {

      const {
        vehicleId,
      } = req.params;

      const result =
        await pool.query(
          `
          SELECT
            id,
            vehicle_number,
            vehicle_type,
            driver_name,
            status,
            latitude,
            longitude,
            speed,
            fuel_level
          FROM vehicles
          WHERE id = $1
          `,
          [vehicleId]
        );

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({
          error:
            "Vehicle not found",
        });

      }

      const vehicle =
        result.rows[0];

      const incident =
        await detectIncident(
          vehicle
        );

      res.json({

        message:
          incident
            ? "Incident detected"
            : "No incident detected",

        incident,

      });

    } catch (error) {

      console.error(
        "❌ Manual incident detection error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to detect incident",
      });

    }

  }
);

/* =========================================================
   GET ROUTES
========================================================= */

app.get(
  "/api/routes",
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            r.id,
            r.vehicle_id,
            v.vehicle_number,
            r.route_name,
            r.start_location,
            r.destination,
            r.distance_km,
            r.estimated_time_minutes,
            r.route_status,
            r.created_at
          FROM routes r
          JOIN vehicles v
            ON r.vehicle_id = v.id
          ORDER BY r.id;
          `
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        "❌ Get routes error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch routes",
      });

    }

  }
);

/* =========================================================
   GET DRIVERS
========================================================= */

app.get(
  "/api/drivers",
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            driver_name,
            phone,
            license_number,
            experience_years,
            driver_status,
            created_at
          FROM drivers
          ORDER BY id;
          `
        );

      res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        "❌ Get drivers error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch drivers",
      });

    }

  }
);

/* =========================================================
   404 HANDLER
========================================================= */

app.use(
  (req, res) => {

    res.status(404).json({
      error:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });

  }
);

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {

    console.error(
      "❌ Server error:",
      error
    );

    res.status(500).json({
      error:
        "Internal server error",
    });

  }
);

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

  await createDemoUsers();

  /*
   * Reset demo fleet to NER coordinates
   * before GPS simulation starts.
   */
  await resetVehiclesToNER();

  app.listen(
    PORT,
    () => {

      console.log("");

      console.log(
        "=========================================="
      );

      console.log(
        "🚛 SIH26002 NER LOGISTICS INTELLIGENCE"
      );

      console.log(
        "=========================================="
      );

     app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Server running on http://localhost:${PORT}`
  );

  console.log(
    `🌐 Network access: http://172.28.186.216:${PORT}`
  );
});

      console.log(
        `🔐 Login API: http://localhost:${PORT}/api/auth/login`
      );

      console.log(
        `👥 Users API: http://localhost:${PORT}/api/users`
      );

      console.log(
        "🌏 Operational Region: NORTH EASTERN REGION"
      );

      console.log(
        "📡 GPS telemetry simulation: ACTIVE"
      );

      console.log(
        "⛽ Fuel intelligence simulation: ACTIVE"
      );

      console.log(
        "🚨 Incident detection: ACTIVE"
      );

      console.log(
        "✅ Incident resolution: ACTIVE"
      );

      console.log(
        "🗺️ NER GPS boundaries: ACTIVE"
      );

      console.log(
        "=========================================="
      );

      console.log("");

      startGPSSimulation();

    }
  );

}

startServer();