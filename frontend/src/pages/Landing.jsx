import "./Landing.css";

function Landing({ onEnter }) {
  return (
    <div className="landing-page">

      {/* Background grid */}
      <div className="landing-grid" />

      {/* Glow effects */}
      <div className="landing-glow landing-glow-one" />
      <div className="landing-glow landing-glow-two" />

      {/* Top navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="logo-box">NER</div>

          <div className="logo-text">
            <strong>NER INTEL</strong>
            <span>SMART LOGISTICS</span>
          </div>
        </div>

        <div className="landing-nav-status">
          <span className="status-pulse" />
          SYSTEM ONLINE
        </div>
      </nav>

      {/* Main hero */}
      <main className="landing-hero">

        <div className="hero-left">

          <div className="hero-badge">
            <span>●</span>
            NATIONAL LOGISTICS INTELLIGENCE
          </div>

          <h1>
            NORTH EASTERN
            <br />
            <span>LOGISTICS</span>
            <br />
            INTELLIGENCE
          </h1>

          <p className="hero-description">
            AI-powered situational awareness for roads,
            vehicles, weather, incidents and accessibility
            across the North Eastern Region of India.
          </p>

          <div className="hero-actions">

            <button
              type="button"
              className="enter-command-button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                if (typeof onEnter === "function") {
                  onEnter();
                }
              }}
            >
              <span className="button-icon">→</span>

              <span>
                ENTER COMMAND CENTRE
              </span>
            </button>

            <div className="hero-live">
              <span className="status-pulse" />
              LIVE NER NETWORK
            </div>

          </div>

        </div>

        {/* Right side 3D command visualization */}
        <div className="hero-right">

          <div className="radar-system">

            <div className="radar-ring ring-one" />
            <div className="radar-ring ring-two" />
            <div className="radar-ring ring-three" />

            <div className="radar-cross horizontal" />
            <div className="radar-cross vertical" />

            <div className="radar-scan" />

            <div className="radar-core">
              <span>NER</span>
            </div>

            <div className="radar-point point-one" />
            <div className="radar-point point-two" />
            <div className="radar-point point-three" />

          </div>

          <div className="floating-card card-one">
            <span>ACTIVE VEHICLES</span>
            <strong>128</strong>
            <small>LIVE TRACKING</small>
          </div>

          <div className="floating-card card-two">
            <span>AI CONFIDENCE</span>
            <strong>91.8%</strong>
            <small>PREDICTIVE ENGINE</small>
          </div>

          <div className="floating-card card-three">
            <span>REGION COVERAGE</span>
            <strong>96.4%</strong>
            <small>08 STATES</small>
          </div>

        </div>

      </main>

      {/* Bottom information bar */}
      <footer className="landing-footer">

        <div>
          <span>ROAD NETWORK</span>
          <strong>42 CORRIDORS</strong>
        </div>

        <div>
          <span>INCIDENT MONITORING</span>
          <strong>24 × 7</strong>
        </div>

        <div>
          <span>WEATHER INTELLIGENCE</span>
          <strong>LIVE</strong>
        </div>

        <div>
          <span>AI ROUTE ENGINE</span>
          <strong>ONLINE</strong>
        </div>

      </footer>

    </div>
  );
}

export default Landing;