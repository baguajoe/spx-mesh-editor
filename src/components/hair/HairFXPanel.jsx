import React, { useEffect, useMemo, useRef, useState } from "react";
import useDraggablePanel from "../../hooks/useDraggablePanel.js";
import { applyStrandLength, applyStrandWidth, applyStrandCurl } from "../../mesh/hair/GroomStrands.js";
import { findLatestHairGroup } from "../../mesh/hair/HairAdvancedEditing.js";
import { applyHairUVAtlas } from "../../mesh/hair/HairCardUV.js";
import { stackHairLayers } from "../../mesh/hair/HairLayers.js";
import { applyHairLOD } from "../../mesh/hair/HairLOD.js";
import { applyProceduralHairTexture } from "../../mesh/hair/HairProceduralTextures.js";
import { applyWetHair } from "../../mesh/hair/WetHairShader.js";
import { applyWindToHair, resolveHairClothingCollision } from "../../mesh/hair/HairWindCollision.js";
import { attachAccessoryToHair } from "../../mesh/hair/HairAccessories.js";

export default function HairFXPanel({ open = false, onClose, sceneRef = null, setStatus = null }) {
  const { beginDrag, style } = useDraggablePanel({ x: 0, y: 0 });

  const rafRef = useRef(null);
  const [strandLength, setStrandLength] = useState(1);
  const [strandWidth, setStrandWidth] = useState(1);
  const [strandCurl, setStrandCurl] = useState(0.15);
  const [uvPreset, setUvPreset] = useState("stacked");
  const [layerCount, setLayerCount] = useState(2);
  const [lodRatio, setLodRatio] = useState(1);
  const [wetness, setWetness] = useState(0.6);
  const [windStrength, setWindStrength] = useState(0.02);
  const [windRunning, setWindRunning] = useState(false);
  const [accessoryType, setAccessoryType] = useState("band");

  const latestHair = () => findLatestHairGroup(sceneRef?.current);

  useEffect(() => {
    if (!windRunning) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const tick = (t) => {
      const hair = latestHair();
      if (hair) {
        applyWindToHair(hair, { strength: windStrength, time: t });
        resolveHairClothingCollision(hair, sceneRef?.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [windRunning, windStrength]);

  const applyGroom = () => {
    const hair = latestHair();
    if (!hair) return;
    applyStrandLength(hair, strandLength);
    applyStrandWidth(hair, strandWidth);
    applyStrandCurl(hair, strandCurl);
    setStatus?.("Strand grooming applied");
  };

  const applyUVs = () => {
    const hair = latestHair();
    if (!hair) return;
    applyHairUVAtlas(hair, uvPreset);
    setStatus?.("Hair card UV preset applied");
  };

  const applyLayers = () => {
    const hair = latestHair();
    if (!hair) return;
    stackHairLayers(hair, layerCount, 0.01);
    setStatus?.("Hair layers created");
  };

  const applyLOD = () => {
    const hair = latestHair();
    if (!hair) return;
    const info = applyHairLOD(hair, lodRatio);
    setStatus?.(`Hair LOD applied (${info.visible}/${info.cards} visible)`);
  };

  const applyTexture = () => {
    const hair = latestHair();
    if (!hair) return;
    applyProceduralHairTexture(hair, {});
    setStatus?.("Procedural hair texture applied");
  };

  const applyWet = () => {
    const hair = latestHair();
    if (!hair) return;
    applyWetHair(hair, wetness);
    setStatus?.("Wet hair shader applied");
  };

  const addAccessory = () => {
    const hair = latestHair();
    if (!hair) return;
    attachAccessoryToHair(hair, accessoryType);
    setStatus?.(`Hair accessory added: ${accessoryType}`);
  };

  if (!open) return null;

  return (
    <div className="hair-fx-panel-float" style={{ ...style }}>
      <div className="hair-fx-panel">
        <div className="hair-fx-header" onMouseDown={beginDrag}>
          <div>
            <strong>Hair FX / Groom Tools</strong>
            <span className="hair-fx-sub"> strands, UVs, layers, LOD, textures, wetness, wind, collision, accessories</span>
          </div>
          <button className="hair-fx-btn" type="button" onClick={onClose}>Close</button>
        </div>

        <div className="hair-fx-grid">
          <div className="hair-fx-card">
            <div className="hair-fx-title">Strand Groom</div>
            <label className="hair-fx-field"><span>Length</span><input className="hair-fx-input" type="range" min="0.2" max="2.5" step="0.01" value={strandLength} onChange={(e)=>setStrandLength(Number(e.target.value))} /></label>
            <label className="hair-fx-field"><span>Width</span><input className="hair-fx-input" type="range" min="0.2" max="2.5" step="0.01" value={strandWidth} onChange={(e)=>setStrandWidth(Number(e.target.value))} /></label>
            <label className="hair-fx-field"><span>Curl</span><input className="hair-fx-input" type="range" min="0" max="1" step="0.01" value={strandCurl} onChange={(e)=>setStrandCurl(Number(e.target.value))} /></label>
            <button className="hair-fx-btn" type="button" onClick={applyGroom}>Apply Groom</button>
          </div>

          <div className="hair-fx-card">
            <div className="hair-fx-title">Hair Card UV</div>
            <label className="hair-fx-field">
              <span>Preset</span>
              <select className="hair-fx-input" value={uvPreset} onChange={(e)=>setUvPreset(e.target.value)}>
                <option value="stacked">stacked</option>
                <option value="left">left</option>
                <option value="right">right</option>
                <option value="top">top</option>
                <option value="bottom">bottom</option>
              </select>
            </label>
            <button className="hair-fx-btn" type="button" onClick={applyUVs}>Apply UV Preset</button>
          </div>

          <div className="hair-fx-card">
            <div className="hair-fx-title">Multi-layer Hair</div>
            <label className="hair-fx-field"><span>Layer Count</span><input className="hair-fx-input" type="range" min="1" max="5" step="1" value={layerCount} onChange={(e)=>setLayerCount(Number(e.target.value))} /></label>
            <button className="hair-fx-btn" type="button" onClick={applyLayers}>Create Layers</button>
          </div>

          <div className="hair-fx-card">
            <div className="hair-fx-title">Hair LOD</div>
            <label className="hair-fx-field"><span>LOD Ratio</span><input className="hair-fx-input" type="range" min="0.05" max="1" step="0.05" value={lodRatio} onChange={(e)=>setLodRatio(Number(e.target.value))} /></label>
            <button className="hair-fx-btn" type="button" onClick={applyLOD}>Apply LOD</button>
          </div>

          <div className="hair-fx-card">
            <div className="hair-fx-title">Procedural Texture + Wet Shader</div>
            <button className="hair-fx-btn" type="button" onClick={applyTexture}>Apply Procedural Texture</button>
            <label className="hair-fx-field"><span>Wetness</span><input className="hair-fx-input" type="range" min="0" max="1" step="0.01" value={wetness} onChange={(e)=>setWetness(Number(e.target.value))} /></label>
            <button className="hair-fx-btn" type="button" onClick={applyWet}>Apply Wet Hair</button>
          </div>

          <div className="hair-fx-card">
            <div className="hair-fx-title">Wind + Clothing Collision</div>
            <label className="hair-fx-field"><span>Wind Strength</span><input className="hair-fx-input" type="range" min="0" max="0.08" step="0.001" value={windStrength} onChange={(e)=>setWindStrength(Number(e.target.value))} /></label>
            <button className={`hair-fx-btn ${windRunning ? "is-active" : ""}`} type="button" onClick={()=>setWindRunning(v=>!v)}>
              {windRunning ? "Stop Wind" : "Run Wind"}
            </button>
          </div>

          <div className="hair-fx-card">
            <div className="hair-fx-title">Hair Accessories</div>
            <label className="hair-fx-field">
              <span>Accessory</span>
              <select className="hair-fx-input" value={accessoryType} onChange={(e)=>setAccessoryType(e.target.value)}>
                <option value="band">band</option>
                <option value="bead">bead</option>
                <option value="clip">clip</option>
              </select>
            </label>
            <button className="hair-fx-btn" type="button" onClick={addAccessory}>Add Accessory</button>
          </div>
        </div>
      </div>
    </div>
  );
}