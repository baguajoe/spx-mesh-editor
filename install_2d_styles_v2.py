#!/usr/bin/env python3
# 2D Style Presets v2 — 10 new high-quality styles added
# python3 install_2d_styles_v2.py && npm run build && git add -A && git commit -m "feat: 10 new 2D animation styles — Fleischer, UPA, Moebius, CalArts, etc" && git push
import os

REPO = "/workspaces/spx-mesh-editor"
PIPE = f"{REPO}/src/components/pipeline"
os.makedirs(PIPE, exist_ok=True)

# Read existing file and append new styles
existing_path = f"{PIPE}/SPX2DStylePresets.js"
existing = open(existing_path).read() if os.path.exists(existing_path) else ""

NEW_STYLES = '''
  // ── NEW STYLES v2 ──────────────────────────────────────

  "Fleischer Rubber Hose": {
    desc: "1930s pre-Disney. Rubbery limbs, no joints, bouncy everything. Steamboat Willie energy.",
    headScale: 1.4, limbScale: 1.0, snapDeg: 0, combinable: true,
    rubberLimbs: true, bouncyHead: true, inkOutline: true, limitedPalette: true,
    bgStyle: "cream", outlineWeight: 3,
    notes: "Limbs have no elbows/knees — pure curves. Head bobs on every beat.",
  },

  "UPA Flat 50s": {
    desc: "1950s limited animation. Mr. Magoo, Gerald McBoing Boing. Geometric shapes, pastel fills, minimal motion.",
    headScale: 0.9, limbScale: 0.85, snapDeg: 0, combinable: true,
    flatColor: true, limitedPalette: true, inkOutline: true, geometricShapes: true,
    bgStyle: "pastel", outlineWeight: 2,
    notes: "Hold poses longer. Only animate what must move. Color blocks over detail.",
  },

  "Soviet Soyuzmultfilm": {
    desc: "USSR animation 1950-80s. Cheburashka, Hedgehog in the Fog. Painterly, melancholic, textured backgrounds.",
    headScale: 1.05, limbScale: 0.95, snapDeg: 0, combinable: true,
    painterly: true, filmGrain: true, softEdges: true,
    bgStyle: "painterly_dark", outlineWeight: 1.5,
    notes: "Slow deliberate movement. Watercolor texture overlay. Muted palette with occasional vivid accent.",
  },

  "Moebius / Heavy Metal": {
    desc: "Jean Giraud / Heavy Metal magazine. Ultra-fine linework, epic sci-fi scale, chrome and desert palettes.",
    headScale: 0.88, limbScale: 1.1, snapDeg: 0, combinable: true,
    inkOutline: true, crosshatch: true, detailLines: true,
    bgStyle: "stark", outlineWeight: 1,
    notes: "Thin precise lines. Vast empty space. Characters small against enormous environments.",
  },

  "CalArts / Adventure Time": {
    desc: "Adventure Time, Gravity Falls, Steven Universe. Wobbly lines, thick outlines, expressive squash/stretch.",
    headScale: 1.15, limbScale: 1.0, snapDeg: 0, combinable: true,
    inkOutline: true, wobbleLines: true, squashStretch: true,
    bgStyle: "bright_flat", outlineWeight: 2.5,
    notes: "Lines slightly wobbly — not perfect circles. Bold outlines. Oversized eyes.",
  },

  "Ralph Bakshi Adult": {
    desc: "Fritz the Cat, Wizards. Rotoscoped grit, exaggerated ugly-beautiful, raw energy.",
    headScale: 1.0, limbScale: 1.05, snapDeg: 0, combinable: false,
    filmGrain: true, highContrast: true, inkOutline: true, roughLines: true,
    bgStyle: "gritty", outlineWeight: 2,
    notes: "Rotoscope over live action. Deliberately imperfect. High contrast shadows.",
  },

  "Rankin Bass Stop Motion": {
    desc: "Rudolph the Red-Nosed Reindeer, The Hobbit. Puppet-like stiff movement, felt texture, holiday warmth.",
    headScale: 1.1, limbScale: 0.9, snapDeg: 22.5, combinable: false,
    limitedPalette: true, feltTexture: true, snapMovement: true,
    bgStyle: "warm_flat", outlineWeight: 1.5,
    notes: "Movement snaps between poses — no tweening. 12fps maximum. Puppet proportions.",
  },

  "Adult Swim Surreal": {
    desc: "Tim and Eric, Rick and Morty early, Too Many Cooks. Lo-fi absurdist, VHS aesthetic, off-model.",
    headScale: 1.05, limbScale: 1.0, snapDeg: 0, combinable: true,
    filmGrain: true, vhsDistort: true, offModel: true, limitedPalette: false,
    bgStyle: "vhs_static", outlineWeight: 2,
    notes: "Deliberately wrong proportions. VHS color bleed. Random frame holds.",
  },

  "Wayang Kulit Shadow": {
    desc: "Indonesian shadow puppet. Intricate silhouette cutouts, highly stylized profile view, batik patterns.",
    headScale: 1.0, limbScale: 1.0, snapDeg: 15, combinable: false,
    silhouette: true, cutout: true, profileOnly: true, ornateDetail: true,
    bgStyle: "amber_backlit", outlineWeight: 0,
    notes: "Pure profile. Silhouette only. Intricate internal cutout patterns visible when backlit.",
  },

  "South Park Cutout": {
    desc: "Deliberately crude construction paper look. Minimal frames, static limbs, mouth-only animation.",
    headScale: 1.2, limbScale: 0.8, snapDeg: 45, combinable: false,
    cutout: true, limitedPalette: true, staticLimbs: true, snapMovement: true,
    pixelGrid: 0, frameSkip: 6,
    bgStyle: "flat_bright", outlineWeight: 1,
    notes: "Maximum 8fps. Limbs barely move. Only mouth and eyes animate. Intentionally cheap.",
  },
'''.strip()

# Patch the STYLE_PRESETS object — insert before closing };
if "Fleischer Rubber Hose" in existing:
    print("⚠ Already patched — skipping style additions")
else:
    # Find the closing of STYLE_PRESETS
    close_idx = existing.rfind("};", 0, existing.find("export const STYLE_NAMES"))
    if close_idx > 0:
        patched = existing[:close_idx] + "\n" + NEW_STYLES + "\n" + existing[close_idx:]
        # Also update COMBINABLE_PAIRS
        new_pairs = '''
  ["Fleischer Rubber Hose", "Classic Cartoon"],
  ["Fleischer Rubber Hose", "90s Saturday Morning"],
  ["UPA Flat 50s", "CalArts / Adventure Time"],
  ["UPA Flat 50s", "Webtoon"],
  ["Moebius / Heavy Metal", "Western Comic"],
  ["Moebius / Heavy Metal", "Noir Cinematic"],
  ["CalArts / Adventure Time", "Studio Ghibli"],
  ["CalArts / Adventure Time", "Spider-Verse"],
  ["Soviet Soyuzmultfilm", "Studio Ghibli"],
  ["Adult Swim Surreal", "Underground Indie"],
  ["Ralph Bakshi Adult", "Rotoscope Realism"],
'''
        pairs_end = patched.rfind("];", patched.find("COMBINABLE_PAIRS"))
        if pairs_end > 0:
            patched = patched[:pairs_end] + new_pairs + patched[pairs_end:]
        with open(existing_path, "w") as f:
            f.write(patched)
        print("✓ 10 new styles added to SPX2DStylePresets.js")
    else:
        print("⚠ Could not find insertion point")

# Now patch TwoDViewportPanel to render the new styles properly
VIEWPORT_PATH = f"{REPO}/src/components/panels/TwoDViewportPanel.jsx"
if os.path.exists(VIEWPORT_PATH):
    vp = open(VIEWPORT_PATH).read()
    if "Fleischer" not in vp:
        # Add new style color entries
        new_colors = '''
    "Fleischer Rubber Hose":"#f5e6c0", "UPA Flat 50s":"#ff9966",
    "Soviet Soyuzmultfilm":"#8899aa", "Moebius / Heavy Metal":"#cc9944",
    "CalArts / Adventure Time":"#ff66aa", "Ralph Bakshi Adult":"#885522",
    "Rankin Bass Stop Motion":"#ffcc66", "Adult Swim Surreal":"#00ff88",
    "Wayang Kulit Shadow":"#ff8800", "South Park Cutout":"#ff4400",'''
        # Inject into getStyleColor
        marker = '"Arcane Painterly":"#aa6644"'
        if marker in vp:
            vp = vp.replace(marker, marker + new_colors)

        # Add rendering for new style backgrounds in drawStickFigure
        new_bg_render = '''
  if (sp.feltTexture || sp.snapMovement) {
    ctx.fillStyle = "#ffe8cc"; ctx.fillRect(0,0,w,h);
    // Felt texture dots
    ctx.globalAlpha=0.08;
    for(let i=0;i<200;i++){ctx.beginPath();ctx.arc(Math.random()*w,Math.random()*h,Math.random()*3,0,Math.PI*2);ctx.fillStyle="#aa6633";ctx.fill();}
    ctx.globalAlpha=1;
  } else if (sp.vhsDistort) {
    ctx.fillStyle="#050510";ctx.fillRect(0,0,w,h);
    // VHS scanlines
    ctx.globalAlpha=0.15;
    for(let y=0;y<h;y+=3){ctx.fillStyle=y%6===0?"#ffffff":"#000000";ctx.fillRect(0,y,w,1);}
    // Color fringe
    ctx.globalAlpha=0.05;ctx.fillStyle="#ff0000";ctx.fillRect(-2,0,w,h);
    ctx.fillStyle="#0000ff";ctx.fillRect(2,0,w,h);
    ctx.globalAlpha=1;
  } else if (sp.rubberLimbs) {
    ctx.fillStyle="#f5e6b0";ctx.fillRect(0,0,w,h);
    // Film grain
    ctx.globalAlpha=0.06;
    for(let i=0;i<300;i++){ctx.fillStyle="#000";ctx.fillRect(Math.random()*w,Math.random()*h,1,1);}
    ctx.globalAlpha=1;
  } else if (sp.crosshatch) {
    ctx.fillStyle="#f8f4e8";ctx.fillRect(0,0,w,h);
  } else if (sp.wobbleLines) {
    ctx.fillStyle="#ffffff";ctx.fillRect(0,0,w,h);
  } else if (sp.silhouette && sp.profileOnly) {
    // Amber backlit for Wayang
    const bg=ctx.createLinearGradient(0,0,0,h);
    bg.addColorStop(0,"#2a1500");bg.addColorStop(0.5,"#ff8800");bg.addColorStop(1,"#2a1500");
    ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  }'''

        # Inject after existing background effects block
        inject_marker = "// Background effects"
        if inject_marker in vp:
            vp = vp.replace(inject_marker, inject_marker + new_bg_render)

        # Patch drawStickFigure connections for rubber hose style
        rubber_hose_patch = '''
  // Rubber hose — draw wavy curves instead of straight lines for Fleischer
  if (sp.rubberLimbs) {
    SKELETON_CONNECTIONS.forEach(([a,b]) => {
      const pa = transformed[a], pb = transformed[b];
      if (!pa || !pb) return;
      const mx=(pa.x+pb.x)/2+(Math.sin(t.current*3+pa.x))*8;
      const my=(pa.y+pb.y)/2+(Math.cos(t.current*3+pa.y))*8;
      ctx.beginPath();ctx.moveTo(pa.x,pa.y);
      ctx.quadraticCurveTo(mx,my,pb.x,pb.y);
      ctx.strokeStyle=jColor;ctx.lineWidth=4;ctx.stroke();
    });
    // Draw joints as circles only
    Object.entries(transformed).forEach(([bone,pos])=>{
      const r=bone==="head"?(sp.headScale||1)*16:5;
      ctx.beginPath();ctx.arc(pos.x,pos.y,r,0,Math.PI*2);
      ctx.fillStyle=jColor;ctx.fill();
    });
    return; // Skip normal drawing
  }
  // South Park — static body, only mouth area moves
  if (sp.staticLimbs) {
    const torso=["chest","spine","hips","l_shoulder","r_shoulder"];
    SKELETON_CONNECTIONS.forEach(([a,b])=>{
      if(!torso.includes(a)&&!torso.includes(b)) return;
      const pa=transformed[a],pb=transformed[b];
      if(!pa||!pb)return;
      ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);
      ctx.strokeStyle=jColor;ctx.lineWidth=3;ctx.stroke();
    });
    if(transformed.head){
      ctx.beginPath();ctx.arc(transformed.head.x,transformed.head.y,(sp.headScale||1)*14,0,Math.PI*2);
      ctx.fillStyle=jColor;ctx.fill();
    }
    return;
  }
  // Wayang — pure silhouette profile
  if (sp.profileOnly) {
    const sortedBones=Object.entries(transformed).sort((a,b)=>a[1].y-b[1].y);
    ctx.fillStyle="#000000";
    sortedBones.forEach(([bone,pos])=>{
      const r=bone==="head"?18:bone.includes("thigh")||bone.includes("chest")?10:6;
      ctx.beginPath();ctx.arc(pos.x*0.3+w*0.5,pos.y,r,0,Math.PI*2);ctx.fill();
    });
    return;
  }'''

        # Inject at start of drawStickFigure after background effects
        bg_end_marker = "const lineW  = sp.inkOutline ? 3 : 2;"
        if bg_end_marker in vp:
            vp = vp.replace(bg_end_marker, rubber_hose_patch + "\n  " + bg_end_marker)

        with open(VIEWPORT_PATH, "w") as f:
            f.write(vp)
        print("✓ TwoDViewportPanel patched with new style rendering")
    else:
        print("⚠ TwoDViewportPanel already patched")
else:
    print("⚠ TwoDViewportPanel not found")

# Update BaseModelLibrary to include new styles in routing
print("\n✅ Done")
print("Run: npm run build && git add -A && git commit -m 'feat: 10 new 2D styles — Fleischer/UPA/Moebius/CalArts/Soviet/Bakshi/RankinBass/AdultSwim/Wayang/SouthPark' && git push")
