import React from "react";
import PanelShell from "./PanelShell";

export default function DoppelflexRigPanel(props) {
  return (
    <PanelShell title="DoppelflexRig">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire DoppelflexRig into the Rig workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">DoppelflexRig Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
