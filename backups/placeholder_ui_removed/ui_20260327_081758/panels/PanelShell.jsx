import React from "react";

export default function PanelShell({ title, children }) {
  return (
    <section className="mesh-panel">
      <header className="mesh-panel-header">
        <h3 className="mesh-panel-title">{title}</h3>
      </header>
      <div className="mesh-panel-body">
        {children}
      </div>
    </section>
  );
}
