import React, { useState } from "react";

function fireShortcut(key, shift = true) {
  const evt = new KeyboardEvent("keydown", {
    key,
    shiftKey: shift,
    bubbles: true,
  });
  window.dispatchEvent(evt);
}

const TOOLS = [
  { id: "uv", label: "UV", kind: "shortcut", key: "u", hint: "Shift+U" },
  { id: "materials", label: "Materials", kind: "shortcut", key: "m", hint: "Shift+M" },
  { id: "paint", label: "Paint", kind: "shortcut", key: "p", hint: "Shift+P" },
  { id: "clothing", label: "Clothing", kind: "shortcut", key: "g", hint: "Shift+G" },
  { id: "pattern", label: "Pattern", kind: "shortcut", key: "d", hint: "Shift+D" },
  { id: "hair", label: "Hair", kind: "shortcut", key: "h", hint: "Shift+H" },
  { id: "hair_adv", label: "Hair+", kind: "shortcut", key: "j", hint: "Shift+J" },
  { id: "hair_fx", label: "Hair FX", kind: "shortcut", key: "k", hint: "Shift+K" },
  { id: "autorig", label: "Auto Rig", kind: "shortcut", key: "r", hint: "Shift+R" },
  { id: "advanced_rig", label: "Adv Rig", kind: "shortcut", key: "y", hint: "Shift+Y" },
  { id: "render", label: "Render", kind: "workspace", mode: "rendering", hint: "Render WS" },
];

export default function WorkspaceToolsDock() {
  const [activeTool, setActiveTool] = useState(null);

  const handleOpen = (tool) => {
    setActiveTool(tool.id);

    if (tool.kind === "shortcut") {
      fireShortcut(tool.key, true);
      return;
    }

    if (tool.kind === "workspace") {
      window.dispatchEvent(
        new CustomEvent("spx:setWorkspaceMode", { detail: { mode: tool.mode } })
      );
    }
  };

  return (
    <div className="workspace-tools-strip">
      <div className="workspace-tools-strip-inner">
        <div className="workspace-tools-tabs">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              className={`workspace-tab-btn ${activeTool === tool.id ? "is-active" : ""}`}
              title={tool.hint}
              onClick={() => handleOpen(tool)}
            >
              <span className="workspace-tab-label">{tool.label}</span>
              <span className="workspace-tab-hint">{tool.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
