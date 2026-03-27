import React from "react";
import PanelShell from "./PanelShell";

export default function VertexColorPainterPanel(props) {
  return (
    <PanelShell title="VertexColorPainter">
      <div className="mesh-panel-section">
        <p className="mesh-panel-help">
          TODO: wire VertexColorPainter into the Paint workspace.
        </p>

        <div className="mesh-panel-row">
          <button type="button">VertexColorPainter Action</button>
        </div>

        <div className="mesh-panel-row">
          <label>Settings</label>
          <input type="range" min="0" max="100" defaultValue="50" />
        </div>
      </div>
    </PanelShell>
  );
}
