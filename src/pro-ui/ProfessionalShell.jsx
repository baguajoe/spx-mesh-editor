import React from "react";
import { WORKSPACES } from "./workspaceMap";

export default function ProfessionalShell({
  activeWorkspace,
  setActiveWorkspace,
  leftPanel,
  centerPanel,
  rightPanel
}) {
  return (
    <div className="spx-shell">
      <div className="spx-menubar">
        <div className="spx-brand">SPX MESH</div>
        <div className="spx-menus">
          <span>File</span>
          <span>Edit</span>
          <span>Mesh</span>
          <span>Sculpt</span>
          <span>UV</span>
          <span>Material</span>
          <span>Rig</span>
          <span>Animate</span>
          <span>Render</span>
          <span>Window</span>
        </div>
      </div>

      <div className="spx-workspaces">
        {WORKSPACES.map((ws) => (
          <button
            key={ws}
            type="button"
            className={ws === activeWorkspace ? "spx-workspace active" : "spx-workspace"}
            onClick={() => setActiveWorkspace(ws)}
          >
            {ws}
          </button>
        ))}
      </div>

      <div className="spx-main">
        <aside className="spx-left">{leftPanel}</aside>
        <main className="spx-center">{centerPanel}</main>
        <aside className="spx-right">{rightPanel}</aside>
      </div>

      <div className="spx-statusbar">
        <span>{activeWorkspace}</span>
        <span>Viewport Ready</span>
      </div>
    </div>
  );
}
