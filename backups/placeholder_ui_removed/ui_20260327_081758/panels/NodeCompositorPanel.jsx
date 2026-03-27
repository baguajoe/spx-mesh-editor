import React from "react";
import PanelShell from "./PanelShell";

export default function NodeCompositorPanel(props) {
  return (
    <PanelShell title="NodeCompositor">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire NodeCompositor into the GeoNodes workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">NodeCompositor Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
