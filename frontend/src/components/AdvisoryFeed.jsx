function AdvisoryFeed({ advisories }) {
  return (
    <div className="panel advisory-panel">
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">Crew advisory</p>
          <h2>Live advisory feed</h2>
        </div>
      </div>
      <ul className="feed-list">
        {advisories && advisories.length > 0 ? advisories.map((item, index) => (
          <li key={`${item.type}-${index}`} className={`feed-item ${item.severity}`}>
            <div className="feed-pill">{item.severity}</div>
            <div>
              <p>{item.message}</p>
              <span>{item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Live'}</span>
            </div>
          </li>
        )) : (
          <li className="feed-item info">
            <div className="feed-pill">info</div>
            <div>
              <p>The current scenario is nominal. No crew actions are required.</p>
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}

export default AdvisoryFeed;
