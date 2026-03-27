import React from "react";
import PanelShell from "./PanelShell";

export default function ClothPinningPanel(props) {
  return (
    <PanelShell title="ClothPinning">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire ClothPinning into the Simulation workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">ClothPinning Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
