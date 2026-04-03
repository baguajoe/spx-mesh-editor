import os

path = "/workspaces/spx-mesh-editor/src/pipeline/SPX3DTo2DPipeline.js"
with open(path, "r") as f:
    original = f.read()

# Find where the SPX3DTo2DRenderer class starts to preserve everything before it
# and find where getStylesByCategory starts to preserve everything after
before_renderer = original[:original.find("export class SPX3DTo2DRenderer")]
after_renderer = original[original.find("export function getStylesByCategory"):]

new_renderer = r'''
// ─── GPU Renderer using Three.js EffectComposer ──────────────────────────────
export class SPX3DTo2DRenderer {
  /**
   * @param {THREE.WebGLRenderer} threeRenderer
   * @param {object} options
   */
  constructor(threeRenderer, options = {}) {
    this.threeRenderer = threeRenderer;
    this.styleId = options.style || 'cinematic';
    this.style = CINEMATIC_STYLES[this.styleId] || CINEMATIC_STYLES.cinematic;
    this.outlineWidth = options.outlineWidth || 2;
    this.toonLevels = options.toonLevels || this.style.toonLevels || 4;
    this._composer = null;
    this._renderTarget = null;
  }

  setStyle(styleId) {
    this.styleId = styleId;
    this.style = CINEMATIC_STYLES[styleId] || CINEMATIC_STYLES.cinematic;
    this._composer = null; // force rebuild
  }

  async _buildComposer(scene, camera, w, h) {
    const {
      EffectComposer
    } = await import('three/examples/jsm/postprocessing/EffectComposer.js');
    const {
      RenderPass
    } = await import('three/examples/jsm/postprocessing/RenderPass.js');
    const {
      OutlinePass
    } = await import('three/examples/jsm/postprocessing/OutlinePass.js');
    const {
      ShaderPass
    } = await import('three/examples/jsm/postprocessing/ShaderPass.js');
    const {
      UnrealBloomPass
    } = await import('three/examples/jsm/postprocessing/UnrealBloomPass.js');
    const {
      FilmPass
    } = await import('three/examples/jsm/postprocessing/FilmPass.js');
    const {
      HalftonePass
    } = await import('three/examples/jsm/postprocessing/HalftonePass.js');
    const {
      GlitchPass
    } = await import('three/examples/jsm/postprocessing/GlitchPass.js');
    const {
      OutputPass
    } = await import('three/examples/jsm/postprocessing/OutputPass.js');

    const THREE = await import('three');
    const renderer = this.threeRenderer;
    const style = this.style;

    const composer = new EffectComposer(renderer);
    composer.setSize(w, h);

    // ── Base render pass ──────────────────────────────────────────────────────
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // ── Toon shading — apply quantization shader ──────────────────────────────
    if (style.toon) {
      const levels = this.toonLevels || 4;
      const toonShader = {
        uniforms: {
          tDiffuse: { value: null },
          levels: { value: levels },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float levels;
          varying vec2 vUv;
          void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            vec3 q = floor(color.rgb * levels) / levels;
            gl_FragColor = vec4(q, color.a);
          }
        `,
      };
      composer.addPass(new ShaderPass(toonShader));
    }

    // ── Outline pass (industry standard back-face extrusion) ─────────────────
    if (style.outline) {
      const outlinePass = new OutlinePass(
        new THREE.Vector2(w, h),
        scene,
        camera
      );
      outlinePass.edgeStrength = this.outlineWidth * 2;
      outlinePass.edgeGlow = 0;
      outlinePass.edgeThickness = this.outlineWidth;
      outlinePass.pulsePeriod = 0;
      outlinePass.visibleEdgeColor.set('#000000');
      outlinePass.hiddenEdgeColor.set('#000000');
      // Select all mesh objects for outline
      const outlineObjects = [];
      scene.traverse(obj => { if (obj.isMesh) outlineObjects.push(obj); });
      outlinePass.selectedObjects = outlineObjects;
      composer.addPass(outlinePass);
    }

    // ── Bloom pass ────────────────────────────────────────────────────────────
    if (style.passes?.includes('bloom')) {
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(w, h),
        style.id === 'neon' ? 1.5 : 0.4,  // strength
        0.4,  // radius
        style.id === 'neon' ? 0.6 : 0.85  // threshold
      );
      composer.addPass(bloomPass);
    }

    // ── Film grain + scanlines ────────────────────────────────────────────────
    if (style.passes?.includes('grain') || style.passes?.includes('scanlines')) {
      const filmPass = new FilmPass(
        style.passes?.includes('grain') ? 0.35 : 0.0,   // noise intensity
        style.passes?.includes('scanlines') ? 0.5 : 0.0, // scanline intensity
        648,   // scanline count
        false  // grayscale
      );
      composer.addPass(filmPass);
    }

    // ── Halftone pass ─────────────────────────────────────────────────────────
    if (style.passes?.includes('halftone')) {
      const halftonePass = new HalftonePass(w, h, {
        shape: 1,
        radius: 4,
        rotateR: Math.PI / 12,
        rotateG: Math.PI / 12 * 2,
        rotateB: Math.PI / 12 * 3,
        scatter: 0,
        blending: 1,
        blendingMode: 1,
        greyscale: false,
        disable: false,
      });
      composer.addPass(halftonePass);
    }

    // ── Glitch pass ───────────────────────────────────────────────────────────
    if (style.passes?.includes('glitch_shift')) {
      const glitchPass = new GlitchPass();
      glitchPass.goWild = false;
      composer.addPass(glitchPass);
    }

    // ── Pixelate pass ─────────────────────────────────────────────────────────
    if (style.passes?.includes('pixelate')) {
      const pixelSize = style.pixelSize || 8;
      const pixelPass = new ShaderPass({
        uniforms: {
          tDiffuse: { value: null },
          resolution: { value: new THREE.Vector2(w, h) },
          pixelSize: { value: pixelSize },
        },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform vec2 resolution;
          uniform float pixelSize;
          varying vec2 vUv;
          void main() {
            vec2 dxy = pixelSize / resolution;
            vec2 coord = dxy * floor(vUv / dxy);
            gl_FragColor = texture2D(tDiffuse, coord);
          }
        `,
      });
      composer.addPass(pixelPass);
    }

    // ── CSS filter simulation via shader ──────────────────────────────────────
    if (style.cssFilter && style.cssFilter !== 'none') {
      // Parse common CSS filters into shader uniforms
      let saturation = 1.0, contrast = 1.0, brightness = 1.0, grayscale = 0.0, sepia = 0.0;

      const filterStr = style.cssFilter;
      const satMatch = filterStr.match(/saturate\(([\d.]+)\)/);
      const contMatch = filterStr.match(/contrast\(([\d.]+)\)/);
      const briMatch  = filterStr.match(/brightness\(([\d.]+)\)/);
      const grayMatch = filterStr.match(/grayscale\(([\d.]+)\)/);
      const sepMatch  = filterStr.match(/sepia\(([\d.]+)\)/);

      if (satMatch)  saturation  = parseFloat(satMatch[1]);
      if (contMatch) contrast    = parseFloat(contMatch[1]);
      if (briMatch)  brightness  = parseFloat(briMatch[1]);
      if (grayMatch) grayscale   = parseFloat(grayMatch[1]);
      if (sepMatch)  sepia       = parseFloat(sepMatch[1]);

      const colorPass = new ShaderPass({
        uniforms: {
          tDiffuse:   { value: null },
          saturation: { value: saturation },
          contrast:   { value: contrast },
          brightness: { value: brightness },
          grayscale:  { value: grayscale },
          sepia:      { value: sepia },
        },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float saturation;
          uniform float contrast;
          uniform float brightness;
          uniform float grayscale;
          uniform float sepia;
          varying vec2 vUv;

          vec3 applySaturation(vec3 color, float sat) {
            float lum = dot(color, vec3(0.299, 0.587, 0.114));
            return mix(vec3(lum), color, sat);
          }
          vec3 applyContrast(vec3 color, float con) {
            return (color - 0.5) * con + 0.5;
          }
          vec3 applySepia(vec3 color, float amount) {
            vec3 s = vec3(
              dot(color, vec3(0.393, 0.769, 0.189)),
              dot(color, vec3(0.349, 0.686, 0.168)),
              dot(color, vec3(0.272, 0.534, 0.131))
            );
            return mix(color, s, amount);
          }

          void main() {
            vec4 tex = texture2D(tDiffuse, vUv);
            vec3 color = tex.rgb;
            color *= brightness;
            color = applySaturation(color, saturation);
            color = applyContrast(color, contrast);
            float lum = dot(color, vec3(0.299, 0.587, 0.114));
            color = mix(color, vec3(lum), grayscale);
            color = applySepia(color, sepia);
            gl_FragColor = vec4(clamp(color, 0.0, 1.0), tex.a);
          }
        `,
      });
      composer.addPass(colorPass);
    }

    // ── Vignette pass ─────────────────────────────────────────────────────────
    if (style.passes?.includes('vignette')) {
      const vignettePass = new ShaderPass({
        uniforms: {
          tDiffuse: { value: null },
          strength: { value: 0.6 },
        },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float strength;
          varying vec2 vUv;
          void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            vec2 uv = vUv - 0.5;
            float vignette = 1.0 - dot(uv, uv) * strength * 2.0;
            gl_FragColor = vec4(color.rgb * clamp(vignette, 0.0, 1.0), color.a);
          }
        `,
      });
      composer.addPass(vignettePass);
    }

    // ── Thermal color map shader ──────────────────────────────────────────────
    if (style.passes?.includes('thermal_map')) {
      const thermalPass = new ShaderPass({
        uniforms: { tDiffuse: { value: null } },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          varying vec2 vUv;
          void main() {
            vec4 tex = texture2D(tDiffuse, vUv);
            float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
            vec3 cold = vec3(0.0, 0.0, 1.0);
            vec3 warm = vec3(1.0, 0.0, 0.0);
            vec3 mid  = vec3(0.0, 1.0, 0.0);
            vec3 thermal = lum < 0.5 ? mix(cold, mid, lum*2.0) : mix(mid, warm, (lum-0.5)*2.0);
            gl_FragColor = vec4(thermal, tex.a);
          }
        `,
      });
      composer.addPass(thermalPass);
    }

    // ── Output pass (final color space correction) ────────────────────────────
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    return composer;
  }

  /**
   * Render scene with GPU style passes, return output canvas
   */
  async render(scene, camera) {
    const renderer = this.threeRenderer;
    const style = this.style;
    const w = renderer.domElement.width  || renderer.domElement.clientWidth  || 1280;
    const h = renderer.domElement.height || renderer.domElement.clientHeight || 720;

    // Save renderer state
    const prevRenderTarget = renderer.getRenderTarget();
    const prevClearColor = new (await import('three')).default.Color();
    renderer.getClearColor(prevClearColor);
    const prevClearAlpha = renderer.getClearAlpha();

    // Set background if style requires it
    const prevBackground = scene.background;
    if (style.bgColor) {
      const THREE = await import('three');
      scene.background = new THREE.default.Color(style.bgColor);
    }

    try {
      // Build composer if not cached or style changed
      const composer = await this._buildComposer(scene, camera, w, h);

      // Render all passes
      renderer.setSize(w, h);
      composer.render();

      // Capture result to canvas
      const out = document.createElement('canvas');
      out.width = w; out.height = h;
      const ctx = out.getContext('2d');
      ctx.drawImage(renderer.domElement, 0, 0, w, h);

      // Apply any remaining canvas-based passes that can't be done in GPU
      const remainingPasses = (style.passes || []).filter(p => [
        'kuwahara', 'crosshatch', 'hatch', 'edge_white_bg', 'letterbox',
        'grid_overlay', 'scratch', 'smudge', 'woodblock', 'lead_lines',
        'stipple_dots', 'rain_overlay', 'hologram_glow', 'flat'
      ].includes(p));

      if (remainingPasses.length > 0) {
        // Apply remaining canvas passes from original pipeline
        let imgData = ctx.getImageData(0, 0, w, h);
        let d = imgData.data;
        for (const pass of remainingPasses) {
          switch(pass) {
            case 'kuwahara': d = kuwahara(d, w, h, 3); break;
            case 'edge_white_bg': {
              const edges = edgeDetect(d, w, h, 15);
              for (let i = 0; i < d.length; i += 4) {
                const e = edges[i+3] / 255;
                d[i] = d[i+1] = d[i+2] = Math.round(255 - e * 255);
                d[i+3] = 255;
              }
              break;
            }
            case 'letterbox': {
              const bar = Math.floor(h * 0.08);
              for (let x = 0; x < w; x++) {
                for (let row of [0, h-bar]) {
                  for (let y2 = row; y2 < Math.min(row+bar, h); y2++) {
                    const i=(y2*w+x)*4;
                    d[i]=d[i+1]=d[i+2]=0;
                  }
                }
              }
              break;
            }
            case 'grid_overlay': {
              const gs = 40;
              for (let y2 = 0; y2 < h; y2++) {
                for (let x2 = 0; x2 < w; x2++) {
                  if (y2%gs===0 || x2%gs===0) {
                    const i=(y2*w+x2)*4;
                    d[i]=0; d[i+1]=150; d[i+2]=255; d[i+3]=80;
                  }
                }
              }
              break;
            }
          }
        }
        ctx.putImageData(new ImageData(d, w, h), 0, 0);
      }

      return out;
    } finally {
      // Restore renderer state
      renderer.setRenderTarget(prevRenderTarget);
      scene.background = prevBackground;
    }
  }

  async exportPNG(scene, camera) {
    const canvas = await this.render(scene, camera);
    return canvas.toDataURL('image/png');
  }
}

// ─── Legacy skeleton renderer ─────────────────────────────────────────────────
export class SPX3DTo2DSkeletonRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.style = CINEMATIC_STYLES[options.style] || CINEMATIC_STYLES.toon;
  }
  setStyle(id) { this.style = CINEMATIC_STYLES[id] || this.style; }
  renderSkeleton(skeleton) {
    if (!skeleton?.bones) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.strokeStyle = this.style.toon ? '#00ffc8' : '#888';
    ctx.lineWidth = 2;
  }
}

'''

new_content = before_renderer + new_renderer + "\n" + after_renderer

with open(path, "w") as f:
    f.write(new_content)

print(f"✅ GPU renderer written to {path}")
print("   Uses: EffectComposer, RenderPass, OutlinePass, UnrealBloomPass,")
print("   FilmPass, HalftonePass, GlitchPass, ShaderPass (toon/color/vignette/thermal/pixelate)")
print("   Falls back to canvas for: kuwahara, edge_white_bg, letterbox, grid_overlay")
