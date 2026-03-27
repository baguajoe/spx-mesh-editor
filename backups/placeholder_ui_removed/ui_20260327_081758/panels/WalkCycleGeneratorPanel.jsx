import React from "react";
import PanelShell from "./PanelShell";

export default function WalkCycleGeneratorPanel(props) {
  return (
    <PanelShell title="WalkCycleGenerator">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire WalkCycleGenerator into the Animate workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">WalkCycleGenerator Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
