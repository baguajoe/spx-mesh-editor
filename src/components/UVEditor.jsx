
import { useEffect, useRef, useState } from "react";

const C = { bg:"#06060f", panel:"#0d1117", border:"#21262d", teal:"#00ffc8", orange:"#FF6600" };

export function UVEditor({ uvTriangles=[], width=300, height=300, onClose }) {
  const canvasRef = useRef(null);
  const [zoom,    setZoom]    = useState(1);
  const [hovTri,  setHovTri]  = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx    = canvas.getContext("2d");
    const W=canvas.width, H=canvas.height;

    ctx.fillStyle = C.bg;
    ctx.fillRect(0,0,W,H);

    // Grid
    ctx.strokeStyle = C.border;
    ctx.lineWidth   = 0.5;
    for (let i=0;i<=10;i++) {
      const x=i/10*W, y=i/10*H;
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    }

    // UV border
    ctx.strokeStyle = "#333";
    ctx.lineWidth   = 1;
    ctx.strokeRect(0,0,W,H);

    // Draw UV triangles
    uvTriangles.forEach((tri, i) => {
      const isHov = i === hovTri;
      ctx.beginPath();
      ctx.moveTo(tri[0].u*W*zoom, (1-tri[0].v)*H*zoom);
      ctx.lineTo(tri[1].u*W*zoom, (1-tri[1].v)*H*zoom);
      ctx.lineTo(tri[2].u*W*zoom, (1-tri[2].v)*H*zoom);
      ctx.closePath();
      ctx.fillStyle   = isHov ? "rgba(0,255,200,0.15)" : "rgba(255,102,0,0.05)";
      ctx.strokeStyle = isHov ? C.teal : C.orange;
      ctx.lineWidth   = isHov ? 1.5 : 0.5;
      ctx.fill();
      ctx.stroke();
    });

    // UV vert dots
    const seen = new Set();
    uvTriangles.forEach(tri => {
      tri.forEach(pt => {
        const key = `${pt.u.toFixed(3)}_${pt.v.toFixed(3)}`;
        if (seen.has(key)) return;
        seen.add(key);
        ctx.beginPath();
        ctx.arc(pt.u*W*zoom, (1-pt.v)*H*zoom, 2, 0, Math.PI*2);
        ctx.fillStyle = C.teal;
        ctx.fill();
      });
    });
  }, [uvTriangles, zoom, hovTri]);

  const onMouseMove = (e) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mu = (e.clientX-rect.left)/(rect.width*zoom);
    const mv = 1-(e.clientY-rect.top)/(rect.height*zoom);
    // Find closest triangle
    let closest=null, minDist=Infinity;
    uvTriangles.forEach((tri,i) => {
      const cu=(tri[0].u+tri[1].u+tri[2].u)/3;
      const cv=(tri[0].v+tri[1].v+tri[2].v)/3;
      const d=Math.hypot(mu-cu,mv-cv);
      if(d<minDist){minDist=d;closest=i;}
    });
    setHovTri(closest);
  };

  return (
    <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
      background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,zIndex:9999,
      display:"flex",flexDirection:"column",fontFamily:"JetBrains Mono,monospace"}}>

      {/* Header */}
      <div style={{height:40,background:"#0a0e1a",borderBottom:`1px solid ${C.border}`,
        display:"flex",alignItems:"center",gap:12,padding:"0 14px",borderRadius:"8px 8px 0 0"}}>
        <span style={{color:C.teal,fontSize:12,fontWeight:700}}>UV Editor</span>
        <span style={{color:"#555",fontSize:10}}>{uvTriangles.length} triangles</span>
        <div style={{flex:1}}/>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <span style={{color:"#666",fontSize:10}}>Zoom</span>
          <input type="range" min={0.5} max={3} step={0.1} value={zoom}
            onChange={e=>setZoom(Number(e.target.value))} style={{width:80}}/>
          <span style={{color:C.teal,fontSize:10,width:24}}>{zoom.toFixed(1)}x</span>
        </div>
        <button onClick={onClose}
          style={{background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:18}}>✕</button>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} width={width} height={height}
        style={{display:"block",cursor:"crosshair"}}
        onMouseMove={onMouseMove} onMouseLeave={()=>setHovTri(null)}/>

      {/* Footer */}
      <div style={{padding:"6px 14px",borderTop:`1px solid ${C.border}`,
        display:"flex",gap:12,alignItems:"center"}}>
        <span style={{color:"#555",fontSize:9}}>Hover triangle to highlight · UV space 0-1</span>
        {hovTri!==null && (
          <span style={{color:C.orange,fontSize:9}}>Triangle {hovTri}</span>
        )}
      </div>
    </div>
  );
}
