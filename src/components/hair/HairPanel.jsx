import React, { useMemo, useState } from "react";
import useDraggablePanel from "../../hooks/useDraggablePanel.js";
import {
  generateHairCardsGroup,
  getHairCardStats,
  exportHairCardsGLB,
  recolorHairGroup,
} from "../../mesh/hair/HairCards.js";
import { createHairCatalog } from "../../mesh/hair/HairTemplates.js";
import { chooseHeadTarget, fitHairGroupToHead } from "../../mesh/hair/HairFitting.js";

export default function HairPanel({ open = false, onClose, sceneRef = null, setStatus = null }) {
  const { beginDrag, style } = useDraggablePanel({ x: 0, y: 0 });

  const catalog = useMemo(() => createHairCatalog(), []);
  const [hairType, setHairType] = useState("fade");
  const [density, setDensity] = useState(24);
  const [length, setLength] = useState(0.7);
  const [cardWidth, setCardWidth] = useState(0.12);
  const [clump, setClump] = useState(0.2);
  const [curl, setCurl] = useState(0.15);
  const [rootColor, setRootColor] = useState("#1f1612");
  const [tipColor, setTipColor] = useState("#6b4a33");

  const findLatestHair = () => {
    let latest = null;
    sceneRef?.current?.traverse((obj) => {
      if (obj?.isGroup && (obj.name || "").toLowerCase().startsWith("hair_")) {
        latest = obj;
      }
    });
    return latest;
  };

  const addHair = () => {
    const group = generateHairCardsGroup(hairType, {
      density,
      length,
      width: cardWidth,
      clump,
      curl,
      rootColor,
      tipColor,
    });

    const head = chooseHeadTarget(sceneRef?.current);
    if (head) {
      fitHairGroupToHead(group, head, { scale: 1, yOffset: 0.05 });
    } else {
      group.position.set(0, 1.65, 0);
    }

    sceneRef?.current?.add(group);
    const stats = getHairCardStats(group);
    setStatus?.(`Hair added: ${hairType} (${stats.cards} cards)`);
  };

  const refitHair = () => {
    const hair = findLatestHair();
    const head = chooseHeadTarget(sceneRef?.current);
    if (!hair || !head) {
      setStatus?.("No hair/head target found");
      return;
    }
    fitHairGroupToHead(hair, head, { scale: 1, yOffset: 0.05 });
    setStatus?.("Hair refit to head");
  };

  const recolorHair = () => {
    const hair = findLatestHair();
    if (!hair) {
      setStatus?.("No hair found");
      return;
    }
    recolorHairGroup(hair, { rootColor, tipColor, opacity: 1 });
    setStatus?.("Hair recolored");
  };

  const exportHair = async () => {
    const hair = findLatestHair();
    if (!hair) {
      setStatus?.("No hair found");
      return;
    }

    const data = await exportHairCardsGLB(hair);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "spx-hair-cards.gltf";
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus?.("Hair GLTF exported");
  };

  const removeHair = () => {
    const hair = findLatestHair();
    if (!hair) return;
    hair.parent?.remove(hair);
    setStatus?.("Hair removed");
  };

  if (!open) return null;

  return (
    <div className="hair-panel-float" style={{ ...style }}>
      <div className="hair-panel">
        <div className="hair-panel-header" onMouseDown={beginDrag}>
          <div>
            <strong>Hair Generator</strong>
            <span className="hair-panel-sub"> cards, presets, fit, export</span>
          </div>
          <button className="hair-btn" type="button" onClick={onClose}>Close</button>
        </div>

        <div className="hair-toolbar">
          <label className="hair-field">
            <span>Style</span>
            <select className="hair-input" value={hairType} onChange={(e) => setHairType(e.target.value)}>
              {catalog.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <label className="hair-field">
            <span>Density</span>
            <input className="hair-input" type="range" min="6" max="80" step="1" value={density} onChange={(e) => setDensity(Number(e.target.value))} />
          </label>

          <label className="hair-field">
            <span>Length</span>
            <input className="hair-input" type="range" min="0.1" max="2.5" step="0.05" value={length} onChange={(e) => setLength(Number(e.target.value))} />
          </label>

          <label className="hair-field">
            <span>Width</span>
            <input className="hair-input" type="range" min="0.03" max="0.3" step="0.01" value={cardWidth} onChange={(e) => setCardWidth(Number(e.target.value))} />
          </label>

          <label className="hair-field">
            <span>Clump</span>
            <input className="hair-input" type="range" min="0" max="1" step="0.01" value={clump} onChange={(e) => setClump(Number(e.target.value))} />
          </label>

          <label className="hair-field">
            <span>Curl</span>
            <input className="hair-input" type="range" min="0" max="1" step="0.01" value={curl} onChange={(e) => setCurl(Number(e.target.value))} />
          </label>

          <label className="hair-field">
            <span>Root</span>
            <input className="hair-input hair-color" type="color" value={rootColor} onChange={(e) => setRootColor(e.target.value)} />
          </label>

          <label className="hair-field">
            <span>Tip</span>
            <input className="hair-input hair-color" type="color" value={tipColor} onChange={(e) => setTipColor(e.target.value)} />
          </label>
        </div>

        <div className="hair-card-grid">
          {catalog.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`hair-card ${hairType === item.id ? "is-active" : ""}`}
              onClick={() => setHairType(item.id)}
            >
              <div className="hair-card-thumb">{item.label}</div>
              <div className="hair-card-label">{item.label}</div>
            </button>
          ))}
        </div>

        <div className="hair-action-row">
          <button className="hair-btn" type="button" onClick={addHair}>Add Hair</button>
          <button className="hair-btn" type="button" onClick={refitHair}>Refit</button>
          <button className="hair-btn" type="button" onClick={recolorHair}>Recolor</button>
          <button className="hair-btn" type="button" onClick={exportHair}>Export GLTF</button>
          <button className="hair-btn hair-btn-danger" type="button" onClick={removeHair}>Remove</button>
        </div>
      </div>
    </div>
  );
}