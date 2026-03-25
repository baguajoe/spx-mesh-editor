
import { useState } from "react";

const C = {
  bg:     "#0d1117",
  border: "#21262d",
  teal:   "#00ffc8",
  orange: "#FF6600",
};

export function MeshEditorPanel({
  stats, history, selectedFaces, loopCutT, setLoopCutT,
  wireframe, onAddPrimitive, onLoopCut, onKnife, onEdgeSlide,
  onSubdivide, onExtrude, onMerge, onUndo, onExportGLB,
  onImportGLB, onSendToStreamPireX, knifePoints, slideAmount,
  selectedVerts, selectedEdges,
  onMirror, onBevel, onInset,
  bevelAmt=0.1, setBevelAmt=()=>{}, insetAmt=0.15, setInsetAmt=()=>{},
  mirrorAxis='x', setMirrorAxis=()=>{},
  onBoolean=()=>{}, booleanMode='union', setBooleanMode=()=>{},
  onUVUnwrap=()=>{}, onOpenUVEditor=()=>{},
  uvProjection='box', setUVProjection=()=>{},
  onOpenMatEditor=()=>{}, onRenderToImage=()=>{}, onPushToStreamPireX=()=>{},
  propEdit=false, setPropEdit=()=>{}, propRadius=1, setPropRadius=()=>{},
  propFalloff='smooth', setPropFalloff=()=>{},
  snapEnabled=false, setSnapEnabled=()=>{}, snapSize=0.25, setSnapSize=()=>{},
}) {
  const [extrudeAmt, setExtrudeAmt] = useState(0.3);
  const [sendStatus, setSendStatus] = useState(null);
  const [activeSection, setActiveSection] = useState("primitives");

  const Section = ({id, label, color, children}) => (
    <div style={{borderBottom:`1px solid ${C.border}`}}>
      <button onClick={()=>setActiveSection(s=>s===id?null:id)}
        style={{width:"100%",background:"none",border:"none",cursor:"pointer",
          padding:"8px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:color||C.orange,fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>
          {label}
        </span>
        <span style={{color:"#444",fontSize:10}}>{activeSection===id?"▲":"▼"}</span>
      </button>
      {activeSection===id && <div style={{padding:"0 10px 10px"}}>{children}</div>}
    </div>
  );

  const Btn = ({onClick,children,color,disabled,style={}}) => (
    <button onClick={onClick} disabled={disabled}
      style={{width:"100%",background:disabled?"#1a1a1a":color||C.orange,
        border:`1px solid ${disabled?"#222":color||C.orange}`,
        color:disabled?"#333":"#fff",borderRadius:4,padding:"6px",
        cursor:disabled?"not-allowed":"pointer",fontWeight:700,fontSize:11,
        marginBottom:4,...style}}>
      {children}
    </button>
  );

  const handleSendToStreamPireX = () => {
    onSendToStreamPireX?.();
    setSendStatus("sent");
    setTimeout(()=>setSendStatus(null), 3000);
  };

  return (
    <div style={{width:230,background:C.bg,borderLeft:`1px solid ${C.border}`,
      display:"flex",flexDirection:"column",overflowY:"auto",flexShrink:0,
      fontFamily:"JetBrains Mono,monospace",fontSize:12}}>

      <Section id="primitives" label="Add Primitive" color={C.teal}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          {["box","sphere","cylinder","torus","plane","icosphere"].map(p=>(
            <button key={p} onClick={()=>onAddPrimitive(p)}
              style={{padding:"6px 4px",border:`1px solid ${C.border}`,borderRadius:4,
                cursor:"pointer",fontSize:10,background:"#1a1f2e",color:"#aaa",
                textTransform:"capitalize"}}>
              {p}
            </button>
          ))}
        </div>
      </Section>

      <Section id="loop_cut" label="Loop Cut (Ctrl+R)" color={C.orange}>
        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
          <span style={{color:"#666",fontSize:10,width:8}}>t</span>
          <input type="range" min={0.05} max={0.95} step={0.01} value={loopCutT}
            onChange={e=>setLoopCutT(Number(e.target.value))} style={{flex:1}}/>
          <span style={{color:C.teal,fontSize:10,width:28}}>{loopCutT.toFixed(2)}</span>
        </div>
        <Btn onClick={onLoopCut}>⊞ Apply Loop Cut</Btn>
      </Section>

      <Section id="knife" label="Knife (K)" color={C.orange}>
        <div style={{color:"#555",fontSize:9,marginBottom:6,lineHeight:1.5}}>
          Press K → click points → Enter to cut · Esc cancel
        </div>
        <div style={{display:"flex",gap:4}}>
          <Btn onClick={onKnife} style={{marginBottom:0}}>✂ Activate</Btn>
        </div>
        {knifePoints > 0 && (
          <div style={{marginTop:4,color:C.teal,fontSize:9}}>{knifePoints} point(s) placed</div>
        )}
      </Section>

      <Section id="edge_slide" label="Edge Slide (G+G)" color={C.orange}>
        <div style={{color:"#555",fontSize:9,marginBottom:6,lineHeight:1.5}}>
          Select edge (mode 2) → G+G or click below
        </div>
        <Btn onClick={onEdgeSlide}>⇔ Start Edge Slide</Btn>
        {slideAmount !== 0 && (
          <div style={{color:C.teal,fontSize:9}}>Amount: {slideAmount.toFixed(3)}</div>
        )}
      </Section>

      <Section id="modifiers" label="Modifiers" color={C.teal}>
        <Btn onClick={onSubdivide} color={C.teal} style={{color:C.bg}}>◈ Subdivide Surface</Btn>

        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
          <span style={{color:"#666",fontSize:10,width:50}}>Extrude</span>
          <input type="range" min={0.05} max={2} step={0.05} value={extrudeAmt}
            onChange={e=>setExtrudeAmt(Number(e.target.value))} style={{flex:1}}/>
          <span style={{color:C.teal,fontSize:9,width:28}}>{extrudeAmt.toFixed(2)}</span>
        </div>
        <Btn onClick={()=>onExtrude(extrudeAmt)} disabled={selectedFaces===0}>
          ⬡ Extrude Faces ({selectedFaces})
        </Btn>

        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:6,marginTop:4}}>
          <div style={{color:"#666",fontSize:9,marginBottom:4}}>Mirror</div>
          <div style={{display:"flex",gap:3,marginBottom:4}}>
            {["x","y","z"].map(ax=>(
              <button key={ax} onClick={()=>setMirrorAxis(ax)}
                style={{flex:1,padding:"3px",border:"none",borderRadius:3,cursor:"pointer",fontSize:10,
                  background:mirrorAxis===ax?C.orange:"#1a1f2e",
                  color:mirrorAxis===ax?"#fff":"#888",fontWeight:700,textTransform:"uppercase"}}>
                {ax}
              </button>
            ))}
          </div>
          <Btn onClick={()=>onMirror(mirrorAxis)}>⬡ Apply Mirror</Btn>
        </div>

        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:6,marginTop:4}}>
          <div style={{color:"#666",fontSize:9,marginBottom:4}}>Bevel</div>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
            <input type="range" min={0.01} max={0.5} step={0.01} value={bevelAmt}
              onChange={e=>setBevelAmt(Number(e.target.value))} style={{flex:1}}/>
            <span style={{color:C.teal,fontSize:9,width:28}}>{bevelAmt.toFixed(2)}</span>
          </div>
          <Btn onClick={()=>onBevel(bevelAmt)}>◻ Bevel Edges</Btn>
        </div>

        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:6,marginTop:4}}>
          <div style={{color:"#666",fontSize:9,marginBottom:4}}>Inset Faces</div>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
            <input type="range" min={0.01} max={0.5} step={0.01} value={insetAmt}
              onChange={e=>setInsetAmt(Number(e.target.value))} style={{flex:1}}/>
            <span style={{color:C.teal,fontSize:9,width:28}}>{insetAmt.toFixed(2)}</span>
          </div>
          <Btn onClick={()=>onInset(insetAmt)} disabled={selectedFaces===0}>
            ⊡ Inset Faces ({selectedFaces})
          </Btn>
        </div>

        <Btn onClick={onMerge} color="#445566">⊕ Merge by Distance</Btn>
      </Section>

      <Section id="selection" label="Selection" color="#888">
        <div style={{display:"flex",flexDirection:"column",gap:3}}>
          {[["Vertices",selectedVerts],["Edges",selectedEdges],["Faces",selectedFaces]].map(([lbl,count])=>(
            <div key={lbl} style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{color:"#555",fontSize:10}}>{lbl}</span>
              <span style={{color:count>0?C.teal:"#333",fontSize:10,fontWeight:700}}>{count}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="mesh" label="Mesh Stats" color="#888">
        {[["Vertices",stats.vertices],["Edges",stats.edges],["Faces",stats.faces],["Half-edges",stats.halfEdges]].map(([lbl,val])=>(
          <div key={lbl} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{color:"#555",fontSize:10}}>{lbl}</span>
            <span style={{color:C.teal,fontSize:10,fontWeight:700}}>{val||0}</span>
          </div>
        ))}
        <button onClick={onUndo} disabled={history===0}
          style={{marginTop:8,width:"100%",background:"none",
            border:`1px solid ${history>0?C.border:"#1a1a1a"}`,
            color:history>0?"#aaa":"#333",borderRadius:3,padding:"4px",
            cursor:history>0?"pointer":"not-allowed",fontSize:10}}>
          ↩ Undo ({history})
        </button>
      </Section>


      <Section id="boolean" label="Boolean Ops" color="#8844ff">
        <div style={{color:"#555",fontSize:9,marginBottom:6,lineHeight:1.5}}>
          Click once to add a second mesh, click again to apply.
        </div>
        <div style={{display:"flex",gap:3,marginBottom:6}}>
          {["union","subtract","intersect"].map(m=>(
            <button key={m} onClick={()=>setBooleanMode(m)}
              style={{flex:1,padding:"4px 2px",border:"none",borderRadius:3,cursor:"pointer",
                fontSize:9,fontWeight:700,textTransform:"uppercase",
                background:booleanMode===m?"#8844ff":"#1a1f2e",
                color:booleanMode===m?"#fff":"#666"}}>
              {m==="union"?"∪":m==="subtract"?"−":"∩"} {m}
            </button>
          ))}
        </div>
        <Btn onClick={()=>onBoolean(booleanMode)} color="#8844ff">
          ⬡ Apply {booleanMode.charAt(0).toUpperCase()+booleanMode.slice(1)}
        </Btn>
      </Section>

      <Section id="uv" label="UV Unwrap" color="#44aaff">
        <div style={{color:"#555",fontSize:9,marginBottom:6,lineHeight:1.5}}>
          Project UVs for texturing. Open editor to view UV islands.
        </div>
        <div style={{display:"flex",gap:3,marginBottom:6}}>
          {["box","sphere","planar"].map(p=>(
            <button key={p} onClick={()=>setUVProjection(p)}
              style={{flex:1,padding:"4px 2px",border:"none",borderRadius:3,cursor:"pointer",
                fontSize:9,fontWeight:700,textTransform:"uppercase",
                background:uvProjection===p?"#44aaff":"#1a1f2e",
                color:uvProjection===p?"#fff":"#666"}}>
              {p}
            </button>
          ))}
        </div>
        <Btn onClick={()=>onUVUnwrap(uvProjection)} color="#44aaff">
          ⬡ Apply UV Projection
        </Btn>
        <Btn onClick={onOpenUVEditor} color="#225588">
          🗺 Open UV Editor
        </Btn>
      </Section>

      <Section id="material" label="Material" color="#FF6600">
        <div style={{color:"#555",fontSize:9,marginBottom:6}}>
          Edit color, roughness, metalness, emissive and texture maps.
        </div>
        <Btn onClick={onOpenMatEditor} color="#FF6600">
          🎨 Open Material Editor
        </Btn>
      </Section>

      <Section id="proportional" label="Proportional Edit" color="#44aaff">
        <label style={{display:"flex",gap:8,alignItems:"center",cursor:"pointer",marginBottom:6}}>
          <input type="checkbox" checked={propEdit} onChange={e=>setPropEdit(e.target.checked)}/>
          <span style={{color:"#dde6ef",fontSize:11}}>Enable (O)</span>
        </label>
        {propEdit && <>
          <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
            <span style={{color:"#666",fontSize:10,width:52}}>Radius</span>
            <input type="range" min={0.1} max={5} step={0.1} value={propRadius}
              onChange={e=>setPropRadius(Number(e.target.value))} style={{flex:1}}/>
            <span style={{color:"#44aaff",fontSize:9,width:24}}>{propRadius.toFixed(1)}</span>
          </div>
          <div style={{display:"flex",gap:3}}>
            {["smooth","linear","sharp"].map(f=>(
              <button key={f} onClick={()=>setPropFalloff(f)}
                style={{flex:1,padding:"3px",border:"none",borderRadius:3,cursor:"pointer",
                  fontSize:9,fontWeight:700,
                  background:propFalloff===f?"#44aaff":"#1a1f2e",
                  color:propFalloff===f?"#fff":"#666"}}>
                {f}
              </button>
            ))}
          </div>
        </>}
        <div style={{marginTop:8}}>
          <label style={{display:"flex",gap:8,alignItems:"center",cursor:"pointer",marginBottom:4}}>
            <input type="checkbox" checked={snapEnabled} onChange={e=>setSnapEnabled(e.target.checked)}/>
            <span style={{color:"#dde6ef",fontSize:11}}>Snap to Grid</span>
          </label>
          {snapEnabled && (
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{color:"#666",fontSize:10,width:52}}>Size</span>
              <input type="range" min={0.05} max={1} step={0.05} value={snapSize}
                onChange={e=>setSnapSize(Number(e.target.value))} style={{flex:1}}/>
              <span style={{color:"#FF6600",fontSize:9,width:24}}>{snapSize.toFixed(2)}</span>
            </div>
          )}
        </div>
      </Section>
      <Section id="export" label="Export & Pipeline" color={C.teal}>
        <Btn onClick={onExportGLB} color={C.teal} style={{color:C.bg}}>
          💾 Export GLB
        </Btn>
        <Btn onClick={()=>document.getElementById("glb-import-input")?.click()} color="#334455">
          📦 Import GLB/OBJ
        </Btn>
        <Btn onClick={onRenderToImage} color="#334455">
          📷 Render to PNG
        </Btn>
        <Btn onClick={onPushToStreamPireX} color="#00ffc8" style={{color:"#06060f"}}>
          → Push to StreamPireX
        </Btn>

        {/* StreamPireX bridge */}
        <div style={{marginTop:8,padding:"8px",background:"#06060f",borderRadius:4,
          border:`1px solid ${C.teal}22`}}>
          <div style={{color:C.teal,fontSize:9,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>
            StreamPireX Bridge
          </div>
          <div style={{color:"#444",fontSize:9,marginBottom:6,lineHeight:1.5}}>
            Send edited mesh directly to the Node Compositor 3D viewport.
          </div>
          <button onClick={handleSendToStreamPireX}
            style={{width:"100%",background:sendStatus==="sent"?C.teal:C.orange,
              border:"none",color:sendStatus==="sent"?C.bg:"#fff",
              borderRadius:4,padding:"8px",cursor:"pointer",fontWeight:700,fontSize:12}}>
            {sendStatus==="sent" ? "✓ Sent to StreamPireX!" : "→ Send to Node Compositor"}
          </button>
          {sendStatus==="sent" && (
            <div style={{color:C.teal,fontSize:9,marginTop:4,textAlign:"center"}}>
              Open StreamPireX → Node Compositor → Import from Mesh Editor
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
