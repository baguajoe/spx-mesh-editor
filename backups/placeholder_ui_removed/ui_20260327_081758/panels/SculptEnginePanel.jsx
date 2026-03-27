import React from "react";
import PanelShell from "./PanelShell";

export default function SculptEnginePanel(props) {
  return (
    <PanelShell title="SculptEngine">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire SculptEngine into the Sculpt workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">SculptEngine Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
