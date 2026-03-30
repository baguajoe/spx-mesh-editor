
import React, { useState, useRef } from "react";
import * as THREE from "three";

const T={bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",teal:"#00ffc8",orange:"#FF6600",text:"#e0e0e0",muted:"#aaa",font:"JetBrains Mono,monospace"};
const S={root:{background:T.bg,color:T.text,fontFamily:T.font,padding:16,height:"100%",overflowY:"auto"},h2:{color:T.teal,fontSize:14,marginBottom:12,letterSpacing:1},h3:{color:T.orange,fontSize:12,marginBottom:8,marginTop:8},lbl:{fontSize:11,color:T.muted,display:"block",marginBottom:4},inp:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},sel:{width:"100%",background:T.panel,border:"1px solid "+T.border,color:T.text,padding:"4px 8px",borderRadius:4,fontFamily:T.font,fontSize:11,marginBottom:8,boxSizing:"border-box"},btn:{background:T.teal,color:T.bg,border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnO:{background:T.orange,color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontFamily:T.font,fontSize:12,fontWeight:700,cursor:"pointer",marginRight:8,marginBottom:8},btnSm:{background:T.panel,color:T.teal,border:"1px solid "+T.teal,borderRadius:4,padding:"3px 10px",fontFamily:T.font,fontSize:10,cursor:"pointer",marginRight:6,marginBottom:6},sec:{background:T.panel,border:"1px solid "+T.border,borderRadius:6,padding:12,marginBottom:12},stat:{fontSize:11,color:T.teal,marginBottom:4},tabs:{display:"flex",flexWrap:"wrap",gap:4,marginBottom:12},tab:(a)=>({background:a?T.teal:T.panel,color:a?T.bg:T.muted,border:"1px solid "+(a?T.teal:"#333"),borderRadius:4,padding:"4px 12px",fontFamily:T.font,fontSize:11,cursor:"pointer"}),prev:{width:"100%",height:140,borderRadius:6,border:"2px solid "+T.border,display:"block",marginBottom:8}};

const TABS=["Human Skin","Creature Skin","Makeup","Export"];

const HUMAN_PRESETS={
  "Fair Porcelain":{base:"#f5e4d3",mid:"#e8c9a8",deep:"#c8956a",lip:"#cc7788",cheek:"#ee9999",vein:"#9999cc",pore:0.3,roughness:0.5,sss:0.95},
  "Light Warm":    {base:"#f0c896",mid:"#d4a06a",deep:"#b07840",lip:"#cc6655",cheek:"#dd8888",vein:"#8899bb",pore:0.4,roughness:0.52,sss:0.9},
  "Medium Olive":  {base:"#c8955a",mid:"#a87040",deep:"#885030",lip:"#993344",cheek:"#bb6655",vein:"#7788aa",pore:0.5,roughness:0.55,sss:0.85},
  "Medium Brown":  {base:"#a06840",mid:"#805030",deep:"#603820",lip:"#882233",cheek:"#993333",vein:"#667799",pore:0.5,roughness:0.57,sss:0.82},
  "Deep Brown":    {base:"#704828",mid:"#503018",deep:"#38200c",lip:"#661122",cheek:"#772222",vein:"#556688",pore:0.55,roughness:0.6,sss:0.78},
  "Deep Ebony":    {base:"#3a2010",mid:"#28160a",deep:"#1a0c04",lip:"#551111",cheek:"#661111",vein:"#334466",pore:0.6,roughness:0.62,sss:0.75},
  "East Asian":    {base:"#f0d8b8",mid:"#d8b890",deep:"#b89068",lip:"#cc8877",cheek:"#ddaaaa",vein:"#9999cc",pore:0.35,roughness:0.5,sss:0.92},
  "South Asian":   {base:"#c8955a",mid:"#a87848",deep:"#885830",lip:"#882233",cheek:"#aa5544",vein:"#778899",pore:0.48,roughness:0.55,sss:0.84},
  "Middle Eastern":{base:"#d4a878",mid:"#b88858",deep:"#9a6840",lip:"#993344",cheek:"#bb6655",vein:"#8899aa",pore:0.45,roughness:0.53,sss:0.87},
  "Nordic":        {base:"#faeadc",mid:"#f0d0b8",deep:"#d8a888",lip:"#cc8888",cheek:"#ffaaaa",vein:"#aaaadd",pore:0.25,roughness:0.48,sss:0.97},
  "Afro-Brazilian":{base:"#8a5530",mid:"#6a3818",deep:"#4a2208",lip:"#771122",cheek:"#882222",vein:"#445566",pore:0.52,roughness:0.58,sss:0.8},
  "Mixed Ancestry":{base:"#c89060",mid:"#a07040",deep:"#785028",lip:"#883344",cheek:"#aa5555",vein:"#667788",pore:0.45,roughness:0.54,sss:0.86},
};

const CREATURE_SKINS={
  "Reptile Green":     {base:"#3a6632",mid:"#2a4a24",scale:true, scaleSize:0.8, scaleColor:"#1a3318",roughness:0.75,metalness:0.05,sheen:"#44aa44"},
  "Reptile Desert":    {base:"#c8a050",mid:"#a07838",scale:true, scaleSize:0.6, scaleColor:"#806028",roughness:0.8, metalness:0.02,sheen:"#ddbb66"},
  "Reptile Dark":      {base:"#1a1a1a",mid:"#111111",scale:true, scaleSize:0.5, scaleColor:"#050505",roughness:0.7, metalness:0.1, sheen:"#222222"},
  "Reptile Chameleon": {base:"#6a9a3a",mid:"#4a7a2a",scale:true, scaleSize:0.7, scaleColor:"#2a5a1a",roughness:0.7, metalness:0.05,sheen:"#88dd44",iridescent:true},
  "Dragon Red":        {base:"#8b1a1a",mid:"#5a0808",scale:true, scaleSize:1.2, scaleColor:"#3a0404",roughness:0.6, metalness:0.3, sheen:"#ff4400",glow:true,emissive:"#aa2200"},
  "Dragon Black":      {base:"#111118",mid:"#080810",scale:true, scaleSize:1.4, scaleColor:"#040408",roughness:0.4, metalness:0.6, sheen:"#4400ff",glow:true,emissive:"#220066"},
  "Dragon Gold":       {base:"#d4a020",mid:"#a07818",scale:true, scaleSize:1.3, scaleColor:"#785810",roughness:0.3, metalness:0.8, sheen:"#ffdd00",glow:true},
  "Dragon Ice":        {base:"#aaddff",mid:"#88bbdd",scale:true, scaleSize:1.1, scaleColor:"#5599bb",roughness:0.15,metalness:0.4, sheen:"#00ddff",glow:true,transparent:true,opacity:0.85},
  "Dragon Poison":     {base:"#2a8a2a",mid:"#1a5a1a",scale:true, scaleSize:1.0, scaleColor:"#0a3a0a",roughness:0.55,metalness:0.15,sheen:"#44ff44",glow:true,emissive:"#22aa22"},
  "Shark Skin":        {base:"#556677",mid:"#3a4a55",scale:false,scaleSize:0,   scaleColor:"#223344",roughness:0.85,metalness:0.02,sheen:"#778899"},
  "Rock Stone":        {base:"#888888",mid:"#666666",scale:false,scaleSize:0,   scaleColor:"#444444",roughness:0.98,metalness:0.0, sheen:"#999999"},
  "Volcanic Rock":     {base:"#1a1a1a",mid:"#0a0a0a",scale:false,scaleSize:0,   scaleColor:"#ff3300",roughness:0.95,metalness:0.0, sheen:"#ff2200",glow:true,emissive:"#ff1100"},
  "Sand/Desert":       {base:"#d4b87a",mid:"#b89458",scale:false,scaleSize:0,   scaleColor:"#a07840",roughness:0.99,metalness:0.0, sheen:"#ddcc88"},
  "Water Liquid":      {base:"#2244aa",mid:"#113388",scale:false,scaleSize:0,   scaleColor:"#001166",roughness:0.05,metalness:0.0, sheen:"#44aaff",transparent:true,opacity:0.7},
  "Ice Crystal":       {base:"#cceeff",mid:"#aaddff",scale:false,scaleSize:0,   scaleColor:"#88ccee",roughness:0.05,metalness:0.2, sheen:"#ffffff",transparent:true,opacity:0.75},
  "Metal Chrome":      {base:"#cccccc",mid:"#aaaaaa",scale:false,scaleSize:0,   scaleColor:"#888888",roughness:0.05,metalness:1.0, sheen:"#ffffff"},
  "Metal Rusted":      {base:"#884422",mid:"#663311",scale:false,scaleSize:0,   scaleColor:"#441100",roughness:0.95,metalness:0.6, sheen:"#cc6633"},
  "Metal Dark":        {base:"#222233",mid:"#111122",scale:false,scaleSize:0,   scaleColor:"#080812",roughness:0.3, metalness:0.9, sheen:"#4444aa"},
  "Lava Skin":         {base:"#cc3300",mid:"#882200",scale:false,scaleSize:0,   scaleColor:"#441100",roughness:0.8, metalness:0.1, sheen:"#ff6600",glow:true,emissive:"#ff2200"},
  "Obsidian":          {base:"#0a0a14",mid:"#050508",scale:false,scaleSize:0,   scaleColor:"#000004",roughness:0.1, metalness:0.7, sheen:"#6600ff"},
  "Bioluminescent":    {base:"#003322",mid:"#002218",scale:true, scaleSize:0.7, scaleColor:"#001108",roughness:0.4, metalness:0.0, sheen:"#00ffaa",glow:true,emissive:"#00ff88"},
  "Bark/Wood":         {base:"#5c3a1a",mid:"#3a2010",scale:false,scaleSize:0,   scaleColor:"#1a0c04",roughness:0.97,metalness:0.0, sheen:"#886644"},
  "Fur Dark":          {base:"#332211",mid:"#221108",scale:false,scaleSize:0,   scaleColor:"#110804",roughness:0.95,metalness:0.0, sheen:"#554433",fur:true},
  "Fur White":         {base:"#eeeeee",mid:"#dddddd",scale:false,scaleSize:0,   scaleColor:"#cccccc",roughness:0.95,metalness:0.0, sheen:"#ffffff",fur:true},
  "Demon Red":         {base:"#660000",mid:"#440000",scale:true, scaleSize:0.4, scaleColor:"#220000",roughness:0.6, metalness:0.2, sheen:"#ff0000",glow:true,emissive:"#880000"},
  "Demon Black":       {base:"#111111",mid:"#080808",scale:true, scaleSize:0.45,scaleColor:"#030303",roughness:0.5, metalness:0.4, sheen:"#9900ff",glow:true,emissive:"#440088"},
  "Undead Pale":       {base:"#c8d8c0",mid:"#a0b898",scale:false,scaleSize:0,   scaleColor:"#788870",roughness:0.7, metalness:0.0, sheen:"#aaccaa"},
  "Void/Cosmic":       {base:"#050510",mid:"#020208",scale:false,scaleSize:0,   scaleColor:"#000004",roughness:0.0, metalness:0.0, sheen:"#8844ff",glow:true,emissive:"#220066",starfield:true},
  "Crystal Gem":       {base:"#ff88cc",mid:"#dd44aa",scale:false,scaleSize:0,   scaleColor:"#aa2288",roughness:0.02,metalness:0.3, sheen:"#ffccee",transparent:true,opacity:0.8,glow:true},
  "Swamp Creature":    {base:"#3a5a22",mid:"#2a4018",scale:true, scaleSize:0.6, scaleColor:"#1a2a0a",roughness:0.88,metalness:0.0, sheen:"#557733"},
};

const MAKEUP_LAYERS=[
  {id:"foundation",label:"Foundation",default:0},
  {id:"blush",     label:"Blush",     default:0},
  {id:"contour",   label:"Contour",   default:0},
  {id:"highlight", label:"Highlight", default:0},
  {id:"eyeshadow", label:"Eye Shadow",default:0},
  {id:"eyeliner",  label:"Eyeliner",  default:0},
  {id:"lipstick",  label:"Lipstick",  default:0},
  {id:"bronzer",   label:"Bronzer",   default:0},
  {id:"freckles",  label:"Freckles",  default:0},
  {id:"warpaint",  label:"War Paint", default:0},
  {id:"runic",     label:"Runic Marks",default:0},
  {id:"tribal",    label:"Tribal Marks",default:0},
];

function generateSkinCanvas(preset,makeup,isCreature){
  const size=512,canvas=document.createElement("canvas");
  canvas.width=canvas.height=size;
  const ctx=canvas.getContext("2d");
  const p=isCreature?CREATURE_SKINS[preset]:HUMAN_PRESETS[preset];
  if(!p){ctx.fillStyle="#888";ctx.fillRect(0,0,size,size);return canvas;}
  ctx.fillStyle=p.base;ctx.fillRect(0,0,size,size);
  if(!isCreature){
    // SSS radial
    const sg=ctx.createRadialGradient(size*.5,size*.4,0,size*.5,size*.4,size*.6);
    sg.addColorStop(0,p.base+"cc");sg.addColorStop(.4,p.mid+"99");sg.addColorStop(1,p.deep+"55");
    ctx.fillStyle=sg;ctx.fillRect(0,0,size,size);
    // pore noise
    ctx.globalAlpha=p.pore*.3;
    for(let i=0;i<4000;i++){const x=Math.random()*size,y=Math.random()*size;ctx.beginPath();ctx.arc(x,y,.5+Math.random()*1.5,0,Math.PI*2);ctx.fillStyle=p.deep;ctx.fill();}
    ctx.globalAlpha=1;
    // veins
    ctx.globalAlpha=0.06;
    for(let i=0;i<8;i++){
      ctx.strokeStyle=p.vein;ctx.lineWidth=.5+Math.random();ctx.beginPath();
      let vx=Math.random()*size*.4+(i%2?size*.6:0),vy=Math.random()*size*.3;
      ctx.moveTo(vx,vy);
      for(let j=0;j<6;j++){vx+=(Math.random()-.5)*30;vy+=15+Math.random()*20;ctx.lineTo(vx,vy);}
      ctx.stroke();
    }
    ctx.globalAlpha=1;
    // makeup
    if(makeup){
      if(makeup.blush>0){
        [[size*.28,size*.52],[size*.72,size*.52]].forEach(([cx,cy])=>{
          const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,size*.18);
          bg.addColorStop(0,`rgba(220,80,80,${makeup.blush*.5})`);bg.addColorStop(1,"rgba(220,80,80,0)");
          ctx.fillStyle=bg;ctx.fillRect(0,0,size,size);
        });
      }
      if(makeup.contour>0){ctx.globalAlpha=makeup.contour*.35;ctx.fillStyle=p.deep;ctx.fillRect(0,size*.6,size*.14,size*.25);ctx.fillRect(size*.86,size*.6,size*.14,size*.25);ctx.globalAlpha=1;}
      if(makeup.highlight>0){ctx.globalAlpha=makeup.highlight*.5;ctx.fillStyle="#ffffff";ctx.fillRect(size*.3,size*.38,size*.4,size*.06);ctx.globalAlpha=1;}
      if(makeup.eyeshadow>0){
        const ec=["#6644aa","#224488","#882244","#226644","#884422"][Math.floor(makeup.eyeshadow*4.99)];
        ctx.globalAlpha=makeup.eyeshadow*.6;ctx.fillStyle=ec;
        [[size*.28,size*.35],[size*.72,size*.35]].forEach(([ex,ey])=>{ctx.beginPath();ctx.ellipse(ex,ey,size*.12,size*.05,0,0,Math.PI*2);ctx.fill();});
        ctx.globalAlpha=1;
      }
      if(makeup.eyeliner>0){ctx.globalAlpha=makeup.eyeliner*.9;ctx.strokeStyle="#111111";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(size*.18,size*.35);ctx.lineTo(size*.38,size*.34);ctx.stroke();ctx.beginPath();ctx.moveTo(size*.62,size*.34);ctx.lineTo(size*.82,size*.35);ctx.stroke();ctx.globalAlpha=1;}
      if(makeup.lipstick>0){
        const lc=["#cc4444","#aa1122","#882244","#cc6644","#dd2266"][Math.floor(makeup.lipstick*4.99)];
        ctx.globalAlpha=makeup.lipstick*.85;ctx.fillStyle=lc;ctx.beginPath();ctx.ellipse(size*.5,size*.78,size*.12,size*.035,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      }
      if(makeup.freckles>0){ctx.globalAlpha=makeup.freckles*.6;for(let i=0;i<makeup.freckles*80;i++){ctx.beginPath();ctx.arc(size*.2+Math.random()*size*.6,size*.25+Math.random()*size*.3,1+Math.random()*2,0,Math.PI*2);ctx.fillStyle=p.deep;ctx.fill();}ctx.globalAlpha=1;}
      if(makeup.warpaint>0){ctx.globalAlpha=makeup.warpaint*.85;ctx.strokeStyle="#cc2200";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(size*.15,size*.35);ctx.lineTo(size*.45,size*.45);ctx.stroke();ctx.beginPath();ctx.moveTo(size*.85,size*.35);ctx.lineTo(size*.55,size*.45);ctx.stroke();ctx.globalAlpha=1;}
      if(makeup.runic>0){ctx.globalAlpha=makeup.runic*.75;ctx.fillStyle="#00ffc8";ctx.font=`${Math.floor(size*.08)}px serif`;ctx.fillText("᚛ᚔ᚜",size*.35,size*.92);ctx.globalAlpha=1;}
      if(makeup.tribal>0){ctx.globalAlpha=makeup.tribal*.8;ctx.strokeStyle="#1a1a1a";ctx.lineWidth=2;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(size*.05,size*(.3+i*.1));ctx.quadraticCurveTo(size*.2,size*(.25+i*.1),size*.35,size*(.3+i*.1));ctx.stroke();}ctx.globalAlpha=1;}
    }
  } else {
    // Creature
    if(p.scale&&p.scaleSize>0){
      const ss=p.scaleSize*12;ctx.strokeStyle=p.scaleColor;ctx.lineWidth=0.8;
      for(let row=0;row*ss<size+ss;row++){for(let col=0;col*ss*.866<size+ss;col++){
        const cx=col*ss*.866+(row%2?ss*.433:0),cy=row*ss*.75;
        ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;ctx.lineTo(cx+Math.cos(a)*ss*.48,cy+Math.sin(a)*ss*.48);}
        ctx.closePath();ctx.fillStyle=row%3===0?p.scaleColor:p.base;ctx.fill();ctx.stroke();
      }}
    }
    if(p.fur){ctx.globalAlpha=.6;for(let i=0;i<3000;i++){const fx=Math.random()*size,fy=Math.random()*size,len=4+Math.random()*8,angle=(Math.random()-.5)*.8;ctx.strokeStyle=p.sheen;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+Math.sin(angle)*len,fy-Math.cos(angle)*len);ctx.stroke();}ctx.globalAlpha=1;}
    if(p.glow){const gg=ctx.createRadialGradient(size*.5,size*.5,0,size*.5,size*.5,size*.6);gg.addColorStop(0,(p.emissive||p.sheen)+"44");gg.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=gg;ctx.fillRect(0,0,size,size);}
    if(p.iridescent){ctx.globalAlpha=.3;const ig=ctx.createLinearGradient(0,0,size,size);ig.addColorStop(0,"#ff0088");ig.addColorStop(.33,"#00ff88");ig.addColorStop(.66,"#0088ff");ig.addColorStop(1,"#ff0088");ctx.fillStyle=ig;ctx.fillRect(0,0,size,size);ctx.globalAlpha=1;}
    if(p.starfield){for(let i=0;i<200;i++){ctx.beginPath();ctx.arc(Math.random()*size,Math.random()*size,Math.random()*1.5,0,Math.PI*2);ctx.globalAlpha=Math.random()*.8;ctx.fillStyle="#ffffff";ctx.fill();}ctx.globalAlpha=1;}
  }
  return canvas;
}

export default function CharacterSkinStudioPanel({scene}){
  const [tab,setTab]=useState("Human Skin");
  const [humanP,setHumanP]=useState("Fair Porcelain");
  const [creatureP,setCreatureP]=useState("Reptile Green");
  const [makeup,setMakeup]=useState(()=>Object.fromEntries(MAKEUP_LAYERS.map(l=>[l.id,l.default])));
  const [roughness,setRoughness]=useState(0.55);
  const [metalness,setMetalness]=useState(0.0);
  const [status,setStatus]=useState("");
  const prevRef=useRef(null);
  const isC=tab==="Creature Skin";
  const activeP=isC?creatureP:humanP;
  const presets=isC?Object.keys(CREATURE_SKINS):Object.keys(HUMAN_PRESETS);

  function updatePreview(){
    const c=generateSkinCanvas(activeP,makeup,isC);
    if(prevRef.current){const ctx=prevRef.current.getContext("2d");ctx.clearRect(0,0,prevRef.current.width,prevRef.current.height);ctx.drawImage(c,0,0,prevRef.current.width,prevRef.current.height);}
  }

  function applyToScene(){
    if(!scene){setStatus("No scene");return;}
    const c=generateSkinCanvas(activeP,makeup,isC);
    const tex=new THREE.CanvasTexture(c);
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(1,1);
    const p=isC?CREATURE_SKINS[activeP]:HUMAN_PRESETS[activeP];
    const mat=new THREE.MeshStandardMaterial({
      map:tex,color:new THREE.Color(p?.base||"#888"),
      roughness:roughness,metalness:metalness,
      transparent:p?.transparent||false,opacity:p?.opacity||1,
      emissive:p?.emissive?new THREE.Color(p.emissive):new THREE.Color(0x000000),
      emissiveIntensity:p?.glow?0.4:0,
    });
    let n=0;
    scene.traverse(o=>{if(o.isMesh){o.material=mat;o.material.needsUpdate=true;n++;}});
    setStatus(`✓ ${activeP} applied to ${n} mesh(es)`);
  }

  function downloadTexture(){
    const c=generateSkinCanvas(activeP,makeup,isC,512);
    const a=document.createElement("a");a.href=c.toDataURL("image/png");
    a.download=`spx_skin_${activeP.replace(/ /g,"_").toLowerCase()}.png`;a.click();
    setStatus("Texture downloaded");
  }

  return(
    <div style={S.root}>
      <div style={S.h2}>🧬 CHARACTER SKIN STUDIO</div>
      <div style={S.tabs}>{TABS.map(t=><button key={t} style={S.tab(tab===t)} onClick={()=>{setTab(t);setTimeout(updatePreview,0);}}>{t}</button>)}</div>

      {(tab==="Human Skin"||tab==="Creature Skin")&&<>
        <div style={S.sec}>
          <label style={S.lbl}>{isC?"Creature":"Human"} Skin Preset</label>
          <select style={S.sel} value={activeP} onChange={e=>{isC?setCreatureP(e.target.value):setHumanP(e.target.value);setTimeout(updatePreview,50);}}>
            {presets.map(p=><option key={p}>{p}</option>)}
          </select>
          <canvas ref={prevRef} width={200} height={140} style={S.prev}/>
          <button style={{...S.btnSm}} onClick={updatePreview}>👁 Preview</button>
        </div>
        <div style={S.sec}>
          <label style={S.lbl}>Roughness: {roughness.toFixed(2)}</label>
          <input style={S.inp} type="range" min={0} max={1} step={0.01} value={roughness} onChange={e=>setRoughness(+e.target.value)}/>
          <label style={S.lbl}>Metalness: {metalness.toFixed(2)}</label>
          <input style={S.inp} type="range" min={0} max={1} step={0.01} value={metalness} onChange={e=>setMetalness(+e.target.value)}/>
        </div>
      </>}

      {tab==="Makeup"&&<div style={S.sec}>
        <div style={S.h3}>Makeup & Markings</div>
        {MAKEUP_LAYERS.map(l=>(
          <div key={l.id}>
            <label style={S.lbl}>{l.label}: {(makeup[l.id]*100).toFixed(0)}%</label>
            <input style={S.inp} type="range" min={0} max={1} step={0.01} value={makeup[l.id]} onChange={e=>setMakeup(m=>({...m,[l.id]:+e.target.value}))}/>
          </div>
        ))}
        <button style={S.btnSm} onClick={()=>{setMakeup(Object.fromEntries(MAKEUP_LAYERS.map(l=>[l.id,l.default])));setStatus("Makeup cleared");}}>Clear All</button>
      </div>}

      {tab==="Export"&&<div style={S.sec}>
        <div style={S.h3}>Export Options</div>
        <div style={{fontSize:10,color:"#888",marginBottom:8,lineHeight:1.6}}>
          Exports 512×512 PNG texture map<br/>
          Ready for GLB/FBX/OBJ import<br/>
          PBR-compatible (roughness/metalness workflow)
        </div>
        <button style={S.btn} onClick={downloadTexture}>💾 Download PNG Texture</button>
      </div>}

      <button style={S.btn} onClick={applyToScene}>✓ Apply to Scene</button>
      <button style={S.btnO} onClick={downloadTexture}>💾 Download PNG</button>
      {status&&<div style={{...S.stat,marginTop:8}}>{status}</div>}
    </div>
  );
}
