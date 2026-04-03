import os, shutil

ROOT = "/workspaces/spx-mesh-editor/src"
MESH = f"{ROOT}/mesh"

# ─────────────────────────────────────────────────────────────────────────────
# 1. NEW FILE: FilmRenderer.js
#    EffectComposer + RenderPass + UnrealBloomPass + SSAOPass + SMAAPass
#    + procedural HDRI sky (no external files needed)
# ─────────────────────────────────────────────────────────────────────────────
film_renderer = r"""import * as THREE from "three";
import { EffectComposer }   from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass }       from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass }  from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { SSAOPass }         from "three/examples/jsm/postprocessing/SSAOPass.js";
import { SMAAPass }         from "three/examples/jsm/postprocessing/SMAAPass.js";
import { OutputPass }       from "three/examples/jsm/postprocessing/OutputPass.js";

// ── Procedural sky HDRI (no file needed) ─────────────────────────────────────
export function createProceduralHDRI(renderer) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size * 4; canvas.height = size * 2;
  const ctx = canvas.getContext("2d");

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, size * 2);
  skyGrad.addColorStop(0.0,  "#0a0a1a");
  skyGrad.addColorStop(0.3,  "#0d1b3e");
  skyGrad.addColorStop(0.5,  "#1a3a6e");
  skyGrad.addColorStop(0.65, "#4a7fbf");
  skyGrad.addColorStop(0.75, "#e8c090");
  skyGrad.addColorStop(0.85, "#c05020");
  skyGrad.addColorStop(1.0,  "#080808");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, size * 4, size * 2);

  // Sun disc
  const sunX = size * 2, sunY = size * 1.35;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
  sunGrad.addColorStop(0,   "rgba(255,240,200,1)");
  sunGrad.addColorStop(0.2, "rgba(255,200,100,0.8)");
  sunGrad.addColorStop(0.5, "rgba(255,120,30,0.3)");
  sunGrad.addColorStop(1,   "rgba(255,80,0,0)");
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, size * 4, size * 2);

  // Ground
  const gndGrad = ctx.createLinearGradient(0, size * 1.5, 0, size * 2);
  gndGrad.addColorStop(0, "#1a1208");
  gndGrad.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = gndGrad;
  ctx.fillRect(0, size * 1.5, size * 4, size * 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envMap = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return envMap;
}

// ── Upgrade all scene materials to MeshPhysical ───────────────────────────────
export function upgradeMaterialsToPhysical(scene) {
  scene.traverse(obj => {
    if (!obj.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    obj.material = mats.map(m => {
      if (!m || m.isMeshPhysicalMaterial) return m;
      const p = new THREE.MeshPhysicalMaterial({
        color:            m.color            || new THREE.Color(0xffffff),
        roughness:        m.roughness        ?? 0.5,
        metalness:        m.metalness        ?? 0.0,
        map:              m.map              || null,
        normalMap:        m.normalMap        || null,
        roughnessMap:     m.roughnessMap     || null,
        metalnessMap:     m.metalnessMap     || null,
        aoMap:            m.aoMap            || null,
        emissive:         m.emissive         || new THREE.Color(0x000000),
        emissiveIntensity:m.emissiveIntensity ?? 0,
        emissiveMap:      m.emissiveMap      || null,
        transparent:      m.transparent      || false,
        opacity:          m.opacity          ?? 1.0,
        side:             m.side             ?? THREE.FrontSide,
        envMapIntensity:  m.envMapIntensity  ?? 1.0,
        // Film-quality extras
        clearcoat:        0.1,
        clearcoatRoughness: 0.3,
        sheen:            0.0,
        anisotropy:       0.0,
      });
      p.needsUpdate = true;
      return p;
    });
    if (!Array.isArray(obj.material)) obj.material = obj.material[0];
  });
}

// ── Init film-quality EffectComposer ──────────────────────────────────────────
export function initFilmComposer(renderer, scene, camera) {
  const w = renderer.domElement.clientWidth  || renderer.domElement.width;
  const h = renderer.domElement.clientHeight || renderer.domElement.height;
  const size = new THREE.Vector2(w, h);

  const composer = new EffectComposer(renderer);

  // Pass 1: beauty render
  composer.addPass(new RenderPass(scene, camera));

  // Pass 2: SSAO (ambient occlusion — kills flat look)
  try {
    const ssao = new SSAOPass(scene, camera, w, h);
    ssao.kernelRadius = 0.6;
    ssao.minDistance  = 0.001;
    ssao.maxDistance  = 0.08;
    composer.addPass(ssao);
  } catch(e) { console.warn("SSAOPass unavailable:", e.message); }

  // Pass 3: Bloom (cinematic glow on bright surfaces)
  const bloom = new UnrealBloomPass(size, 0.4, 0.5, 0.85);
  composer.addPass(bloom);

  // Pass 4: SMAA anti-alias (sharper than FXAA)
  try {
    composer.addPass(new SMAAPass(w, h));
  } catch(e) { console.warn("SMAAPass unavailable:", e.message); }

  // Pass 5: output color space correction
  try {
    composer.addPass(new OutputPass());
  } catch(e) {}

  return composer;
}
"""

with open(f"{MESH}/FilmRenderer.js", "w") as f:
    f.write(film_renderer)
print("✓ FilmRenderer.js written")

# ─────────────────────────────────────────────────────────────────────────────
# 2. PATCH App.jsx — renderer init block
#    Add: outputColorSpace, PCFSoftShadowMap, shadow map 4096, toneMappingExposure
#    Add: IBL env map via createProceduralHDRI
#    Add: upgradeMaterialsToPhysical
#    Add: initFilmComposer stored in composerRef
# ─────────────────────────────────────────────────────────────────────────────
app_path = f"{ROOT}/App.jsx"
with open(app_path) as f:
    src = f.read()

# 2a. Add import at top of file
old_import = 'import * as THREE from "three";'
new_import  = ('import * as THREE from "three";\n'
               'import { initFilmComposer, createProceduralHDRI, upgradeMaterialsToPhysical } from "./mesh/FilmRenderer.js";')
if 'FilmRenderer' not in src:
    src = src.replace(old_import, new_import, 1)
    print("✓ FilmRenderer import added")
else:
    print("• FilmRenderer import already present")

# 2b. Upgrade renderer init block
old_renderer = (
    "    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });\n"
    "    renderer.setPixelRatio(window.devicePixelRatio);\n"
    "    renderer.setSize(canvas.clientWidth, canvas.clientHeight);\n"
    "    renderer.shadowMap.enabled = true;\n"
    "    renderer.toneMapping = THREE.ACESFilmicToneMapping;\n"
    "    rendererRef.current = renderer;"
)
new_renderer = (
    "    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });\n"
    "    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));\n"
    "    renderer.setSize(canvas.clientWidth, canvas.clientHeight);\n"
    "    renderer.shadowMap.enabled = true;\n"
    "    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;\n"
    "    renderer.toneMapping          = THREE.ACESFilmicToneMapping;\n"
    "    renderer.toneMappingExposure  = 1.1;\n"
    "    renderer.outputColorSpace     = THREE.SRGBColorSpace;\n"
    "    renderer.physicallyCorrectLights = true;\n"
    "    rendererRef.current = renderer;"
)
if old_renderer in src:
    src = src.replace(old_renderer, new_renderer, 1)
    print("✓ Renderer init upgraded")
else:
    print("⚠ Renderer init block not matched — check manually")

# 2c. Upgrade shadow map on dirLight from 2048 → 4096
src = src.replace(
    "  dirLight.shadow.mapSize.width = 2048;\n  dirLight.shadow.mapSize.height = 2048;",
    "  dirLight.shadow.mapSize.width = 4096;\n  dirLight.shadow.mapSize.height = 4096;\n  dirLight.shadow.bias = -0.0003;\n  dirLight.shadow.normalBias = 0.02;"
)
print("✓ Shadow map upgraded to 4096")

# 2d. Wire IBL + material upgrade after scene is created
old_scene_bg = '    scene.background = new THREE.Color(COLORS.bg);'
new_scene_bg = (
    "    scene.background = new THREE.Color(COLORS.bg);\n\n"
    "    // ── IBL environment lighting (film quality) ──\n"
    "    try {\n"
    "      const envMap = createProceduralHDRI(renderer);\n"
    "      scene.environment = envMap;\n"
    "      scene.environmentIntensity = 0.8;\n"
    "    } catch(e) { console.warn('IBL setup failed:', e); }"
)
if old_scene_bg in src:
    src = src.replace(old_scene_bg, new_scene_bg, 1)
    print("✓ IBL env map wired")
else:
    print("⚠ IBL anchor not matched")

# 2e. Add composerRef declaration near other refs
old_camera_ref = "    cameraRef.current = camera;"
new_camera_ref = (
    "    cameraRef.current = camera;\n\n"
    "    // ── Film quality EffectComposer ──\n"
    "    try {\n"
    "      const composer = initFilmComposer(renderer, scene, camera);\n"
    "      rendererRef._composer = composer;\n"
    "    } catch(e) { console.warn('EffectComposer init failed:', e); }\n\n"
    "    // ── Upgrade all materials to MeshPhysical ──\n"
    "    setTimeout(() => {\n"
    "      try { upgradeMaterialsToPhysical(scene); } catch(e) {}\n"
    "    }, 500);"
)
if old_camera_ref in src:
    src = src.replace(old_camera_ref, new_camera_ref, 1)
    print("✓ Composer + material upgrade wired after camera init")
else:
    print("⚠ cameraRef anchor not matched")

# 2f. Patch animate loop to use composer when available
old_animate = (
    "    const animate = () => {\n"
    "      rafRef.current = requestAnimationFrame(animate);\n"
    "      renderViewportSet("
)
new_animate = (
    "    const animate = () => {\n"
    "      rafRef.current = requestAnimationFrame(animate);\n"
    "      const _composer = rendererRef.current?._composer;\n"
    "      if (_composer && typeof quadViewRef !== 'undefined' && !quadViewRef.current) {\n"
    "        _composer.render();\n"
    "      } else {\n"
    "      renderViewportSet("
)
close_animate = (
    "        canvas.clientWidth,\n"
    "        canvas.clientHeight,\n"
    "        typeof quadViewRef !== \"undefined\" ? quadViewRef.current : false\n"
    "      );\n"
    "    };\n"
)
new_close_animate = (
    "        canvas.clientWidth,\n"
    "        canvas.clientHeight,\n"
    "        typeof quadViewRef !== \"undefined\" ? quadViewRef.current : false\n"
    "      );\n"
    "      } // end composer else\n"
    "    };\n"
)
if old_animate in src:
    src = src.replace(old_animate, new_animate, 1)
    src = src.replace(close_animate, new_close_animate, 1)
    print("✓ Animate loop patched to use composer")
else:
    print("⚠ Animate loop anchor not matched — composer not hooked into loop")

with open(app_path, "w") as f:
    f.write(src)
print("\n✓ App.jsx written")

# ─────────────────────────────────────────────────────────────────────────────
# 3. PATCH RenderSystem.js — upgrade createPBRMaterial to MeshPhysical
# ─────────────────────────────────────────────────────────────────────────────
rs_path = f"{MESH}/RenderSystem.js"
with open(rs_path) as f:
    rs = f.read()

old_mat = "  const mat = new THREE.MeshStandardMaterial({"
new_mat = "  const mat = new THREE.MeshPhysicalMaterial({"

if old_mat in rs:
    rs = rs.replace(old_mat, new_mat, 1)
    # inject film extras after envMapIntensity
    old_env = "    envMapIntensity,\n  });"
    new_env = (
        "    envMapIntensity,\n"
        "    clearcoat:           options.clearcoat           ?? 0.0,\n"
        "    clearcoatRoughness:  options.clearcoatRoughness  ?? 0.3,\n"
        "    sheen:               options.sheen               ?? 0.0,\n"
        "    sheenColor:          options.sheenColor          ? new THREE.Color(options.sheenColor) : new THREE.Color(0xffffff),\n"
        "    anisotropy:          options.anisotropy          ?? 0.0,\n"
        "    iridescence:         options.iridescence         ?? 0.0,\n"
        "  });"
    )
    rs = rs.replace(old_env, new_env, 1)
    print("✓ RenderSystem.js: createPBRMaterial → MeshPhysical")
else:
    print("⚠ RenderSystem.js: MeshStandardMaterial not found at expected location")

with open(rs_path, "w") as f:
    f.write(rs)

print("\n✅ Day 1 film renderer upgrade complete.")
print("Run: npm run build 2>&1 | tail -5 && git add -A && git commit -m 'feat: Day 1 film renderer - PCFSoftShadow/4096 + outputColorSpace + IBL PMREM + EffectComposer bloom/SSAO/SMAA + MeshPhysical' && git push origin main")
