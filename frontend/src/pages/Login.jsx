import { useState } from "react";
import "./Login.css";

const API_BASE_URL = "http://localhost:5000/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("AUTHORITY");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Login failed"
        );
      }

      /*
       * Store authentication information
       *
       * This is suitable for the SIH prototype.
       * For production systems, an HttpOnly secure cookie
       * would be preferable.
       */

      localStorage.setItem(
        "sih26002_token",
        data.token
      );

      localStorage.setItem(
        "sih26002_user",
        JSON.stringify(data.user)
      );

      if (onLogin) {
        onLogin(data.user);
      }
    } catch (error) {
      console.error("Login error:", error);

      setError(
        error.message ||
          "Unable to connect to authentication server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-grid" />

      <div className="login-container">

        {/* =====================================================
            BRAND
        ====================================================== */}

        <div className="login-brand">

          <div className="login-brand-mark">
            NER
          </div>

          <div>

            <div className="login-eyebrow">
              NATIONAL EXPRESSWAY & LOGISTICS
            </div>

            <h1>
              SIH26002
            </h1>

            <p>
              Logistics Intelligence Platform
            </p>

          </div>

        </div>

        {/* =====================================================
            LOGIN CARD
        ====================================================== */}

        <div className="login-card">

          <div className="login-card-header">

            <span>
              SECURE ACCESS
            </span>

            <h2>
              OPERATIONS LOGIN
            </h2>

            <p>
              Authorized personnel only.
              Authenticate to access the
              logistics command centre.
            </p>

          </div>

          {/* ===================================================
              LOGIN FORM
          ==================================================== */}

          <form
            onSubmit={handleLogin}
            className="login-form"
          >

            {/* ROLE */}

            <div className="login-field">

              <label>
                ACCESS ROLE
              </label>

              <select
                value={role}
                onChange={(event) =>
                  setRole(event.target.value)
                }
                disabled={loading}
              >

                <option value="AUTHORITY">
                  AUTHORITY / OPERATOR
                </option>

                <option value="ADMIN">
                  SYSTEM ADMINISTRATOR
                </option>

              </select>

            </div>

            {/* USERNAME */}

            <div className="login-field">

              <label>
                USERNAME
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Enter username"
                autoComplete="username"
                disabled={loading}
                required
              />

            </div>

            {/* PASSWORD */}

            <div className="login-field">

              <label>
                PASSWORD
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter password"
                autoComplete="current-password"
                disabled={loading}
                required
              />

            </div>

            {/* ERROR */}

            {error && (
              <div className="login-error">

                <span>
                  !
                </span>

                <div>
                  {error}
                </div>

              </div>
            )}

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  ENTER COMMAND CENTRE →
                </>
              )}

            </button>

          </form>

          {/* ===================================================
              SECURITY STATUS
          ==================================================== */}

          <div className="login-security">

            <span className="login-security-dot" />

            <span>
              POSTGRESQL AUTHENTICATION
            </span>

            <span>
              SIH26002
            </span>

          </div>

        </div>

        {/* =====================================================
            DEMO CREDENTIALS
        ====================================================== */}

        <div className="login-demo">

          <div>

            <strong>
              DEMO AUTHORITY
            </strong>

            <span>
              authority / authority123
            </span>

          </div>

          <div>

            <strong>
              DEMO ADMIN
            </strong>

            <span>
              admin / admin123
            </span>

          </div>

        </div>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div className="login-footer">

          SIH26002 • NER LOGISTICS
          INTELLIGENCE PLATFORM

        </div>

      </div>
    </div>
  );
}