import { useMemo } from 'react';

function TopBar({ scenario, onRun, loading }) {
  const badgeText = useMemo(() => (loading ? 'Running simulation' : 'Simulation Mode'), [loading]);
  const altitudeLabel = `${Math.round((scenario?.cruise_altitude_ft || 0) / 100)} FL`;
  const routeLabel = `${Number(scenario?.route_distance_nm || 0).toLocaleString()} nm`;

  return (
    <header className="topbar">
      <div className="brand-block">
        <p className="eyebrow">AeroSense Edge • Virtual POC</p>
        <h1>Operational fuel and advisory simulation</h1>
        <p className="subtext">Live OpenAP physics, LightGBM prediction, and crew-ready advisories.</p>
        <div className="topbar-meta">
          <span>{routeLabel}</span>
          <span>{altitudeLabel}</span>
          <span>{scenario?.degraded_engine ? 'Degraded engine' : 'Nominal engine'}</span>
        </div>
      </div>
      <div className="topbar-actions">
        <span className={`mode-badge ${loading ? 'loading' : ''}`}>
          <span className="dot" />
          {badgeText}
        </span>
        <button onClick={onRun} disabled={loading}>
          {loading ? 'Running…' : 'Run Simulation'}
        </button>
      </div>
    </header>
  );
}

export default TopBar;
