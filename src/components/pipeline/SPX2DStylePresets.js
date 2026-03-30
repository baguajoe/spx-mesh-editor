
export const STYLE_PRESETS = {
  "Flat Orthographic":   { desc:"Direct 1:1 projection. Clean base.", headScale:1.0, limbScale:1.0, snapDeg:0, combinable:true },
  "Side Scroller":       { desc:"Locked side view. Platformer.", headScale:1.0, limbScale:1.2, snapDeg:0, combinable:true },
  "Isometric Pixel":     { desc:"2:1 iso angle. Classic pixel RPG.", headScale:1.0, limbScale:1.0, snapDeg:45, pixelGrid:4, combinable:true },
  "Classic Cartoon":     { desc:"Rubberhose limbs. Disney/Fleischer.", headScale:1.3, limbScale:1.1, snapDeg:0, combinable:true },
  "Chibi SD":            { desc:"2-head body ratio. Super-deformed.", headScale:1.8, limbScale:0.55, snapDeg:0, combinable:true },
  "Anime Standard":      { desc:"Long legs, narrow waist. Shonen.", headScale:0.85, limbScale:1.25, snapDeg:0, combinable:true },
  "Anime Action":        { desc:"Dynamic. Naruto/DBZ energy.", headScale:0.9, limbScale:1.3, snapDeg:0, combinable:true },
  "Anime Slice of Life": { desc:"Soft rounded. K-On casual.", headScale:0.95, limbScale:1.1, snapDeg:0, combinable:true },
  "Anime Mecha":         { desc:"Rigid angular. Gundam/Eva.", headScale:0.8, limbScale:1.0, snapDeg:15, combinable:false },
  "Marvel What If":      { desc:"Bold ink, flat fills, dramatic angles. Spider-Verse adjacent.", headScale:1.05, limbScale:1.15, snapDeg:5, inkOutline:true, flatColor:true, halftone:true, combinable:true },
  "Western Comic":       { desc:"Classic DC/Marvel print superhero.", headScale:0.9, limbScale:1.1, snapDeg:0, inkOutline:true, combinable:true },
  "Manga B&W":           { desc:"High contrast. Speed lines. Screen tone.", headScale:0.88, limbScale:1.2, snapDeg:0, grayscale:true, inkOutline:true, speedLines:true, combinable:true },
  "Manga Color":         { desc:"Shonen Jump color style. Bold flats.", headScale:0.88, limbScale:1.2, snapDeg:0, inkOutline:true, combinable:true },
  "Webtoon":             { desc:"Korean manhwa. Vertical scroll clean.", headScale:0.92, limbScale:1.15, snapDeg:0, combinable:true },
  "90s Saturday Morning":{ desc:"Thick outlines, limited palette. TMNT/Gargoyles era.", headScale:1.1, limbScale:1.05, snapDeg:0, inkOutline:true, limitedPalette:true, combinable:true },
  "90s Anime":           { desc:"Off-model frames, lens flare, film grain. Evangelion/Cowboy Bebop.", headScale:0.88, limbScale:1.2, snapDeg:0, filmGrain:true, lensFlare:true, combinable:true },
  "Studio Ghibli":       { desc:"Soft weight. Spirited Away feel.", headScale:1.05, limbScale:0.95, snapDeg:0, combinable:true },
  "Pixar Style":         { desc:"Exaggerated squash/stretch.", headScale:1.2, limbScale:1.05, snapDeg:0, combinable:true },
  "Spider-Verse":        { desc:"Halftone, offset frames, pop art.", headScale:1.0, limbScale:1.0, snapDeg:0, halftone:true, frameSkip:3, inkOutline:true, combinable:true },
  "Arcane Painterly":    { desc:"Textured paint. Arcane Netflix.", headScale:0.95, limbScale:1.05, snapDeg:0, painterly:true, combinable:true },
  "8-Bit Pixel":         { desc:"NES era. 8px snap grid.", headScale:1.0, limbScale:1.0, snapDeg:45, pixelGrid:8, combinable:false },
  "16-Bit Pixel":        { desc:"SNES era. 4px snap.", headScale:1.0, limbScale:1.0, snapDeg:22.5, pixelGrid:4, combinable:false },
  "Shadow Puppet":       { desc:"Single-axis silhouette. Wayang.", headScale:1.0, limbScale:1.0, snapDeg:0, silhouette:true, combinable:false },
  "Paper Cutout":        { desc:"Discrete segments. Terry Gilliam.", headScale:1.0, limbScale:1.0, snapDeg:0, cutout:true, combinable:true },
  "Noir Cinematic":      { desc:"High contrast shadow. 1940s noir.", headScale:1.0, limbScale:1.0, snapDeg:0, grayscale:true, highContrast:true, combinable:true },
  "Synthwave Retro":     { desc:"Neon glow outlines. 80s aesthetic.", headScale:1.0, limbScale:1.0, snapDeg:0, neonGlow:true, combinable:true },
  "Rotoscope Realism":   { desc:"Traced from live action. Heavy detail.", headScale:1.0, limbScale:1.0, snapDeg:0, combinable:true },
  "Storyboard Draft":    { desc:"Rough sketch thumbnail format.", headScale:1.0, limbScale:1.0, snapDeg:0, sketch:true, combinable:true },
  "Ukiyo-e Woodblock":   { desc:"Japanese woodblock print. Bold flat areas, texture lines.", headScale:1.0, limbScale:1.0, snapDeg:0, inkOutline:true, limitedPalette:true, combinable:true },
  "Art Deco":            { desc:"Geometric elegance. 1920s glamour.", headScale:1.0, limbScale:1.0, snapDeg:15, combinable:true },
};

export const STYLE_NAMES = Object.keys(STYLE_PRESETS);

export const COMBINABLE_PAIRS = [
  ["Marvel What If", "Spider-Verse"],
  ["Manga B&W", "Anime Action"],
  ["Manga Color", "Anime Standard"],
  ["90s Saturday Morning", "Classic Cartoon"],
  ["90s Anime", "Anime Action"],
  ["Western Comic", "Noir Cinematic"],
  ["Synthwave Retro", "Anime Mecha"],
  ["Arcane Painterly", "Western Comic"],
  ["Webtoon", "Anime Slice of Life"],
  ["Studio Ghibli", "Anime Slice of Life"],
  ["Flat Orthographic", "Spider-Verse"],
  ["Paper Cutout", "Ukiyo-e Woodblock"],
];

export function applyStyleTransform(kf, styleName, time=0) {
  const style = STYLE_PRESETS[styleName];
  if (!style) return kf;
  const out = {};
  const snap = (v, g) => g > 0 ? Math.round(v/g)*g : v;
  Object.entries(kf).forEach(([b, v]) => {
    let x = v.x, y = v.y, rot = v.rotation || 0, sc = v.scale || 1;
    const isHead = b==="head"||b==="neck";
    const isLeg  = b.includes("thigh")||b.includes("shin")||b.includes("foot");
    const isArm  = b.includes("arm")||b.includes("hand")||b.includes("shoulder");
    // head/limb scale
    if (isHead) sc *= style.headScale || 1;
    if (isLeg)  sc *= style.limbScale || 1;
    if (isArm)  sc *= (style.limbScale || 1) * 0.9;
    // snap
    if (style.snapDeg) rot = snap(rot, style.snapDeg);
    if (style.pixelGrid) { x = snap(x, style.pixelGrid); y = snap(y, style.pixelGrid); }
    // style specifics
    if (styleName === "Side Scroller")    { x = x*0.5+160; rot *= 1.4; }
    if (styleName === "Isometric Pixel")  { x = x*Math.cos(Math.PI/6); y = y*0.5+x*0.289; }
    if (styleName === "Classic Cartoon")  { y += b==="hips"?Math.abs(Math.sin(time*Math.PI*2))*8:0; rot*=1.1; }
    if (styleName === "Chibi SD")         { if(isLeg) y*=0.55; }
    if (styleName === "Anime Action")     { x+=Math.sin(time*30)*0.3; rot*=1.3; }
    if (styleName === "Anime Standard")   { if(isLeg) y*=1.25; rot*=0.9; }
    if (styleName === "Marvel What If")   { rot=snap(rot,5); if(isArm)sc*=1.1; }
    if (styleName === "Spider-Verse")     { if(Math.floor(time*12)%3===0){x+=2;y+=1;} }
    if (styleName === "90s Anime")        { x+=Math.sin(time*20)*1.5; }
    if (styleName === "Studio Ghibli")    { y+=b==="chest"||b==="spine"?Math.sin(time*1.5)*1.5:0; rot*=0.8; }
    if (styleName === "Pixar Style")      { const sq=1+Math.sin(time*6)*0.04; sc*=sq; }
    if (styleName === "Manga B&W" || styleName === "Manga Color") { if(isLeg)sc*=1.1; }
    if (styleName === "Shadow Puppet")    { x=320; }
    if (styleName === "90s Saturday Morning") { rot=snap(rot,3); }
    out[b] = { x, y, rotation: rot, scale: sc };
  });
  return out;
}

export function blendStyles(kfA, kfB, alpha=0.5) {
  const out = {};
  const bones = new Set([...Object.keys(kfA), ...Object.keys(kfB)]);
  bones.forEach(b => {
    const a = kfA[b] || { x:320, y:240, rotation:0, scale:1 };
    const bv = kfB[b] || { x:320, y:240, rotation:0, scale:1 };
    out[b] = {
      x:        a.x        + (bv.x        - a.x)        * alpha,
      y:        a.y        + (bv.y        - a.y)        * alpha,
      rotation: a.rotation + (bv.rotation - a.rotation) * alpha,
      scale:    a.scale    + (bv.scale    - a.scale)    * alpha,
    };
  });
  return out;
}

export default STYLE_PRESETS;
