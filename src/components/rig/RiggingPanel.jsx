
import React, { useState } from "react";
import AutoRigPanel from "./AutoRigPanel.jsx";
import AdvancedRigPanel from "./AdvancedRigPanel.jsx";

const s = {
  overlay: { position:"fixed",inset:0,zIndex:8500,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"stretch",justifyContent:"flex-end" },
  panel: { width:480,background:"#0d1117",borderLeft:"1px solid #21262d",display:"flex",flexDirection:"column",overflow:"hidden" },
  header: { display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:"1px solid #21262d",flexShrink:0 },
  logo: { background:"#00ffc8",color:"#000",fontSize:10,fontWeight:800,padding:"2px 6px",borderRadius:4 },
  tabs: { display:"flex",gap:4,padding:"8px 12px",borderBottom:"1px solid #21262d",flexShrink:0 },
  tab: { padding:"5px 12px",borderRadius:6,border:"1px solid #21262d",background:"transparent",color:"#6b7280",fontSize:12,cursor:"pointer" },
  tabA: { padding:"5px 12px",borderRadius:6,border:"1px solid #00ffc8",background:"rgba(0,255,200,0.1)",color:"#00ffc8",fontSize:12,cursor:"pointer" },
  body: { flex:1,overflow:"auto" },
  close: { marginLeft:"auto",padding:"4px 10px",border:"1px solid #21262d",borderRadius:6,background:"transparent",color:"#6b7280",cursor:"pointer" },
};

export default function RiggingPanel({ open, onClose, sceneRef, setStatus }) {
  const [tab, setTab] = useState("auto");
  if (!open) return null;
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.panel} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <span style={s.logo}>SPX</span>
          <strong style={{color:"#e0e0e0"}}>Rigging</strong>
          <span style={{color:"#6b7280",fontSize:12}}>auto · advanced · manual</span>
          <button style={s.close} onClick={onClose}>✕</button>
        </div>
        <div style={s.tabs}>
          {[["auto","Auto Rig"],["advanced","Advanced"],["manual","Manual"]].map(([id,lbl]) => (
            <button key={id} style={tab===id?s.tabA:s.tab} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>
        <div style={s.body}>
          {tab === "auto"     && <AutoRigPanel open sceneRef={sceneRef} setStatus={setStatus} onClose={() => {}} />}
          {tab === "advanced" && <AdvancedRigPanel open sceneRef={sceneRef} setStatus={setStatus} onClose={() => {}} />}
          {tab === "manual"   && (
            <div style={{padding:20,color:"#6b7280",fontSize:13}}>
              <p style={{marginBottom:16}}>Manual rigging is done directly in the 3D viewport:</p>
              <ol style={{lineHeight:2,paddingLeft:20}}>
                <li>Switch to <strong style={{color:"#e0e0e0"}}>Rigging</strong> mode in the top bar</li>
                <li>Use <strong style={{color:"#e0e0e0"}}>Add Bone</strong> to place bones</li>
                <li>Parent bones to build the hierarchy</li>
                <li>Use <strong style={{color:"#e0e0e0"}}>Bind Mesh</strong> to attach the mesh</li>
                <li>Paint weights in <strong style={{color:"#e0e0e0"}}>Weight Paint</strong> mode</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
