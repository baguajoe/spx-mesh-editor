import React from "react";
import PanelShell from "./PanelShell";

export default function ElectronBridgePanel(props) {
  return (
    <PanelShell title="ElectronBridge">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire ElectronBridge into the Layout workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">ElectronBridge Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
