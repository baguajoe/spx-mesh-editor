import React from "react";
import PanelShell from "./PanelShell";

export default function HairGroomingPanel(props) {
  return (
    <PanelShell title="HairGrooming">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire HairGrooming into the Hair workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">HairGrooming Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
