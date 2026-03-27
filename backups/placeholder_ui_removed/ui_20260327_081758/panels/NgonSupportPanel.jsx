import React from "react";
import PanelShell from "./PanelShell";

export default function NgonSupportPanel(props) {
  return (
    <PanelShell title="NgonSupport">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire NgonSupport into the Modeling workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">NgonSupport Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
