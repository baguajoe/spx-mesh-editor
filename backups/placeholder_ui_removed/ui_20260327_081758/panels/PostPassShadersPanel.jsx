import React from "react";
import PanelShell from "./PanelShell";

export default function PostPassShadersPanel(props) {
  return (
    <PanelShell title="PostPassShaders">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire PostPassShaders into the Render workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">PostPassShaders Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
