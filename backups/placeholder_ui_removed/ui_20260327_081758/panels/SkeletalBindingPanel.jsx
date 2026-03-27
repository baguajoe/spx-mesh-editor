import React from "react";
import PanelShell from "./PanelShell";

export default function SkeletalBindingPanel(props) {
  return (
    <PanelShell title="SkeletalBinding">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire SkeletalBinding into the Rig workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">SkeletalBinding Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
