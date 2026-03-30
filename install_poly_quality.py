#!/usr/bin/env python3
# Poly Quality System — patches all generators with Low/Mid/High/Ultra toggle
# python3 install_poly_quality.py && npm run build && git add -A && git commit -m "feat: poly quality system — Low/Mid/High/Ultra across all generators" && git push
import os, glob

REPO = "/workspaces/spx-mesh-editor"
P    = f"{REPO}/src/components/panels"

# ── 1. Write the shared PolyQuality utility ───────────────────────────────────
UTIL_PATH = f"{REPO}/src/components/panels/PolyQualityUtil.js"
os.makedirs(P, exist_ok=True)

with open(UTIL_PATH, "w") as f:
    f.write(r"""
/**
 * SPX Poly Quality System
 * Provides geometry segment counts for Low / Mid / High / Ultra quality levels.
 * Import and use Q(quality) wherever you build THREE.js geometry.
 *
 * Usage:
 *   import { Q, QUALITY_LEVELS, PolyQualityBar } from './PolyQualityUtil';
 *   const segs = Q(quality);
 *   new THREE.SphereGeometry(r, segs.sphere, segs.sphereH)
 *   new THREE.CylinderGeometry(rt, rb, h, segs.cylinder)
 *   new THREE.BoxGeometry(w, h, d, segs.box, segs.box, segs.box)
 */

export const QUALITY_LEVELS = ["Low", "Mid", "High", "Ultra"];

export const QUALITY_PRESETS = {
  Low: {
    sphere:      6,  sphereH:  4,
    cylinder:    6,
    box:         1,
    cone:        5,
    torus:       12, torusTube: 4,
    capsule:     4,  capsuleH:  4,
    plane:       1,
    desc:        "Low — ~50-200 tris/part. Game-ready, fast preview.",
    triMult:     1.0,
  },
  Mid: {
    sphere:      12, sphereH:  8,
    cylinder:    10,
    box:         1,
    cone:        8,
    torus:       20, torusTube: 6,
    capsule:     6,  capsuleH:  6,
    plane:       2,
    desc:        "Mid — ~500-1500 tris/part. Balanced. Good for animation.",
    triMult:     4.0,
  },
  High: {
    sphere:      24, sphereH: 16,
    cylinder:    18,
    box:         2,
    cone:        14,
    torus:       36, torusTube: 10,
    capsule:     10, capsuleH: 10,
    plane:       4,
    desc:        "High — ~2000-6000 tris/part. Film/cinematic quality.",
    triMult:     16.0,
  },
  Ultra: {
    sphere:      48, sphereH: 32,
    cylinder:    32,
    box:         4,
    cone:        24,
    torus:       64, torusTube: 16,
    capsule:     16, capsuleH: 16,
    plane:       8,
    desc:        "Ultra — ~8000-25000 tris/part. Sculpt-level subdivision. Slow on large scenes.",
    triMult:     64.0,
  },
};

export function Q(quality) {
  return QUALITY_PRESETS[quality] || QUALITY_PRESETS.Mid;
}

// Estimated triangle count for a full character at given quality
export function estimateTris(quality, partCount=20) {
  const q = QUALITY_PRESETS[quality] || QUALITY_PRESETS.Mid;
  const baseTrisPerPart = 150;
  return Math.round(baseTrisPerPart * q.triMult * partCount);
}

export function formatTris(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1)+"M";
  if (n >= 1000)    return (n/1000).toFixed(0)+"K";
  return n.toString();
}

// React component — drop-in quality selector bar
// Usage: <PolyQualityBar quality={quality} onChange={setQuality}/>
import React from "react";
export function PolyQualityBar({ quality, onChange }) {
  const T={teal:"#00ffc8",orange:"#FF6600",bg:"#06060f",panel:"#0d0d1a",border:"#1a1a2e",muted:"#aaa",font:"JetBrains Mono,monospace"};
  const colors = { Low:"#556677", Mid:"#FF6600", High:"#00ffc8", Ultra:"#ff00ff" };
  return (
    <div style={{marginBottom:10}}>
      <div style={{fontSize:10,color:T.muted,marginBottom:5,fontFamily:T.font}}>
        Poly Quality — {QUALITY_PRESETS[quality]?.desc}
      </div>
      <div style={{display:"flex",gap:4}}>
        {QUALITY_LEVELS.map(lv=>(
          <button
            key={lv}
            onClick={()=>onChange(lv)}
            style={{
              flex:1, padding:"4px 0", fontSize:10, fontFamily:T.font, fontWeight:700,
              cursor:"pointer", borderRadius:4, border:"1px solid "+(lv===quality?colors[lv]:T.border),
              background:lv===quality?colors[lv]:T.panel, color:lv===quality?"#06060f":T.muted,
            }}
          >{lv}</button>
        ))}
      </div>
      <div style={{fontSize:9,color:T.muted,marginTop:3,fontFamily:T.font}}>
        Est. {formatTris(estimateTris(quality))} tris/character
      </div>
    </div>
  );
}

export default Q;
""".strip())
print(f"  ✓ PolyQualityUtil.js written")

# ── 2. Patch each generator panel to import + use PolyQualityBar ─────────────
GENERATORS = [
    "QuadrupedGeneratorPanel.jsx",
    "CreatureGeneratorPanel.jsx",
    "HybridGeneratorPanel.jsx",
    "ModelGeneratorPanel.jsx",
    "BodyGeneratorPanel.jsx",
    "BirdGeneratorPanel.jsx",
    "FishGeneratorPanel.jsx",
]

IMPORT_LINE = "import { PolyQualityBar, Q, estimateTris, formatTris } from './PolyQualityUtil';\n"

# The quality state + bar JSX to inject into each panel
QUALITY_STATE  = "  const [quality, setQuality] = useState('Mid');\n"

patched = 0
for fname in GENERATORS:
    fpath = os.path.join(P, fname)
    if not os.path.exists(fpath):
        print(f"  ⚠ Not found: {fname} — skip")
        continue
    src = open(fpath).read()

    # Skip if already patched
    if "PolyQualityBar" in src:
        print(f"  ⚠ Already patched: {fname}")
        continue

    # 1. Add import after first import line
    first_import_end = src.index("\n", src.index("import ")) + 1
    src = src[:first_import_end] + IMPORT_LINE + src[first_import_end:]

    # 2. Add quality state after first useState(
    first_state = src.find("useState(")
    if first_state > 0:
        line_end = src.index("\n", first_state) + 1
        src = src[:line_end] + QUALITY_STATE + src[line_end:]

    # 3. Inject <PolyQualityBar> before first <div style={S.sec}> inside return
    # Find the return statement's first sec div
    ret_idx = src.rfind("return(")
    if ret_idx < 0:
        ret_idx = src.rfind("return (")
    if ret_idx > 0:
        sec_idx = src.find("<div style={S.sec}>", ret_idx)
        if sec_idx > 0:
            bar_jsx = "\n      <PolyQualityBar quality={quality} onChange={setQuality}/>\n"
            src = src[:sec_idx] + bar_jsx + src[sec_idx:]

    # 4. Replace low-seg geometry calls with Q(quality) equivalents
    # SphereGeometry
    import re
    def fix_sphere(m):
        r = m.group(1)
        return f"new THREE.SphereGeometry({r},Q(quality).sphere,Q(quality).sphereH)"
    src = re.sub(r'new THREE\.SphereGeometry\(([^,)]+),\s*\d+,\s*\d+\)', fix_sphere, src)

    def fix_cylinder(m):
        a,b,c = m.group(1),m.group(2),m.group(3)
        return f"new THREE.CylinderGeometry({a},{b},{c},Q(quality).cylinder)"
    src = re.sub(r'new THREE\.CylinderGeometry\(([^,)]+),([^,)]+),([^,)]+),\s*\d+\)', fix_cylinder, src)

    def fix_cone(m):
        a,b = m.group(1),m.group(2)
        return f"new THREE.ConeGeometry({a},{b},Q(quality).cone)"
    src = re.sub(r'new THREE\.ConeGeometry\(([^,)]+),([^,)]+),\s*\d+\)', fix_cone, src)

    def fix_capsule(m):
        a,b = m.group(1),m.group(2)
        return f"new THREE.CapsuleGeometry({a},{b},Q(quality).capsule,Q(quality).capsule)"
    src = re.sub(r'new THREE\.CapsuleGeometry\(([^,)]+),([^,)]+),\s*\d+,\s*\d+\)', fix_capsule, src)

    with open(fpath, "w") as f:
        f.write(src)
    print(f"  ✓ Patched: {fname}")
    patched += 1

print(f"\n✅ Poly quality system installed — {patched} panels patched")
print("Run: npm run build && git add -A && git commit -m 'feat: poly quality system — Low/Mid/High/Ultra' && git push")
