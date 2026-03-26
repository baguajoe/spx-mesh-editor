
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { HalfEdgeMesh } from "./mesh/HalfEdgeMesh.js";
import "./App.css";
import { booleanUnion, booleanSubtract, booleanIntersect } from "./mesh/BooleanOps.js";
import { uvBoxProject, uvSphereProject, uvPlanarProject, getUVIslands } from "./mesh/UVUnwrap.js";
import { MaterialEditor } from "./components/MaterialEditor.jsx";
import { UVEditor } from "./components/UVEditor.jsx";
import { TransformGizmo } from "./components/TransformGizmo.js";
import { MeshEditorPanel } from "./components/MeshEditorPanel.jsx";
import { Outliner } from "./components/Outliner.jsx";
import { getSculptHit, applySculptStroke } from "./mesh/SculptEngine.js";
import { initVertexColors, paintVertexColor, fillVertexColor, gradientFillVertexColor } from "./mesh/VertexColorPainter.js";
import { createShapeKey, applyShapeKeys, updateBasis, buildMorphTargets } from "./mesh/ShapeKeys.js";
import { createPipe, createStaircase, createArch, createGear, createHelix, createLathe, buildProceduralMesh } from "./mesh/ProceduralMesh.js";
import { generateLOD, getLODStats, setLODLevel, restoreAutoLOD } from "./mesh/LODSystem.js";
import { createArmature, addBone, selectBone, buildBoneDisplay, moveBoneHead, moveBoneTail, parentBone, getArmatureStats, serializeArmature } from "./mesh/ArmatureSystem.js";
import { enterPoseMode, exitPoseMode, capturePose, applyPose, resetToRestPose, poseBone, rotateFKChain, savePoseToLibrary, loadPoseFromLibrary } from "./mesh/PoseMode.js";
import { initWeights, paintWeight, normalizeWeights, autoWeightByDistance, visualizeWeights } from "./mesh/WeightPainting.js";
import { applyDyntopo, dyntopoFloodFill, smoothTopology, DYNTOPO_DEFAULTS } from "./mesh/DynamicTopology.js";
import { createAction, createTrack, createStrip, evaluateNLA, pushDownAction, bakeNLA } from "./mesh/NLASystem.js";
import { parseBVH, buildSkeletonFromBVH, applyBVHFrame, buildAnimationClip } from "./mesh/BVHImporter.js";
import { bindMeshToArmature, createMixer, playClip } from "./mesh/SkinningSystem.js";
import { BRUSHES, applyBrush } from "./mesh/SculptBrushes.js";
import { voxelRemesh, quadRemesh, symmetrizeMesh, getRemeshStats } from "./mesh/RemeshSystem.js";
import { createMultiresStack, subdivideLevel, setMultiresLevel, bakeDownLevel, applyMultires, getMultiresStats } from "./mesh/MultiresSystem.js";
import { loadAlpha, applyAlphaBrush, generateProceduralAlpha } from "./mesh/AlphaBrush.js";
import { createStroke, createLayer, addStrokeToFrame, buildStrokeMesh, buildFrameMeshes, strokeToMesh, buildOnionSkin, getStrokesAtFrame, clearFrame, duplicateFrame } from "./mesh/GreasePencil.js";
import { NODE_TYPES, createNode, createGraph, addNode, connectNodes, evaluateGraph } from "./mesh/GeometryNodes.js";
import { createSpline, getThreeCurve, meshToCurve, pipeAlongCurve, loftCurves, curveToMesh, addPoint, removePoint } from "./mesh/CurveSystem.js";
import { MATERIAL_PRESETS, applyPreset, applyEdgeWear, applyCavityDirt, getPresetCategories } from "./mesh/SmartMaterials.js";
import { createPaintCanvas, createPaintTexture, applyPaintTexture, paintAtUV, fillCanvas, createLayerStack, addLayer, flattenLayers, exportTexture } from "./mesh/TexturePainter.js";
import { bakeAO, bakeNormalMap, bakeCurvature, downloadBakedMap, bakeAllMaps } from "./mesh/TextureBaker.js";
import { LIGHT_TYPES, TEMPERATURE_PRESETS, createLight, createThreePointLighting, applyTemperature, createVolumericFog, removeFog, HDRI_PRESETS, applyHDRI, addLightHelper, getSceneLights, serializeLights } from "./mesh/LightSystem.js";
import { createCamera, saveBookmark, restoreBookmark, animateCameraToBookmark, setDOF, applyCameraShake, rackFocus, dollyZoom, createCameraManager, serializeCamera } from "./mesh/CameraSystem.js";
import { EFFECT_PRESETS, LUT_PRESETS, applyColorGrade, applyLUT, applyVignette, applyFilmGrain, applyToneMap, applyChromaticAberration, applySharpen, applyPostStack } from "./mesh/PostProcessing.js";
import { DEFAULT_BONE_MAP, retargetFrame, bakeRetargetedAnimation, fixFootSliding, autoDetectBoneMap, getRetargetStats } from "./mesh/MocapRetarget.js";
import { createIKChain, solveFABRIK, setIKTarget, setIKPoleTarget, getChainEnd, solveTwoBoneIK } from "./mesh/IKSystem.js";
import { createPathTracerSettings, createWebGLPathTracer, startPathTracing, stopPathTracing, stepPathTracer, resetPathTracer, exportPathTracedFrame, getPathTracerStats, detectPathTracer } from "./mesh/PathTracer.js";
import { exportOBJ, parseOBJ, importFBXFromBackend, exportFBXToBackend, exportAlembic, exportUSD, SUPPORTED_IMPORT_FORMATS, SUPPORTED_EXPORT_FORMATS } from "./mesh/FBXPipeline.js";
import { registerPlugin, unregisterPlugin, getPlugins, getAllPlugins, initPluginAPI, loadPluginFromURL, loadPluginFromFile, BUILTIN_BRUSH_PLUGINS, PRESET_CATEGORIES, createPresetMarketplace, COMMUNITY_PRESETS, searchPresets, installPreset, uninstallPreset, isPresetInstalled, getInstalledPresets, saveCustomPreset, loadCustomPresets, getPluginStats } from "./mesh/PluginSystem.js";
import { GraphEditor } from "./components/GraphEditor.jsx";
import { DRIVER_TYPES, createDriver, createVariable, evaluateDriver, resolveVariable, applyDriver, applyAllDrivers, DRIVER_PRESETS } from "./mesh/DriverSystem.js";
import { CONSTRAINT_TYPES, createConstraint, applyConstraint, applyAllConstraints, applyLookAt, applyFloor, applyStretchTo } from "./mesh/ConstraintSystem.js";
import { createBakeBuffer, bakeFrame, restoreFrame, createRigidBody, stepRigidBody, bakeRigidBodies, applyBakedFrame, fractureMesh } from "./mesh/PhysicsBake.js";
import { WALK_STYLES, generateWalkCycle, applyWalkCycleFrame, generateIdleCycle, generateBreathingCycle } from "./mesh/WalkCycleGenerator.js";
import { createDynaMeshSettings, dynaMeshRemesh, checkDynaMeshTrigger, getDynaMeshStats } from "./mesh/DynaMeshSystem.js";
import { createHairStrand, emitHair, buildHairLines, buildHairTubes, clumpHair, HAIR_PRESETS, applyHairPreset, getHairStats, serializeHair } from "./mesh/HairSystem.js";
import { createPBRMaterial, applyPBRMaps, SSS_PRESETS, createSSSMaterial, TRANSMISSION_PRESETS, createTransmissionMaterial, createDisplacementTexture, denoiseCanvas, createRenderQueue, addRenderJob, runRenderQueue, RENDER_PRESETS, applyRenderPreset, TONE_MAP_MODES, applyToneMappingMode, captureFrame, downloadFrame, getRenderStats } from "./mesh/RenderSystem.js";
import { EMITTER_TYPES, VFX_PRESETS, createEmitter, emitParticles, stepEmitter, buildParticleSystem, updateParticleSystem, createDestructionEffect, stepDestructionFrags, getEmitterStats } from "./mesh/VFXSystem.js";
import { createSPHParticle, createFluidSettings, FLUID_PRESETS, stepSPH, emitFluid, buildFluidMesh, updateFluidMesh, createPyroEmitter, stepPyro, getFluidStats } from "./mesh/FluidSystem.js";
import { SCENE_PRESETS, ENVIRONMENT_PRESETS, createScene, createSceneObject as createSCObject, addObjectToScene, removeObjectFromScene, duplicateObject, parentObjects, getObjectHierarchy, createCollection, applyLightingSetup, applyEnvironment, buildEnvironmentMesh, serializeScene, deserializeScene, getSceneStats as getSceneCreatorStats } from "./mesh/SceneCreator.js";
import { ADVANCED_BRUSHES, createSculptLayer, addSculptLayer, applyLayerDelta, captureBasePositions, evaluateSculptLayers, flattenLayerToMesh, mergeLayers, getSculptLayerStats, applyClayBrush, applyScrapeBrush, applyFlattenBrush, applyMaskBrush, clearMask, invertMask, applySymmetryStroke } from "./mesh/SculptLayers.js";
import { triangulateNgon, buildNgonGeometry, addNgonFace, getNgonFaces, dissolveEdge, bridgeFaces, gridFill, getNgonStats, convertNgonsToTris } from "./mesh/NgonSupport.js";
import { VC_BLEND_MODES, initVCAdvanced, addVCLayer, removeVCLayer, paintVCAdvanced, fillVCLayer, flattenVCLayers, smearVC, getVCStats } from "./mesh/VertexColorAdvanced.js";
import { createAdvancedShapeKey, addAdvancedShapeKey, evaluateShapeKeysAdvanced, mirrorShapeKey, blendShapeKeys, driverShapeKey, updateDriverKeys, exportShapeKeysGLTF, getShapeKeyStats } from "./mesh/ShapeKeysAdvanced.js";
import { GLTF_EXTENSIONS, loadGLTFAdvanced, exportGLTFAdvanced, buildGLTFMorphTargets, applyGLTFMorphWeights, extractGLTFAnimations, getGLTFStats } from "./mesh/GLTFAdvanced.js";
import { heatMapWeights, dualQuatFromBone, blendDualQuats, createBoneEnvelope, weighByEnvelope, bindSkeletonAdvanced, normalizeAllWeights, getBindingStats } from "./mesh/SkeletalBinding.js";
import { DOPPELFLEX_LANDMARK_MAP, DOPPELFLEX_BONE_HIERARCHY, buildRigFromDoppelflex, applyDoppelflexFrame, retargetDoppelflexToSPX, buildThreeSkeletonFromRig, getRigStats } from "./mesh/DoppelflexRig.js";
import { COMPOSITOR_NODE_TYPES, createCompositorNode, createCompositorGraph, addCompositorNode, connectCompositorNodes, removeCompositorNode, evaluateCompositorGraph, getCompositorStats, applyCompositorPreset } from "./mesh/NodeCompositor.js";
import { ASSET_TYPES, createAssetLibrary, addAsset, searchAssets, removeAsset, toggleFavorite, generateThumbnail, PROCEDURAL_ANIMATIONS, applyProceduralAnimation, createAudioAnalyzer, applyAudioToMesh, optimizeScene, getSceneStats } from "./mesh/AssetLibrary.js";
import { createUser, createCommentPin, createVersionSnapshot, restoreVersion, createCollabSession, connectSession, broadcastOperation, broadcastComment, disconnectSession, buildCommentPinMesh, getCollabStats } from "./mesh/CollaborationSystem.js";
import { SHADER_PRESETS, createHairShaderMaterial, createToonMaterial, createPBRShaderMaterial, createHolographicMaterial, createDissolveMaterial, createOutlineMaterial, addOutlineToMesh, applyShaderPreset, updateHolographicTime, setDissolveAmount } from "./mesh/GLSLShaders.js";
import { createPostPassManager, createBloomPass, createSSAOPass, createDOFPass, createChromaticAberrationPass } from "./mesh/PostPassShaders.js";
import { createUDIMLayout, initUDIMLayout, paintUDIM, fillUDIMTile, exportUDIMTile, exportAllUDIMTiles, applyUDIMToMaterial, remapUVsToUDIM, buildUDIMAtlas, getUDIMStats, getUDIMTileFromUV, udimTileFromUV } from "./mesh/UDIMSystem.js";
import { marchingCubes, meshToScalarField, marchingCubesRemesh, fluidSurfaceMesh, getMarchingCubesStats } from "./mesh/MarchingCubes.js";
import { createGPUParticleSystem, emitGPUParticles, stepGPUParticles, FORCE_FIELD_TYPES, createForceField, burstEmit, continuousEmit, createSpriteSheet, updateSpriteSheet, getGPUParticleStats } from "./mesh/GPUParticles.js";
import { detectWebGPU, getWebGLInfo, createPMREMFromScene, applyIBLToScene, setupCascadedShadows, enableShadowsOnScene, createNPROutlinePass, createRenderFarm, addRenderFarmJob, cancelRenderJob, removeRenderJob, runNextRenderJob, getRenderFarmStats, JOB_STATUS } from "./mesh/RenderFarm.js";
import { createClothWorker, runClothWorker, createSPHWorker, runSPHWorker, createWorkerPool, getWorkerSupport } from "./mesh/WorkerBridge.js";
import { THEMES, applyTheme, saveThemeToStorage, loadThemeFromStorage, SHORTCUT_CATEGORIES, TOUR_STEPS, createTourState, advanceTour, SPX_EXPORT_FORMATS, buildSPXExportPayload, exportToStreamPireX, downloadSPXFile } from "./mesh/UISystem.js";
import { buildFullConstraints, createSpatialHash, applySelfCollisionHash, addSewingConstraint, applyWindTurbulence, stepClothUpgraded } from "./mesh/ClothUpgrade.js";
import { applyStrandCollision, createDensityMap, sampleDensityMap, generateBraidPreset, generateBunPreset, generatePonytailPreset, emitHairFromUV, getHairUpgradeStats } from "./mesh/HairUpgrade.js";
import { createSplineIK, solveSplineIK, createIKFKBlend, updateIKFKBlend, captureFKPose, captureIKPose, evaluateNLAAdvanced, buildGLTFAnimationClip, updateShapeKeyDrivers, computeEnvelopeWeights } from "./mesh/AnimationUpgrade.js";
import { isElectron, isBrowser, openFile, saveFile, MENU_ITEMS, KEYBOARD_SHORTCUTS, registerShortcuts, checkForUpdates, isFeatureAvailable, getPlatformInfo, DESKTOP_ONLY_FEATURES } from "./mesh/ElectronBridge.js";
import { createVolumetricSettings, applyVolumetricFog, applyHeightFog, createGodRayEffect, ATMOSPHERE_PRESETS, applyAtmospherePreset, createLightShaft } from "./mesh/VolumetricSystem.js";
import { PASS_TYPES, createPassStack, renderAllPasses, downloadPass, compositePasses } from "./mesh/RenderPasses.js";
import { createReflectionProbe, updateReflectionProbe, applyProbeToMaterial, applyProbeToScene, createAmbientProbe, createProbeManager, getProbeStats } from "./mesh/EnvironmentProbes.js";
import { GROOM_BRUSHES, applyGroomBrush } from "./mesh/HairGrooming.js";
import { createHairPhysicsSettings, stepHairPhysics, addWindForce, addCollider, resetHairToRest, bakeHairPhysics } from "./mesh/HairPhysics.js";
import { generateHairCards, buildHairCardMesh, mergeHairCards, getHairCardStats } from "./mesh/HairCards.js";
import { HAIR_SHADER_PRESETS, createHairMaterial, createAnisotropicHairMaterial, applyHairPresetToMesh, createHairAlphaTexture } from "./mesh/HairShader.js";
import { createCloth, stepCloth, CLOTH_PRESETS, applyClothPreset, resetCloth, getClothStats } from "./mesh/ClothSystem.js";
import { pinVertex, unpinVertex, pinVerticesInRadius, pinTopRow, pinToBone, getPinnedVertices, visualizePins } from "./mesh/ClothPinning.js";
import { createSphereCollider, createPlaneCollider, applyCollisions, applySelfCollision, createCollidersFromMesh, visualizeCollider } from "./mesh/ClothCollision.js";
import { createRetopoSettings, quadDominantRetopo, detectHardEdges, getRetopoStats } from "./mesh/AutoRetopo.js";
import { generateFibermesh, buildFibermeshLines, buildFibermeshTubes, combStrands, adjustLength, clumpStrands, puffStrands, smoothStrands, getFibermeshStats, serializeFibermesh } from "./mesh/FibermeshSystem.js";
import { AnimationTimeline } from "./components/AnimationTimeline.jsx";
import { createInstances, flattenInstances } from "./mesh/Instancing.js";
import { fixNormals, removeDoubles, removeDegenerates, fillHoles, fullRepair } from "./mesh/MeshRepair.js";
import {

  createSceneObject,
  buildPrimitiveMesh,
  saveScene,
  loadSceneData,
  exportSceneGLB,
  pushSceneToStreamPireX,
} from "./components/SceneManager.js";

const TOOLS = [
  { id: "select", icon: "↖", label: "Select (S)" },
  { id: "loop_cut", icon: "⊞", label: "Loop Cut (Ctrl+R)" },
  { id: "edge_slide", icon: "⇔", label: "Edge Slide (G+G)" },
  { id: "knife", icon: "✂", label: "Knife (K)" },
  { id: "extrude", icon: "⬡", label: "Extrude (E)" },
  { id: "grab", icon: "✋", label: "Grab (G)" },
  { id: "rotate", icon: "↺", label: "Rotate (R)" },
  { id: "scale", icon: "⤢", label: "Scale (S)" },
];

const PRIMITIVES = [
  { id: "box", label: "Box" },
  { id: "sphere", label: "Sphere" },
  { id: "cylinder", label: "Cylinder" },
  { id: "torus", label: "Torus" },
  { id: "plane", label: "Plane" },
];

const COLORS = {
  bg: "#1d1d1d",
  panel: "#252525",
  border: "#3a3a3a",
  teal: "#5b9bd5",
  orange: "#c07030",
  selected: "#c07030",
  hover: "#5b9bd5",
  vert: "#ffffff",
  edge: "#5b9bd5",
  face: "#5b9bd522",
  accent: "#4772b3",
  text: "#c8c8c8",
  textDim: "#888",
};

export default function App() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const rafRef = useRef(null);
  const meshRef = useRef(null);
  const heMeshRef = useRef(null);
  const orbitRef = useRef(null);
  const orbitState = useRef({ theta: 0.6, phi: 1.1, radius: 5 });
  const fileInputRef = useRef(null);
  const gizmoRef = useRef(null);
  const [gizmoMode, setGizmoMode] = useState("move"); // move|rotate|scale
  const [gizmoActive, setGizmoActive] = useState(false);
  const gizmoDragging = useRef(false);
  const [bevelAmt, setBevelAmt] = useState(0.1);
  const [insetAmt, setInsetAmt] = useState(0.15);
  const [mirrorAxis, setMirrorAxis] = useState("x");
  // ── Sessions 13-15 state ──────────────────────────────────────────────────
  const [showMatEditor, setShowMatEditor] = useState(false);
  const [matProps, setMatProps] = useState({ color: "#888888", roughness: 0.5, metalness: 0.1, opacity: 1, emissive: "#000000", emissiveIntensity: 0, wireframe: false, transparent: false, side: "front" });
  const [propEdit, setPropEdit] = useState(false);
  const [propRadius, setPropRadius] = useState(1.0);
  const [propFalloff, setPropFalloff] = useState("smooth"); // smooth|linear|sharp
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapSize, setSnapSize] = useState(0.25);

  // ── Boolean + UV state ─────────────────────────────────────────────────────
  const [booleanMode, setBooleanMode] = useState("union");
  const [showUVEditor, setShowUVEditor] = useState(false);
  const [uvTriangles, setUVTriangles] = useState([]);
  const [uvProjection, setUVProjection] = useState("box");

  const meshBRef = useRef(null); // second mesh for boolean ops

  // ── Sessions 1-3: Scene state ────────────────────────────────────────────────
  const [sceneObjects, setSceneObjects] = useState([]);
  const [activeObjId, setActiveObjId] = useState(null);
  const sceneLoadInput = useRef(null);

  // helpers
  const getActiveObj = () => sceneObjects.find(o => o.id === activeObjId) || null;

  const addSceneObject = (type) => {
    const mesh = buildPrimitiveMesh(type);
    mesh.position.set(
      (Math.random() - 0.5) * 2,
      0,
      (Math.random() - 0.5) * 2
    );
    sceneRef.current?.add(mesh);
    const obj = createSceneObject(type, null, mesh);
    setSceneObjects(prev => {
      const next = [...prev, obj];
      // also update meshRef to point to latest active
      meshRef.current = mesh;
      heMeshRef.current = null;
      setActiveObjId(obj.id);
      return next;
    });
    setStatus(`Added ${type}`);
  };

  const selectSceneObject = (id) => {
    const obj = sceneObjects.find(o => o.id === id);
    if (!obj) return;
    setActiveObjId(id);
    meshRef.current = obj.mesh;
    if (obj.mesh) {
      const box = new THREE.Box3().setFromObject(obj.mesh);
      const center = box.getCenter(new THREE.Vector3());
      orbitState.current.radius = Math.max(
        box.getSize(new THREE.Vector3()).length() * 2, 3
      );
    }
    setStatus(`Selected: ${obj.name}`);
  };

  const renameSceneObject = (id, name) => {
    setSceneObjects(prev => prev.map(o => o.id === id ? { ...o, name } : o));
  };

  const deleteSceneObject = (id) => {
    const obj = sceneObjects.find(o => o.id === id);
    if (obj?.mesh) sceneRef.current?.remove(obj.mesh);
    setSceneObjects(prev => {
      const next = prev.filter(o => o.id !== id && o.parentId !== id);
      if (activeObjId === id) {
        const fallback = next[0];
        setActiveObjId(fallback?.id || null);
        meshRef.current = fallback?.mesh || null;
      }
      return next;
    });
    setStatus("Object deleted");
  };

  const toggleSceneObjectVisible = (id) => {
    setSceneObjects(prev => prev.map(o => {
      if (o.id !== id) return o;
      const vis = o.visible === false ? true : false;
      if (o.mesh) o.mesh.visible = vis;
      return { ...o, visible: vis };
    }));
  };

  const setParent = (childId, parentId) => {
    setSceneObjects(prev => prev.map(o =>
      o.id === childId ? { ...o, parentId } : o
    ));
  };

  const groupSelected = () => {
    if (!activeObjId) return;
    const group = new THREE.Group();
    sceneRef.current?.add(group);
    const groupObj = createSceneObject("group", "Group", group);
    setSceneObjects(prev => {
      const next = [...prev, groupObj];
      return next.map(o => o.id === activeObjId ? { ...o, parentId: groupObj.id } : o);
    });
    setStatus("Grouped");
  };

  const ungroupSelected = () => {
    const obj = getActiveObj();
    if (!obj || obj.type !== "group") return;
    setSceneObjects(prev => prev.map(o =>
      o.parentId === obj.id ? { ...o, parentId: null } : o
    ).filter(o => o.id !== obj.id));
    if (obj.mesh) sceneRef.current?.remove(obj.mesh);
    setStatus("Ungrouped");
  };

  const handleSaveScene = () => {
    saveScene(sceneObjects);
    setStatus("Scene saved to localStorage");
  };

  const handleLoadScene = () => {
    const data = loadSceneData();
    if (!data) { setStatus("No saved scene found"); return; }
    // Clear existing
    sceneObjects.forEach(o => { if (o.mesh) sceneRef.current?.remove(o.mesh); });
    // Rebuild from saved transforms
    const rebuilt = data.objects.map(saved => {
      const mesh = buildPrimitiveMesh(saved.type);
      mesh.position.fromArray(saved.position || [0, 0, 0]);
      if (saved.rotation) mesh.rotation.fromArray(saved.rotation);
      if (saved.scale) mesh.scale.fromArray(saved.scale);
      mesh.visible = saved.visible !== false;
      sceneRef.current?.add(mesh);
      return { ...saved, mesh };
    });
    setSceneObjects(rebuilt);
    setActiveObjId(rebuilt[0]?.id || null);
    meshRef.current = rebuilt[0]?.mesh || null;
    setStatus(`Scene loaded — ${rebuilt.length} objects`);
  };

  const handleExportScene = () => {
    exportSceneGLB(sceneObjects).then(() => setStatus("Scene exported as GLB"));
  };


  // Selection overlays
  const vertDotsRef = useRef(null); // THREE.Points
  const edgeLinesRef = useRef(null); // THREE.LineSegments
  const faceMeshRef = useRef(null); // THREE.Mesh (transparent)
  const previewLineRef = useRef(null); // loop cut preview line

  // Knife state
  const knifeRef = useRef({ active: false, points: [], line: null });

  // Edge slide state
  const slideRef = useRef({ active: false, startX: 0, edge: null });

  const [activeTool, setActiveTool] = useState("select");
  const [editMode, setEditMode] = useState("object");
  // ── Sessions 4-5: Sculpt state ────────────────────────────────────────────
  const [sculptBrush, setSculptBrush] = useState("push");
  const [sculptRadius, setSculptRadius] = useState(0.8);
  const [sculptStrength, setSculptStrength] = useState(0.02);
  const [sculptFalloff, setSculptFalloff] = useState("smooth");
  const [sculptSymX, setSculptSymX] = useState(false);
  const sculptingRef = useRef(false);
  const [dyntopoEnabled, setDyntopoEnabled] = useState(false);
  const lazyMouseRef = useRef({ x: 0, y: 0 });
  const sculptStrokeCountRef = useRef(0);
  // ── Session 8: Vertex color paint state ──────────────────────────────────
  const [vcPaintColor, setVcPaintColor] = useState("#ff6600");
  const [vcPaintColor2, setVcPaintColor2] = useState("#00ffc8");
  const [vcRadius, setVcRadius] = useState(0.6);
  const [vcStrength, setVcStrength] = useState(0.8);
  const [vcFalloff, setVcFalloff] = useState("smooth");
  const vcPaintingRef = useRef(false);
  // ── Sessions 9-10: Shape Keys state ──────────────────────────────────────
  const [shapeKeys, setShapeKeys] = useState([]);
  const shapeKeysRef = useRef([]);
  // ── Sessions 11-13: Procedural + Repair state ─────────────────────────────
  const [procType, setProcType] = useState("pipe");
  const [procParams, setProcParams] = useState({
    radius: 0.3, innerRadius: 0.2, height: 2, segments: 32,
    steps: 8, width: 2, stepHeight: 0.2, stepDepth: 0.3,
    thickness: 0.3, depth: 0.4,
    teeth: 12, toothHeight: 0.2,
    turns: 3, tubeRadius: 0.1,
  });
  const [repairStatus, setRepairStatus] = useState(null);
  // ── Sessions 14-15: LOD + Instancing state ───────────────────────────────
  const [lodObject, setLodObject] = useState(null);
  const [lodStats, setLodStats] = useState([]);
  const [lodLevel, setLodLevelState] = useState("auto");
  const [instanceCount, setInstanceCount] = useState(10);
  const [instanceLayout, setInstanceLayout] = useState("scatter");
  const [instanceSpread, setInstanceSpread] = useState(5);
  const [selectMode, setSelectMode] = useState("vert");
  const [stats, setStats] = useState({ vertices: 0, edges: 0, faces: 0, halfEdges: 0 });
  const [status, setStatus] = useState("Add a primitive to start");
  const [loopCutT, setLoopCutT] = useState(0.5);
  const [wireframe, setWireframe] = useState(false);
  const [selectedVerts, setSelectedVerts] = useState(new Set());
  const [selectedEdges, setSelectedEdges] = useState(new Set());
  const [selectedFaces, setSelectedFaces] = useState(new Set());
  const [showPathTracerPanel, setShowPathTracerPanel] = useState(false);
  const [showPipelinePanel, setShowPipelinePanel] = useState(false);
  const [showPluginPanel, setShowPluginPanel] = useState(false);
  const [showMarketPanel, setShowMarketPanel] = useState(false);
  const [knifePoints, setKnifePoints] = useState([]);
  const [slideAmount, setSlideAmount] = useState(0);
  const [history, setHistory] = useState([]);
  const activeToolRef = useRef("select");
  const editModeRef = useRef("object");
  const selectModeRef = useRef("vert");

  // Keep refs in sync
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { editModeRef.current = editMode; }, [editMode]);
  useEffect(() => { selectModeRef.current = selectMode; }, [selectMode]);

  // ── Init Three.js ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || rendererRef.current) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);
    scene.add(new THREE.GridHelper(10, 20, COLORS.border, COLORS.border));
    scene.add(new THREE.AxesHelper(2));
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, canvas.clientWidth / canvas.clientHeight, 0.01, 1000);
    camera.position.set(3, 3, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 8, 5); dir.castShadow = true;
    scene.add(dir);
    const fill = new THREE.DirectionalLight(0x00ffc8, 0.2);
    fill.position.set(-3, -2, -3);
    scene.add(fill);


    // Init transform gizmo
    setTimeout(() => {
      if (sceneRef.current && !gizmoRef.current) {
        gizmoRef.current = new TransformGizmo(sceneRef.current);
        gizmoRef.current.group.visible = false;
      }
    }, 200);

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  // ── Push history ───────────────────────────────────────────────────────────
  const pushHistory = useCallback(() => {
    const heMesh = heMeshRef.current; if (!heMesh) return;
    const { positions, indices } = heMesh.toBufferGeometry();
    setHistory(h => [...h.slice(-20), { positions: [...positions], indices: [...indices] }]);
  }, []);

  const undo = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      const heMesh = heMeshRef.current;
      const mesh = meshRef.current;
      if (!heMesh || !mesh) return h;
      // Rebuild geo from saved state
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(prev.positions, 3));
      geo.setIndex(new THREE.Uint32BufferAttribute(prev.indices, 1));
      geo.computeVertexNormals();
      if (mesh.isMesh) { mesh.geometry.dispose(); mesh.geometry = geo; }
      // Rebuild HE mesh
      heMeshRef.current = HalfEdgeMesh.fromBufferGeometry(geo);
      setStats(heMeshRef.current.stats());
      setStatus("Undo");
      return h.slice(0, -1);
    });
  }, []);

  // ── Add primitive ──────────────────────────────────────────────────────────
  const addPrimitive = useCallback((type) => {
    // Session 2: register in scene outliner
    addSceneObject(type);

    const scene = sceneRef.current; if (!scene) return;
    clearOverlays();
    if (meshRef.current) scene.remove(meshRef.current);

    let geo;
    if (type === "box") geo = new THREE.BoxGeometry(1, 1, 1, 8, 8, 8);
    else if (type === "sphere") geo = new THREE.SphereGeometry(0.7, 64, 48);
    else if (type === "cylinder") geo = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 48, 12);
    else if (type === "torus") geo = new THREE.TorusGeometry(0.6, 0.25, 32, 80);
    else if (type === "plane") geo = new THREE.PlaneGeometry(2, 2, 32, 32);
    else if (type === "icosphere") geo = new THREE.IcosahedronGeometry(0.7, 2);
    else geo = new THREE.BoxGeometry(1, 1, 1, 8, 8, 8);

    geo = geo.toNonIndexed();
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: "#888888", roughness: 0.5, metalness: 0.1, wireframe: wireframe,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    scene.add(mesh);
    meshRef.current = mesh;

    const heMesh = HalfEdgeMesh.fromBufferGeometry(geo);
    heMeshRef.current = heMesh;
    const s = heMesh.stats();
    setStats(s);
    setStatus(`Added ${type} — ${s.vertices} verts · ${s.faces} faces · ${s.edges} edges`);
    setSelectedVerts(new Set()); setSelectedEdges(new Set()); setSelectedFaces(new Set());
    setTimeout(() => gizmoRef.current?.attach(mesh), 100); setGizmoActive(true);
  }, [wireframe]);

  // ── Clear overlays ─────────────────────────────────────────────────────────
  const clearOverlays = () => {
    const scene = sceneRef.current; if (!scene) return;
    [vertDotsRef, edgeLinesRef, faceMeshRef, previewLineRef].forEach(r => {
      if (r.current) { scene.remove(r.current); r.current = null; }
    });
  };

  // ── Build vertex overlay ───────────────────────────────────────────────────
  const buildVertexOverlay = useCallback((selVerts = selectedVerts) => {
    const scene = sceneRef.current;
    const heMesh = heMeshRef.current;
    const parent = meshRef.current;
    if (!scene || !heMesh || !parent) return;

    if (vertDotsRef.current) scene.remove(vertDotsRef.current);

    const positions = [];
    const colors = [];
    heMesh.vertices.forEach(v => {
      positions.push(v.x, v.y, v.z);
      const sel = selVerts.has(v.id);
      colors.push(sel ? 1 : 0.8, sel ? 0.4 : 0.8, sel ? 0 : 0.8);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, depthTest: false });
    const pts = new THREE.Points(geo, mat);
    pts.position.copy(parent.position);
    scene.add(pts);
    vertDotsRef.current = pts;
  }, [selectedVerts]);

  // ── Build edge overlay ─────────────────────────────────────────────────────
  const buildEdgeOverlay = useCallback((selEdges = selectedEdges) => {
    const scene = sceneRef.current;
    const heMesh = heMeshRef.current;
    const parent = meshRef.current;
    if (!scene || !heMesh || !parent) return;

    if (edgeLinesRef.current) scene.remove(edgeLinesRef.current);

    const positions = [];
    const colors = [];
    const seen = new Set();
    heMesh.halfEdges.forEach(e => {
      if (!e.twin || seen.has(e.id) || seen.has(e.twin.id)) return;
      seen.add(e.id);
      const a = e.vertex, b = e.twin.vertex;
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const sel = selEdges.has(e.id) || selEdges.has(e.twin?.id);
      colors.push(sel ? 1 : 0.2, sel ? 0.4 : 0.4, sel ? 0 : 1, sel ? 1 : 0.2, sel ? 0.4 : 0.4, sel ? 0 : 1);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, depthTest: false, linewidth: 2 });
    const lines = new THREE.LineSegments(geo, mat);
    lines.position.copy(parent.position);
    scene.add(lines);
    edgeLinesRef.current = lines;
  }, [selectedEdges]);

  // ── Build loop cut preview line ────────────────────────────────────────────
  const buildLoopCutPreview = useCallback((t) => {
    const scene = sceneRef.current;
    const heMesh = heMeshRef.current;
    if (!scene || !heMesh) return;

    if (previewLineRef.current) { scene.remove(previewLineRef.current); previewLineRef.current = null; }

    const edges = [...heMesh.halfEdges.values()];
    const pivot = edges[Math.floor(edges.length / 4)];
    if (!pivot) return;

    const loop = pivot.edgeLoop();
    if (loop.length < 2) return;

    const pts = loop.map(e => {
      const a = e.vertex, b = e.next?.vertex;
      if (!b) return new THREE.Vector3(a.x, a.y, a.z);
      return new THREE.Vector3(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t,
        a.z + (b.z - a.z) * t,
      );
    });
    pts.push(pts[0]); // close loop

    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: COLORS.teal, depthTest: false, linewidth: 3 });
    const line = new THREE.Line(geo, mat);
    scene.add(line);
    previewLineRef.current = line;
  }, []);

  // Update preview when t changes
  useEffect(() => {
    if (activeTool === "loop_cut" && editMode === "edit") buildLoopCutPreview(loopCutT);
  }, [loopCutT, activeTool, editMode, buildLoopCutPreview]);

  // ── Rebuild geometry from HE mesh ─────────────────────────────────────────
  const rebuildMeshGeometry = useCallback(() => {
    const heMesh = heMeshRef.current;
    const mesh = meshRef.current;
    if (!heMesh || !mesh) return;
    const { positions, indices } = heMesh.toBufferGeometry();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    if (mesh.isMesh) { mesh.geometry.dispose(); mesh.geometry = geo; }
    if (editMode === "edit") {
      if (selectMode === "vert") buildVertexOverlay();
      if (selectMode === "edge") buildEdgeOverlay();
    }
  }, [editMode, selectMode, buildVertexOverlay, buildEdgeOverlay]);

  // ── Raycasting for selection ───────────────────────────────────────────────
  const raycast = useCallback((e) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    const mesh = meshRef.current;
    if (!canvas || !camera || !mesh) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: mx, y: my }, camera);
    raycaster.params.Points.threshold = 0.1;
    raycaster.params.Line.threshold = 0.05;
    return raycaster;
  }, []);

  // ── Click for selection ────────────────────────────────────────────────────
  const onCanvasClick = useCallback((e) => {
    if (editModeRef.current !== "edit") return;
    if (activeToolRef.current === "knife") return; // knife handles own clicks
    const raycaster = raycast(e);
    if (!raycaster) return;
    const heMesh = heMeshRef.current;
    if (!heMesh) return;

    if (selectModeRef.current === "vert") {
      // Find closest vertex
      let closest = null, minDist = Infinity;
      heMesh.vertices.forEach(v => {
        const wp = new THREE.Vector3(v.x, v.y, v.z);
        const sp = wp.clone().project(cameraRef.current);
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const sx = (sp.x + 1) / 2 * rect.width + rect.left;
        const sy = (-sp.y + 1) / 2 * rect.height + rect.top;
        const d = Math.hypot(e.clientX - sx, e.clientY - sy);
        if (d < minDist && d < 20) { minDist = d; closest = v; }
      });
      if (closest) {
        setSelectedVerts(sv => {
          const next = new Set(sv);
          if (next.has(closest.id)) next.delete(closest.id);
          else next.add(closest.id);
          buildVertexOverlay(next);
          return next;
        });
        setStatus(`Vertex ${closest.id} selected`);
      }
    } else if (selectModeRef.current === "edge") {
      // Find closest edge midpoint
      let closest = null, minDist = Infinity;
      const seen = new Set();
      heMesh.halfEdges.forEach(edge => {
        if (!edge.twin || seen.has(edge.id) || seen.has(edge.twin.id)) return;
        seen.add(edge.id);
        const a = edge.vertex, b = edge.twin.vertex;
        const mid = new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
        const sp = mid.clone().project(cameraRef.current);
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const sx = (sp.x + 1) / 2 * rect.width + rect.left;
        const sy = (-sp.y + 1) / 2 * rect.height + rect.top;
        const d = Math.hypot(e.clientX - sx, e.clientY - sy);
        if (d < minDist && d < 25) { minDist = d; closest = edge; }
      });
      if (closest) {
        setSelectedEdges(se => {
          const next = new Set(se);
          if (next.has(closest.id)) next.delete(closest.id);
          else { next.add(closest.id); if (closest.twin) next.add(closest.twin.id); }
          buildEdgeOverlay(next);
          return next;
        });
        setStatus(`Edge ${closest.id} selected`);
      }
    } else if (selectModeRef.current === "face") {
      const hits = raycaster.intersectObject(meshRef.current, true);
      if (hits.length > 0) {
        const faceIdx = hits[0].faceIndex;
        setSelectedFaces(sf => {
          const next = new Set(sf);
          if (next.has(faceIdx)) next.delete(faceIdx); else next.add(faceIdx);
          return next;
        });
        setStatus(`Face ${faceIdx} selected`);
      }
    }
  }, [raycast, buildVertexOverlay, buildEdgeOverlay]);

  // ── Knife tool ─────────────────────────────────────────────────────────────
  const onKnifeClick = useCallback((e) => {
    if (vcPaintingRef.current && editModeRef.current === "paint") {
      applyVertexPaint(e);
      return;
    }
    if (sculptingRef.current && editModeRef.current === "sculpt") {
      applySculpt(e);
      return;
    }
    if (activeToolRef.current !== "knife" || editModeRef.current !== "edit") return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const knife = knifeRef.current;
    knife.points.push({ x, y });
    setKnifePoints([...knife.points]);

    if (knife.points.length >= 2) {
      // Draw knife line on canvas overlay (handled in JSX)
      // When user presses Enter or double-clicks: execute cut
    }
    setStatus(`Knife: ${knife.points.length} point(s) — press Enter to cut, Esc to cancel`);
  }, []);

  const executeKnifeCut = useCallback(() => {
    const knife = knifeRef.current;
    const heMesh = heMeshRef.current;
    if (!heMesh || knife.points.length < 2) return;
    pushHistory();
    // Use last two knife points to define cut plane
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const p1 = knife.points[0], p2 = knife.points[knife.points.length - 1];
    // Convert screen points to world plane normal
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const planeNormal = { x: -dy / rect.width * 2, y: dx / rect.height * 2, z: 0 };
    const midScreen = {
      x: ((p1.x + p2.x) / 2 / rect.width) * 2 - 1,
      y: -((p1.y + p2.y) / 2 / rect.height) * 2 + 1,
    };
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(midScreen, cameraRef.current);
    const hits = raycaster.intersectObject(meshRef.current, true);
    const planePoint = hits.length > 0 ? hits[0].point : { x: 0, y: 0, z: 0 };

    const newVerts = heMesh.knifeCut(planeNormal, planePoint);
    rebuildMeshGeometry();
    setStats(heMesh.stats());
    knife.points = [];
    setKnifePoints([]);
    setStatus(`Knife cut — added ${newVerts.length} vertices`);
  }, [pushHistory, rebuildMeshGeometry]);

  // ── Edge slide ─────────────────────────────────────────────────────────────
  const startEdgeSlide = useCallback(() => {
    const heMesh = heMeshRef.current; if (!heMesh) return;
    if (selectedEdges.size === 0) { setStatus("Select an edge first (Edge mode), then use G+G"); return; }
    const edgeId = [...selectedEdges][0];
    const edge = heMesh.halfEdges.get(edgeId);
    if (!edge) return;
    slideRef.current = { active: true, edge, startAmount: 0 };
    setStatus("Edge slide active — move mouse left/right, click to confirm");
  }, [selectedEdges]);

  const onSlideMouse = useCallback((e) => {
    if (!slideRef.current?.active) return;
    const dx = (e.movementX || 0) * 0.005;
    const newAmount = Math.max(-0.9, Math.min(0.9, slideRef.current.startAmount + dx));
    slideRef.current.startAmount = newAmount;
    setSlideAmount(newAmount);
    const heMesh = heMeshRef.current; if (!heMesh) return;
    heMesh.slideEdge(slideRef.current.edge, newAmount);
    rebuildMeshGeometry();
  }, [rebuildMeshGeometry]);

  const confirmEdgeSlide = useCallback(() => {
    if (!slideRef.current?.active) return;
    slideRef.current = { active: false };
    setStatus(`Edge slide applied — amount: ${slideAmount.toFixed(3)}`);
    setStats(heMeshRef.current?.stats() || stats);
  }, [slideAmount, stats]);

  // ── Loop cut ───────────────────────────────────────────────────────────────
  const applyLoopCut = useCallback(() => {
    const heMesh = heMeshRef.current;
    const mesh = meshRef.current;
    if (!heMesh || !mesh) { setStatus("Add a mesh first"); return; }
    pushHistory();

    // Use plane cut for reliable results
    // loopCutT 0.05-0.95 maps to Y position -0.9 to 0.9
    const yPos = (loopCutT - 0.5) * 1.8;
    const newVerts = heMesh.planeCut('y', yPos, loopCutT);

    if (!newVerts || newVerts.length === 0) {
      // Fallback: try X axis
      const xPos = (loopCutT - 0.5) * 1.8;
      const xVerts = heMesh.planeCut('x', xPos, loopCutT);
      if (!xVerts || xVerts.length === 0) {
        setStatus("Loop cut: no edges cross that position — try adjusting t");
        return;
      }
    }

    rebuildMeshGeometry();
    if (previewLineRef.current) { sceneRef.current?.remove(previewLineRef.current); previewLineRef.current = null; }
    const s = heMesh.stats();
    setStats(s);
    setStatus(`Loop cut — +${newVerts.length} verts · ${s.vertices} total · ${s.faces} faces`);
  }, [loopCutT, pushHistory, rebuildMeshGeometry]);

  // ── Import GLB ─────────────────────────────────────────────────────────────
  const importGLB = async (file) => {
    const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
    const scene = sceneRef.current; if (!scene) return;
    clearOverlays();
    if (meshRef.current) scene.remove(meshRef.current);
    const url = URL.createObjectURL(file);
    new GLTFLoader().load(url, (gltf) => {
      const obj = gltf.scene;
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      obj.position.sub(center);
      obj.scale.setScalar(3 / Math.max(size.x, size.y, size.z));
      scene.add(obj);
      meshRef.current = obj;
      obj.traverse(child => {
        if (child.isMesh && !heMeshRef.current) {
          heMeshRef.current = HalfEdgeMesh.fromBufferGeometry(child.geometry);
          setStats(heMeshRef.current.stats());
        }
      });
      setStatus(`Imported ${file.name}`);
      URL.revokeObjectURL(url);
    });
  };

  // ── Export GLB ─────────────────────────────────────────────────────────────
  const exportGLB = async () => {
    const mesh = meshRef.current; if (!mesh) return;
    // Session 16: apply unlit material if selected
    if (exportUnlit && mesh.material) {
      mesh.traverse(m => {
        if (m.isMesh && m.material) {
          m.material = new THREE.MeshBasicMaterial({
            color: m.material.color || 0x888888,
            map: m.material.map || null,
            vertexColors: m.material.vertexColors,
          });
        }
      });
    }
    // Session 9-10: build morph targets before export
    if (shapeKeysRef.current.length > 1) {
      try { buildMorphTargets(mesh, shapeKeysRef.current); } catch (e) { console.warn(e); }
    }
    // Session 7: triangulate n-gons before export
    if (heMeshRef.current) {
      try {
        const triData = heMeshRef.current.toTriangulatedBufferGeometry();
        const triGeo = new THREE.BufferGeometry();
        triGeo.setAttribute("position", new THREE.BufferAttribute(triData.positions, 3));
        triGeo.setIndex(new THREE.BufferAttribute(triData.indices, 1));
        triGeo.computeVertexNormals();
        if (mesh.geometry.attributes.color) {
          triGeo.setAttribute("color", mesh.geometry.attributes.color.clone());
        }
        mesh.geometry.dispose();
        mesh.geometry = triGeo;
      } catch (e) { console.warn("Triangulate on export failed:", e); }
    }
    const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
    new GLTFExporter().parse(mesh, (glb) => {
      const blob = new Blob([glb], { type: "model/gltf-binary" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "spx_mesh.glb"; a.click();
      // Session 1: write bridge metadata
      localStorage.setItem("spx_mesh_export", JSON.stringify({
        timestamp: Date.now(),
        name: "spx_mesh.glb",
        polyCount: heMeshRef.current?.stats()?.faces || 0,
        objectCount: sceneObjects.length || 1,
      }));
      // Session 1: write bridge metadata
      localStorage.setItem("spx_mesh_export", JSON.stringify({
        timestamp: Date.now(),
        name: "spx_mesh.glb",
        polyCount: heMeshRef.current?.stats()?.faces || 0,
        objectCount: sceneObjects.length || 1,
      }));
      URL.revokeObjectURL(url);
    }, (err) => console.error(err), { binary: true });
  };

  // ── Toggle wireframe ───────────────────────────────────────────────────────
  const toggleWireframe = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    const newWF = !wireframe;
    setWireframe(newWF);
    mesh.traverse(m => { if (m.isMesh && m.material) m.material.wireframe = newWF; });
  }, [wireframe]);

  // ── Toggle edit mode ───────────────────────────────────────────────────────
  const toggleEditMode = useCallback(() => {
    setEditMode(m => {
      const next = m === "object" ? "edit" : "object";
      if (next === "edit") {
        setTimeout(() => buildVertexOverlay(), 50);
      } else {
        clearOverlays();
      }
      return next;
    });
  }, [buildVertexOverlay]);

  const [animFrame, setAnimFrame] = useState(0);
  const [animKeys, setAnimKeys] = useState({});
  const [armatures, setArmatures] = useState([]);
  const [selectedBoneId, setSelectedBoneId] = useState(null);
  const [poseLibrary, setPoseLibrary] = useState({});
  const [wpBoneIndex, setWpBoneIndex] = useState(0);
  const [wpRadius, setWpRadius] = useState(0.5);
  const [wpStrength, setWpStrength] = useState(0.1);
  const [wpMode, setWpMode] = useState("add");
  const [dyntopoDetail, setDyntopoDetail] = useState(0.05);
  const [nlaActions, setNlaActions] = useState([]);
  const [nlaTracks, setNlaTracks] = useState([createTrack("Track 1")]);
  const [showNLA, setShowNLA] = useState(false);
  const [bvhData, setBvhData] = useState(null);
  const [advBrush, setAdvBrush] = useState("clay");
  const [advBrushRadius, setAdvBrushRadius] = useState(0.5);
  const [advBrushStr, setAdvBrushStr] = useState(0.03);
  const [advBrushInvert, setAdvBrushInvert] = useState(false);
  const [remeshVoxel, setRemeshVoxel] = useState(0.1);
  const [multiresStack, setMultiresStack] = useState(null);
  const [gpLayers, setGpLayers] = useState([createLayer("Layer 1")]);
  const [gpActiveLayer, setGpActiveLayer] = useState(0);
  const [gpDrawing, setGpDrawing] = useState(false);
  const [gpCurrentStroke, setGpCurrentStroke] = useState(null);
  const [gpColor, setGpColor] = useState("#ffffff");
  const [gpThickness, setGpThickness] = useState(2);
  const [gnGraph, setGnGraph] = useState(createGraph());
  const [activeSpline, setActiveSpline] = useState(null);
  const [paintStack, setPaintStack] = useState(null);
  const [paintTexture, setPaintTexture] = useState(null);
  const [paintColor, setPaintColor] = useState("#ff0000");
  const [paintRadius, setPaintRadius] = useState(20);
  const [paintOpacity, setPaintOpacity] = useState(1.0);
  const [bakedMaps, setBakedMaps] = useState({});
  const [sceneLights, setSceneLights] = useState([]);
  const [activeLightId, setActiveLightId] = useState(null);
  const [lightType, setLightType] = useState("point");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [lightIntensity, setLightIntensity] = useState(1.0);
  const [fogEnabled, setFogEnabled] = useState(false);
  const [fogColor, setFogColor] = useState("#aabbcc");
  const [fogDensity, setFogDensity] = useState(0.02);
  const [cameras, setCameras] = useState([]);
  const [camFOV, setCamFOV] = useState(45);
  const [boneMap, setBoneMap] = useState({ ...DEFAULT_BONE_MAP });
  const [ikChains, setIkChains] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeDriverId, setActiveDriverId] = useState(null);
  const [driverExpr, setDriverExpr] = useState("sin(frame * 0.1)");
  const [constraints, setConstraints] = useState([]);
  const [constraintType, setConstraintType] = useState("lookAt");
  const [rigidBodies, setRigidBodies] = useState([]);
  const [bakedPhysics, setBakedPhysics] = useState(null);
  const [walkStyle, setWalkStyle] = useState("normal");
  const [walkSpeed, setWalkSpeed] = useState(1.0);
  const [walkStride, setWalkStride] = useState(1.0);
  const [dynaMeshSettings, setDynaMeshSettings] = useState(createDynaMeshSettings());
  const [retopoSettings, setRetopoSettings] = useState(createRetopoSettings());
  const [retopoResult, setRetopoResult] = useState(null);
  const [fiberGroup, setFiberGroup] = useState(null);
  const [fiberDensity, setFiberDensity] = useState(0.5);
  const [fiberLength, setFiberLength] = useState(0.3);
  const [fiberMode, setFiberMode] = useState("tubes");
  const [fiberBrush, setFiberBrush] = useState("comb");
  const [hairPreset, setHairPreset] = useState("medium");
  const [hairDisplayMode, setHairDisplayMode] = useState("lines");
  const [hairGroomBrush, setHairGroomBrush] = useState("comb");
  const [hairShaderPreset, setHairShaderPreset] = useState("natural");
  const [hairCardMesh, setHairCardMesh] = useState(null);
  const [clothPreset, setClothPreset] = useState("cotton");
  const [clothColliders, setClothColliders] = useState([]);
  const [clothSelfCol, setClothSelfCol] = useState(false);
  const [sssPreset, setSssPreset] = useState("skin");
  const [transmissionPreset, setTransmissionPreset] = useState("glass");
  const [dispPattern, setDispPattern] = useState("noise");
  const [dispScale, setDispScale] = useState(0.1);
  const [renderPreset, setRenderPreset] = useState("medium");
  const [toneMappingMode, setToneMappingMode] = useState("aces");
  const [toneExposure, setToneExposure] = useState(1.0);
  const [videoFps, setVideoFps] = useState(24);
  const [videoStartFrame, setVideoStartFrame] = useState(0);
  const [videoEndFrame, setVideoEndFrame] = useState(120);
  const [videoWidth, setVideoWidth] = useState(1920);
  const [videoHeight, setVideoHeight] = useState(1080);
  const [volumetricSettings, setVolumetricSettings] = useState(createVolumetricSettings());
  const [atmospherePreset, setAtmospherePreset] = useState("clear");
  const [passStack, setPassStack] = useState(createPassStack());
  const [passResults, setPassResults] = useState({});
  const [vfxRunning, setVfxRunning] = useState(false);
  const [fluidPreset, setFluidPreset] = useState("water");
  const [assetLibrary, setAssetLibrary] = useState(createAssetLibrary());
  const [procAnimKey, setProcAnimKey] = useState("float");
  const [procAnimEnabled, setProcAnimEnabled] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [versionHistory, setVersionHistory] = useState([]);
  const [densityPattern, setDensityPattern] = useState("center");
  const [tourState, setTourState] = useState(createTourState());
  const [hairGroup, setHairGroup] = useState(null);
  const [bloomEnabled, setBloomEnabled] = useState(false);
  const [ssaoEnabled, setSsaoEnabled] = useState(false);
  const [dofEnabled, setDofEnabled] = useState(false);
  const [mcIsolevel, setMcIsolevel] = useState(0.5);
  const [mcResolution, setMcResolution] = useState(32);
  const [fluidSurface, setFluidSurface] = useState(null);
  const [farmFrameStart, setFarmFrameStart] = useState(0);
  const [useWorkerCloth, setUseWorkerCloth] = useState(false);
  const [useWorkerSPH, setUseWorkerSPH] = useState(false);
  const [vfxPreset, setVfxPreset] = useState("fire");
  const [gpuRunning, setGpuRunning] = useState(false);
  const [forceFieldType, setForceFieldType] = useState("vortex");
  const [activeShaderPreset, setActiveShaderPreset] = useState("toon");
  const [shaderOptions, setShaderOptions] = useState({});
  const [farmFrameEnd, setFarmFrameEnd] = useState(24);
  const [farmJobName, setFarmJobName] = useState("Render_001");
  const [exportFormat, setExportFormat] = useState("glb");
  const [pluginMarketplace, setPluginMarketplace] = useState({ presets: [] });
  // ── Sessions 4-5: Sculpt stroke ───────────────────────────────────────────
  const applySculpt = useCallback((e) => {
    const mesh = meshRef.current; if (!mesh) return;
    const camera = cameraRef.current; if (!camera) return;
    const canvas = canvasRef.current; if (!canvas) return;

    // Lazy mouse smoothing
    const lazy = lazyMouseRef.current;
    const rect = canvas.getBoundingClientRect();
    lazy.x += ((e.clientX - rect.left) - lazy.x) * 0.4;
    lazy.y += ((e.clientY - rect.top)  - lazy.y) * 0.4;

    // Pressure sensitivity (tablet or fallback 1.0)
    const pressure = (e.pressure > 0) ? e.pressure : 1.0;

    const smoothedE = Object.assign({}, e, {
      clientX: lazy.x + rect.left,
      clientY: lazy.y + rect.top,
    });
    const hit = getSculptHit(smoothedE, canvas, camera, mesh);
    if (!hit) return;

    applySculptStroke(mesh, hit, {
      type: sculptBrush,
      radius: sculptRadius,
      strength: sculptStrength * pressure,
      falloffType: sculptFalloff,
      symmetryX: sculptSymX,
    });

    // DynaMesh auto-remesh every 8 strokes when dyntopo enabled
    sculptStrokeCountRef.current += 1;
    if (dyntopoEnabled && sculptStrokeCountRef.current % 8 === 0) {
      try {
        const settings = createDynaMeshSettings({ resolution: 64 });
        dynaMeshRemesh(mesh, settings);
      } catch(err) {}
    }

    if (mesh.geometry) {
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
    }
  }, [sculptBrush, sculptRadius, sculptStrength, sculptFalloff, sculptSymX, dyntopoEnabled]);

  // ── Session 8: Vertex color paint stroke ─────────────────────────────────
  const applyVertexPaint = useCallback((e) => {
    const mesh = meshRef.current; if (!mesh) return;
    const camera = cameraRef.current; if (!camera) return;
    const canvas = canvasRef.current; if (!canvas) return;
    initVertexColors(mesh);
    const hit = getSculptHit(e, canvas, camera, mesh);
    if (!hit) return;
    paintVertexColor(mesh, hit, {
      color: vcPaintColor,
      radius: vcRadius,
      strength: vcStrength,
      falloffType: vcFalloff,
    });
  }, [vcPaintColor, vcRadius, vcStrength, vcFalloff]);

  // ── Orbit controls ─────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    // Check gizmo first
    if (e.button === 0 && gizmoActive && onGizmoMouseDown(e)) return;
    if (e.button === 0 && editMode === "paint") {
      vcPaintingRef.current = true;
      applyVertexPaint(e);
      return;
    }
    if (e.button === 0 && editMode === "sculpt") {
      sculptingRef.current = true;
      applySculpt(e);
      return;
    }
    if (activeToolRef.current === "knife" && editModeRef.current === "edit") {
      onKnifeClick(e); return;
    }
    if (e.button === 0 && editModeRef.current === "edit") {
      onCanvasClick(e);
    }
    if (e.button === 1 || e.button === 2) {
      orbitRef.current = { x: e.clientX, y: e.clientY };
    }
    if (e.button === 0 && editModeRef.current === "object") {
      orbitRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [onKnifeClick, onCanvasClick]);

  const onMouseMove = useCallback((e) => {
    if (slideRef.current?.active) { onSlideMouse(e); return; }
    if (!orbitRef.current) return;
    const dx = (e.clientX - orbitRef.current.x) * 0.01;
    const dy = (e.clientY - orbitRef.current.y) * 0.01;
    const s = orbitState.current;
    s.theta += dx;
    s.phi = Math.max(0.1, Math.min(Math.PI - 0.1, s.phi + dy));
    const cam = cameraRef.current;
    if (cam) {
      cam.position.set(
        s.radius * Math.sin(s.phi) * Math.sin(s.theta),
        s.radius * Math.cos(s.phi),
        s.radius * Math.sin(s.phi) * Math.cos(s.theta),
      );
      cam.lookAt(0, 0, 0);
    }
    orbitRef.current = { x: e.clientX, y: e.clientY };
  }, [onSlideMouse]);

  const onMouseUp = useCallback((e) => {
    sculptingRef.current = false;
    vcPaintingRef.current = false;
    wpPaintingRef.current = false;
    onGizmoMouseUp();
    orbitRef.current = null;
    if (slideRef.current?.active) confirmEdgeSlide();
  }, [confirmEdgeSlide]);

  const onWheel = useCallback((e) => {
    const s = orbitState.current;
    s.radius = Math.max(0.5, Math.min(20, s.radius + e.deltaY * 0.005));
    const cam = cameraRef.current;
    if (cam) {
      cam.position.set(
        s.radius * Math.sin(s.phi) * Math.sin(s.theta),
        s.radius * Math.cos(s.phi),
        s.radius * Math.sin(s.phi) * Math.cos(s.theta),
      );
      cam.lookAt(0, 0, 0);
    }
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    let gPressed = false;
    const onKey = (e) => {
      if (e.ctrlKey && e.key === "r") { e.preventDefault(); setActiveTool("loop_cut"); applyLoopCut(); }
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo(); }
      if (e.key === "k") { setActiveTool("knife"); setEditMode("edit"); }
      if (e.key === "z" && !e.ctrlKey) toggleWireframe();
      if (e.key === "Tab") { e.preventDefault(); toggleEditMode(); }
      if (e.key === "Enter") executeKnifeCut();
      if (e.key === "Escape") {
        knifeRef.current.points = []; setKnifePoints([]);
        slideRef.current = { active: false };
        setStatus("Cancelled");
      }
      if (e.key === "1") setSelectMode("vert");
      if (e.key === "2") setSelectMode("edge");
      if (e.key === "3") setSelectMode("face");
      if (e.key === "g") {
        if (gPressed) { startEdgeSlide(); gPressed = false; }
        else { gPressed = true; setTimeout(() => { gPressed = false; }, 500); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyLoopCut, undo, toggleWireframe, toggleEditMode, executeKnifeCut, startEdgeSlide]);

  // ── Render ─────────────────────────────────────────────────────────────────
  // ── Subdivide ──────────────────────────────────────────────────────────────
  const applySubdivide = useCallback(() => {
    const heMesh = heMeshRef.current; if (!heMesh) { setStatus("Add a mesh first"); return; }
    pushHistory();
    const newHE = heMesh.subdivide();
    heMeshRef.current = newHE;
    rebuildMeshGeometryFromHE(newHE);
    setStats(newHE.stats());
    setStatus(`Subdivided — ${newHE.stats().vertices} verts · ${newHE.stats().faces} faces`);
  }, [pushHistory]);

  const rebuildMeshGeometryFromHE = (heMesh) => {
    const mesh = meshRef.current; if (!mesh) return;
    const { positions, indices } = heMesh.toBufferGeometry();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    if (mesh.isMesh) { mesh.geometry.dispose(); mesh.geometry = geo; }
  };

  // ── Extrude ────────────────────────────────────────────────────────────────
  const applyExtrude = useCallback((amount) => {
    const heMesh = heMeshRef.current; if (!heMesh) return;
    if (selectedFaces.size === 0) { setStatus("Select faces first (mode 3)"); return; }
    pushHistory();
    heMesh.extrudeFaces([...selectedFaces], amount);
    rebuildMeshGeometry();
    setStats(heMesh.stats());
    setStatus(`Extruded ${selectedFaces.size} face(s) by ${amount.toFixed(2)}`);
  }, [selectedFaces, pushHistory, rebuildMeshGeometry]);

  // ── Merge by distance ──────────────────────────────────────────────────────
  const applyMerge = useCallback(() => {
    const heMesh = heMeshRef.current; if (!heMesh) return;
    pushHistory();
    const merged = heMesh.mergeByDistance(0.001);
    rebuildMeshGeometry();
    setStats(heMesh.stats());
    setStatus(`Merged ${merged} vertices by distance`);
  }, [pushHistory, rebuildMeshGeometry]);

  // ── Send to StreamPireX ────────────────────────────────────────────────────
  const sendToStreamPireX = useCallback(async () => {
    const mesh = meshRef.current; if (!mesh) return;
    try {
      const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
      new GLTFExporter().parse(mesh, (glb) => {
        const arr = new Uint8Array(glb);
        const b64 = btoa(String.fromCharCode(...arr));
        const payload = {
          source: "spx_mesh_editor",
          timestamp: Date.now(),
          glbBase64: b64,
          stats: heMeshRef.current?.stats(),
        };
        localStorage.setItem("spx_mesh_to_compositor", JSON.stringify({
          ...payload, glbBase64: b64.slice(0, 100) + "...[truncated]"
        }));
        // Full data in sessionStorage for same-tab transfer
        sessionStorage.setItem("spx_mesh_glb", b64);
        setStatus("✓ Mesh sent to StreamPireX Node Compositor");
      }, (err) => console.error(err), { binary: true });
    } catch (e) {
      setStatus("Export error: " + e.message);
    }
  }, []);


  // ── Mirror ──────────────────────────────────────────────────────────────────
  const applyMirror = useCallback((axis) => {
    const heMesh = heMeshRef.current; if (!heMesh) return;
    pushHistory();
    heMesh.mirror(axis);
    rebuildMeshGeometry();
    setStats(heMesh.stats());
    setStatus(`Mirrored on ${axis.toUpperCase()} axis`);
  }, [pushHistory, rebuildMeshGeometry]);

  // ── Bevel ────────────────────────────────────────────────────────────────────
  const applyBevel = useCallback((amount) => {
    const heMesh = heMeshRef.current; if (!heMesh) return;
    pushHistory();
    const count = heMesh.bevelEdges(amount);
    rebuildMeshGeometry();
    setStats(heMesh.stats());
    setStatus(`Beveled ${count} edges by ${amount.toFixed(3)}`);
  }, [pushHistory, rebuildMeshGeometry]);

  // ── Inset ────────────────────────────────────────────────────────────────────
  const applyInset = useCallback((amount) => {
    const heMesh = heMeshRef.current; if (!heMesh) return;
    if (selectedFaces.size === 0) { setStatus("Select faces first (mode 3)"); return; }
    pushHistory();
    heMesh.insetFaces([...selectedFaces], amount);
    rebuildMeshGeometry();
    setStats(heMesh.stats());
    setStatus(`Inset ${selectedFaces.size} face(s) by ${amount.toFixed(3)}`);
  }, [selectedFaces, pushHistory, rebuildMeshGeometry]);

  // ── Gizmo mode toggle ────────────────────────────────────────────────────────
  const setGizmoModeAndUpdate = useCallback((mode) => {
    setGizmoMode(mode);
    gizmoRef.current?.setMode(mode);
  }, []);

  // ── Gizmo mouse handling ─────────────────────────────────────────────────────
  const onGizmoMouseDown = useCallback((e) => {
    if (!gizmoActive || !gizmoRef.current?.target) return false;
    const raycaster = raycast(e); if (!raycaster) return false;
    const axis = gizmoRef.current.hitTest(raycaster);
    if (!axis) return false;
    // Get world point on drag plane
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, point);
    gizmoRef.current.startDrag(axis, point);
    gizmoDragging.current = true;
    return true;
  }, [gizmoActive, raycast]);

  const onGizmoDrag = useCallback((e) => {
    if (!gizmoDragging.current || !gizmoRef.current) return;
    const raycaster = raycast(e); if (!raycaster) return;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, point);
    gizmoRef.current.drag(point);
  }, [raycast]);

  const onGizmoMouseUp = useCallback(() => {
    if (gizmoDragging.current) {
      gizmoDragging.current = false;
      gizmoRef.current?.endDrag();
      setStatus("Transform applied");
    }
  }, []);


  // ── Boolean operations ────────────────────────────────────────────────────
  const applyBoolean = useCallback((mode) => {
    const scene = sceneRef.current;
    const meshA = meshRef.current;
    const meshB = meshBRef.current;
    if (!scene || !meshA) { setStatus("Add two meshes for boolean ops"); return; }
    if (!meshB) {
      // Add a second mesh offset to the right for demo
      const geo = new THREE.SphereGeometry(0.6, 64, 48);
      const mat = new THREE.MeshStandardMaterial({ color: "#ff6600", roughness: 0.5, metalness: 0.1, wireframe: wireframe });
      const mb = new THREE.Mesh(geo, mat);
      mb.position.set(0.5, 0, 0);
      mb.updateMatrixWorld();
      scene.add(mb);
      meshBRef.current = mb;
      setStatus("Second mesh added — click Boolean again to apply");
      return;
    }
    pushHistory();
    let result = null;
    if (mode === "union") result = booleanUnion(meshA, meshB);
    else if (mode === "subtract") result = booleanSubtract(meshA, meshB);
    else if (mode === "intersect") result = booleanIntersect(meshA, meshB);
    if (!result) { setStatus("Boolean op failed"); return; }
    scene.remove(meshA); scene.remove(meshB);
    result.castShadow = true;
    scene.add(result);
    meshRef.current = result;
    meshBRef.current = null;
    heMeshRef.current = HalfEdgeMesh.fromBufferGeometry(result.geometry);
    setStats(heMeshRef.current.stats());
    gizmoRef.current?.attach(result);
    setStatus(`Boolean ${mode} applied`);
  }, [wireframe, pushHistory]);

  // ── UV Unwrap ─────────────────────────────────────────────────────────────
  const applyUVUnwrap = useCallback((projection) => {
    const mesh = meshRef.current; if (!mesh || !mesh.isMesh) return;
    let newGeo;
    if (projection === "box") newGeo = uvBoxProject(mesh.geometry);
    else if (projection === "sphere") newGeo = uvSphereProject(mesh.geometry);
    else if (projection === "planar") newGeo = uvPlanarProject(mesh.geometry);
    else return;
    mesh.geometry.dispose();
    mesh.geometry = newGeo;
    const tris = getUVIslands(newGeo);
    setUVTriangles(tris);
    setShowUVEditor(true);
    setStatus(`UV ${projection} projection applied — ${tris.length} triangles`);
  }, []);

  const openUVEditor = useCallback(() => {
    const mesh = meshRef.current; if (!mesh || !mesh.isMesh) {
      setStatus("Select a mesh first"); return;
    }
    const tris = getUVIslands(mesh.geometry);
    if (tris.length === 0) {
      // Auto-apply box projection if no UVs
      applyUVUnwrap("box");
    } else {
      setUVTriangles(tris);
      setShowUVEditor(true);
    }
  }, [applyUVUnwrap]);


  // ── Session 13: Apply material to mesh ────────────────────────────────────
  const applyMaterial = useCallback((props) => {
    const mesh = meshRef.current; if (!mesh) return;
    setMatProps(props);
    const applyToMesh = (m) => {
      if (!m.isMesh || !m.material) return;
      m.material.color?.set(props.color || "#888888");
      if (m.material.roughness !== undefined) m.material.roughness = props.roughness ?? 0.5;
      if (m.material.metalness !== undefined) m.material.metalness = props.metalness ?? 0;
      if (m.material.opacity !== undefined) m.material.opacity = props.opacity ?? 1;
      if (m.material.transparent !== undefined) m.material.transparent = props.transparent || false;
      m.material.wireframe = props.wireframe || false;
      m.material.emissive?.set(props.emissive || "#000000");
      if (m.material.emissiveIntensity !== undefined) m.material.emissiveIntensity = props.emissiveIntensity || 0;
      if (props.mapUrl) {
        const loader = new THREE.TextureLoader();
        loader.load(props.mapUrl, (tex) => {
          tex.repeat.set(props.repeatX || 1, props.repeatY || 1);
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          m.material.map = tex;
          m.material.needsUpdate = true;
        });
      } else {
        m.material.map = null;
      }
      m.material.needsUpdate = true;
    };
    if (mesh.isMesh) applyToMesh(mesh);
    else mesh.traverse(applyToMesh);
    setStatus("Material updated");
  }, []);

  // ── Session 14: Proportional editing ─────────────────────────────────────
  const applyProportionalMove = useCallback((dx, dy) => {
    if (!propEdit) return;
    const heMesh = heMeshRef.current; if (!heMesh) return;
    const selV = [...selectedVerts];
    if (selV.length === 0) return;
    // Get positions of selected verts
    selV.forEach(vid => {
      const v = heMesh.vertices.get(vid);
      if (!v) return;
      // Move all nearby verts with falloff
      heMesh.vertices.forEach(nv => {
        const dist = v.distanceTo(nv);
        if (dist > propRadius) return;
        let factor = 0;
        const t = dist / propRadius;
        if (propFalloff === "smooth") factor = (1 - t * t) * (1 - t * t);
        else if (propFalloff === "linear") factor = 1 - t;
        else if (propFalloff === "sharp") factor = t < 0.1 ? 1 : 0;
        if (vid === nv.id) factor = 1;
        nv.x += dx * factor * 0.01;
        nv.y += dy * factor * 0.01;
      });
    });
    rebuildMeshGeometry();
  }, [propEdit, propRadius, propFalloff, selectedVerts, rebuildMeshGeometry]);

  // ── Session 14: Snap to grid ─────────────────────────────────────────────
  const snapToGrid = useCallback((value) => {
    if (!snapEnabled) return value;
    return Math.round(value / snapSize) * snapSize;
  }, [snapEnabled, snapSize]);

  // ── Session 15: Render to image ───────────────────────────────────────────
  const renderToImage = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;
    // Render at 2x resolution
    const W = 1920, H = 1080;
    renderer.setSize(W, H);
    renderer.render(scene, camera);
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "spx_mesh_render.png";
    a.click();
    // Restore size
    const canvas = canvasRef.current;
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    setStatus("Render saved as PNG");
  }, []);

  // ── Session 15: Push to StreamPireX ──────────────────────────────────────
  const pushToStreamPireX = useCallback(async () => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh to push"); return; }
    try {
      const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
      new GLTFExporter().parse(mesh, (glb) => {
        const arr = new Uint8Array(glb);
        const b64 = btoa(String.fromCharCode(...arr.slice(0, Math.min(arr.length, 500000))));
        sessionStorage.setItem("spx_mesh_glb_b64", b64);
        localStorage.setItem("spx_mesh_ready", JSON.stringify({
          timestamp: Date.now(),
          stats: heMeshRef.current?.stats(),
          material: matProps,
        }));
        setStatus("✓ Mesh pushed to StreamPireX — open Node Compositor to import");
      }, err => console.error(err), { binary: true });
    } catch (e) { setStatus("Push error: " + e.message); }
  }, [matProps]);


  // ── Sessions 131-138: GLSL Shader handlers ───────────────────────────────
  const handleApplyGLSLShader = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    const mat = applyShaderPreset(mesh, activeShaderPreset, shaderOptions);
    if (!mat) { setStatus("Unknown shader preset"); return; }
    setStatus("GLSL shader applied: " + activeShaderPreset);
  }, [activeShaderPreset, shaderOptions]);

  const handleApplyToon = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    mesh.material = createToonMaterial({ color: "#00ffc8", shadowColor: "#006644", steps: 3, edgeThreshold: 0.3 });
    setStatus("Toon shader applied");
  }, []);

  const handleApplyHolographic = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    mesh.material = createHolographicMaterial({ color: "#00ffc8" });
    setHoloMesh(mesh);
    setStatus("Holographic shader applied");
  }, []);

  const handleApplyDissolve = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    mesh.material = createDissolveMaterial({ color: "#00ffc8", edgeColor: "#FF6600" });
    setStatus("Dissolve shader applied");
  }, []);

  const handleSetDissolveAmount = useCallback((amount) => {
    const mesh = meshRef.current; if (!mesh?.material?.uniforms?.dissolve) return;
    setDissolveAmount(mesh.material, amount);
    setDissolveAmount2(amount);
  }, []);

  const handleAddOutline = useCallback(() => {
    const mesh = meshRef.current; if (!mesh || !sceneRef.current) return;
    const outline = addOutlineToMesh(mesh, sceneRef.current, { width: 0.02, color: "#000000" });
    setOutlineMesh(outline);
    setStatus("Outline added");
  }, []);

  const handleApplyHairGLSL = useCallback(() => {
    const group = hairGroup; if (!group) { setStatus("Emit hair first"); return; }
    group.traverse(obj => {
      if (obj.isMesh) obj.material = createHairShaderMaterial({
        rootColor: "#2a1a0a", tipColor: "#8b6040",
        specShift1: -0.1, specShift2: 0.1,
      });
    });
    setStatus("Anisotropic hair GLSL applied");
  }, [hairGroup]);

  // ── Sessions 139-140: Post Pass handlers ─────────────────────────────────
  const handleInitPostPasses = useCallback(() => {
    if (!rendererRef.current) return;
    const w = rendererRef.current.domElement.width;
    const h = rendererRef.current.domElement.height;
    postPassManagerRef.current = createPostPassManager(rendererRef.current, w, h);
    setStatus("Post pass manager initialized — " + w + "x" + h);
  }, []);

  const handleToggleBloom = useCallback(() => {
    if (!postPassManagerRef.current) { handleInitPostPasses(); }
    setBloomEnabled(b => !b);
    setStatus(bloomEnabled ? "Bloom OFF" : "Bloom ON");
  }, [bloomEnabled, handleInitPostPasses]);

  const handleToggleSSAO = useCallback(() => {
    if (!postPassManagerRef.current) { handleInitPostPasses(); }
    setSsaoEnabled(s => !s);
    setStatus(ssaoEnabled ? "SSAO OFF" : "SSAO ON");
  }, [ssaoEnabled, handleInitPostPasses]);

  const handleToggleDOF = useCallback(() => {
    if (!postPassManagerRef.current) { handleInitPostPasses(); }
    setDofEnabled(d => !d);
    setStatus(dofEnabled ? "DOF OFF" : "DOF ON");
  }, [dofEnabled, handleInitPostPasses]);

  // ── Sessions 141-142: Marching Cubes handlers ─────────────────────────────
  const handleMarchingCubesRemesh = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    setStatus("Marching cubes remesh running...");
    try {
      const newMesh = marchingCubesRemesh(mesh, mcResolution, mcIsolevel);
      sceneRef.current?.remove(mesh);
      sceneRef.current?.add(newMesh);
      meshRef.current = newMesh;
      setSceneObjects(prev => prev.map(o => o.mesh === mesh ? { ...o, mesh: newMesh } : o));
      const stats = getMarchingCubesStats(newMesh.geometry);
      setMcStats(stats);
      setStatus("MC remesh: " + stats.vertices + "v / " + stats.triangles + "t");
    } catch (e) { setStatus("MC failed: " + e.message); }
  }, [mcResolution, mcIsolevel]);

  const handleFluidSurface = useCallback(() => {
    const fluid = fluidSimRef.current; if (!fluid?.particles?.length) { setStatus("Run fluid first"); return; }
    if (fluidSurface) sceneRef.current?.remove(fluidSurface);
    const mesh2 = fluidSurfaceMesh(fluid.particles, { resolution: mcResolution, radius: 0.3 });
    if (mesh2) {
      sceneRef.current?.add(mesh2);
      setFluidSurface(mesh2);
      const stats = getMarchingCubesStats(mesh2.geometry);
      setStatus("Fluid surface: " + stats.vertices + "v / " + stats.triangles + "t");
    }
  }, [mcResolution, fluidSurface]);

  // ── Sessions 3-9: PathTracer + FBX + Plugin handlers ───────────────────
  const handleDetectPathTracer = useCallback(async () => {
    const result = await detectPathTracer();
    setPtDetected(result);
    setStatus(result.available ? "PathTracer available: " + result.version : "Using built-in accumulation renderer");
  }, []);

  const handleCreatePathTracer = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    const settings = createPathTracerSettings({ maxSamples:128, bounces:4 });
    const pt = createWebGLPathTracer(rendererRef.current, sceneRef.current, cameraRef.current, settings);
    pathTracerRef.current = pt;
    setPathTracer(pt);
    setStatus("Path tracer created — max " + settings.maxSamples + " samples");
  }, []);

  const handleStartPathTracing = useCallback(() => {
    const pt = pathTracerRef.current; if (!pt) { setStatus("Create path tracer first"); return; }
    startPathTracing(pt);
    setPtRunning(true);
    const loop = () => {
      const result = stepPathTracer(pt, rendererRef.current, sceneRef.current, cameraRef.current);
      const stats  = getPathTracerStats(pt);
      setPtStats({ ...stats });
      if (stats.samples === 32) { try { denoiseCanvas(rendererRef.current?.domElement); } catch(e) {} }
      if (result?.done) {
        try { denoiseCanvas(rendererRef.current?.domElement); } catch(e) {}
        setPtRunning(false);
        setStatus("Path tracing complete — " + stats.samples + " samples (denoised)");
        return;
      }
      ptRafRef.current = requestAnimationFrame(loop);
    };
    ptRafRef.current = requestAnimationFrame(loop);
    setStatus("Path tracing started");
  }, []);

  const handleStopPathTracing = useCallback(() => {
    const pt = pathTracerRef.current; if (!pt) return;
    stopPathTracing(pt);
    if (ptRafRef.current) cancelAnimationFrame(ptRafRef.current);
    setPtRunning(false);
    setStatus("Path tracing stopped");
  }, []);

  const handleExportPathTracedFrame = useCallback(() => {
    if (!rendererRef.current) return;
    exportPathTracedFrame(rendererRef.current, "pathtraced_" + Date.now() + ".png");
    setStatus("Frame exported");
  }, []);

  // ── Session 4-5: FBX/OBJ handlers ────────────────────────────────────────
  const handleExportOBJ = useCallback(() => {
    if (!sceneRef.current) return;
    exportOBJ(sceneRef.current, { filename:"scene.obj" });
    setStatus("OBJ exported");
  }, []);

  const handleImportOBJ = useCallback(async () => {
    try {
      const result = await openFile({ accept:".obj" });
      if (!result) return;
      const group = parseOBJ(result.data);
      sceneRef.current?.add(group);
      setStatus("OBJ imported: " + group.children.length + " objects");
    } catch(e) { setStatus("OBJ import failed: " + e.message); }
  }, []);

  const handleImportFBX = useCallback(async () => {
    try {
      const result = await openFile({ accept:".fbx", binary:true });
      if (!result) return;
      setStatus("Sending FBX to backend for conversion...");
      const file   = result.file || new File([result.data], result.name || "import.fbx");
      const conv   = await importFBXFromBackend(file);
      if (conv.success) {
        const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
        const loader = new GLTFLoader();
        loader.load(conv.url, (gltf) => {
          sceneRef.current?.add(gltf.scene);
          setStatus("FBX imported via backend");
        });
      } else {
        setStatus("FBX import offline — backend required");
      }
    } catch(e) { setStatus("FBX import failed: " + e.message); }
  }, []);

  const handleExportFBX = useCallback(async () => {
    if (!sceneRef.current) return;
    setStatus("Exporting FBX...");
    const result = await exportFBXToBackend(sceneRef.current, "scene.fbx");
    setStatus(result.success ? "FBX exported" : "FBX offline — saved as GLB");
  }, []);

  // ── Session 6-7: Plugin handlers ──────────────────────────────────────────
  const handleInitPlugins = useCallback(() => {
    initPluginAPI();
    BUILTIN_BRUSH_PLUGINS.forEach(registerPlugin);
    const stats = getPluginStats();
    setPluginStats(stats);
    setStatus("Plugin API initialized — " + stats.total + " plugins registered");
  }, []);

  const handleLoadPlugin = useCallback(async () => {
    try {
      const result = await openFile({ accept:".js" });
      if (!result) return;
      const file   = result.file || new File([result.data], result.name || "plugin.js");
      const loaded = await loadPluginFromFile(file);
      const stats  = getPluginStats();
      setPluginStats(stats);
      setStatus(loaded.success ? "Plugin loaded: " + loaded.name : "Plugin failed: " + loaded.error);
    } catch(e) { setStatus("Plugin load failed: " + e.message); }
  }, []);

  // ── Session 8: Preset marketplace handlers ────────────────────────────────
  const handleInstallPreset = useCallback((presetId) => {
    installPreset(pluginMarketplace, presetId);
    setPluginMarketplace({ ...pluginMarketplace });
    const p = COMMUNITY_PRESETS.find(x=>x.id===presetId);
    setStatus("Installed: " + (p?.name||presetId));
  }, [pluginMarketplace]);

  const handleSavePreset = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    const preset = saveCustomPreset("My Preset", "sculpt", { mesh:mesh.name });
    setStatus("Preset saved: " + preset.name);
  }, []);

  // ── Sessions 3-9: PathTracer + FBX + Plugin handlers ───────────────────





  // ── Session 4-5: FBX/OBJ handlers ────────────────────────────────────────




  // ── Session 6-7: Plugin handlers ──────────────────────────────────────────


  // ── Session 8: Preset marketplace handlers ────────────────────────────────

  // ── Sessions 157-161: Rendering upgrade handlers ────────────────────────
  const handleDetectWebGPU = useCallback(async () => {
    const info = await detectWebGPU();
    setWebgpuInfo(info);
    if (rendererRef.current) setWebglInfo(getWebGLInfo(rendererRef.current));
    setStatus(info.supported ? "WebGPU supported: " + info.vendor : "WebGPU not available — using WebGL");
  }, []);

  const handleEnableIBL = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current) return;
    const envMap = createPMREMFromScene(rendererRef.current, sceneRef.current, cameraRef.current);
    applyIBLToScene(sceneRef.current, envMap, { intensity: 1.0 });
    setIblEnabled(true);
    setStatus("IBL enabled — PMREM environment");
  }, []);

  const handleEnableShadows = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current) return;
    enableShadowsOnScene(sceneRef.current);
    const lights = [];
    sceneRef.current.traverse(o => { if (o.isDirectionalLight || o.isSpotLight) lights.push(o); });
    if (lights.length) {
      setupCascadedShadows(rendererRef.current, lights[0], { mapSize: 2048, far: 50 });
      setShadowsEnabled(true);
      setStatus("Cascaded shadows enabled");
    } else {
      setStatus("No directional/spot lights found — add a light first");
    }
  }, []);

  const handleEnableNPROutline = useCallback(() => {
    if (!rendererRef.current || !cameraRef.current) return;
    const pass = createNPROutlinePass(rendererRef.current, sceneRef.current, cameraRef.current, {
      edgeColor: new THREE.Color("#000000"), edgeThickness: 2.0,
    });
    setNprOutline(pass);
    setStatus("NPR outline pass created");
  }, []);

  // ── Sessions 161: Render Farm handlers ───────────────────────────────────
  const handleAddRenderJob = useCallback(() => {
    const farm = renderFarmRef.current;
    const job = addRenderFarmJob(farm, {
      name: farmJobName,
      type: "sequence",
      frameStart: farmFrameStart,
      frameEnd: farmFrameEnd,
      fps: 24,
    });
    setRenderFarm({ ...farm });
    setStatus("Job added: " + job.name + " (" + (farmFrameEnd - farmFrameStart + 1) + " frames)");
  }, [farmJobName, farmFrameStart, farmFrameEnd]);

  const handleRunRenderFarm = useCallback(async () => {
    if (!rendererRef.current) return;
    const farm = renderFarmRef.current;
    setStatus("Render farm running...");
    const job = await runNextRenderJob(farm, rendererRef.current, sceneRef.current, cameraRef.current,
      (j) => setRenderFarm({ ...farm })
    );
    setRenderFarm({ ...farm });
    if (job) setStatus("Job complete: " + job.name + " — " + (job.output?.length || 0) + " frames");
  }, []);

  // ── Sessions 162-165: Worker thread handlers ──────────────────────────────
  const handleInitWorkers = useCallback(() => {
    const support = getWorkerSupport();
    setWorkerSupport(support);
    if (support.workers) {
      clothWorkerRef.current = createClothWorker();
      sphWorkerRef.current = createSPHWorker();
      workerPoolRef.current = createWorkerPool("cloth", 2);
      setStatus("Workers initialized — cloth + SPH offthread ready");
    } else {
      setStatus("Web Workers not supported in this environment");
    }
  }, []);

  const handleToggleWorkerCloth = useCallback(() => {
    if (!clothWorkerRef.current) { setStatus("Initialize workers first"); return; }
    setUseWorkerCloth(v => !v);
    setStatus(useWorkerCloth ? "Cloth → main thread" : "Cloth → worker thread");
  }, [useWorkerCloth]);

  const handleToggleWorkerSPH = useCallback(() => {
    if (!sphWorkerRef.current) { setStatus("Initialize workers first"); return; }
    setUseWorkerSPH(v => !v);
    setStatus(useWorkerSPH ? "SPH → main thread" : "SPH → worker thread");
  }, [useWorkerSPH]);

  // ── Sessions 166: Theme handlers ──────────────────────────────────────────
  const handleApplyTheme = useCallback((themeKey) => {
    const theme = THEMES[themeKey] || THEMES.dark;
    setActiveTheme(themeKey);
    setCustomTheme(theme);
    applyTheme(theme);
    saveThemeToStorage(theme);
    setStatus("Theme: " + theme.label);
  }, []);

  // ── Sessions 167: Shortcut overlay ───────────────────────────────────────
  const handleToggleShortcutOverlay = useCallback(() => {
    setShowShortcutOverlay(v => !v);
  }, []);

  // ── Sessions 168: Tour handlers ───────────────────────────────────────────
  const handleStartTour = useCallback(() => {
    const tour = createTourState();
    tour.active = true;
    setTourState(tour);
    setTourVisible(true);
    setStatus("Tour started");
  }, []);

  const handleAdvanceTour = useCallback(() => {
    const next = advanceTour(tourState);
    setTourState({ ...tourState });
    if (!next) { setTourVisible(false); setStatus("Tour complete!"); }
  }, [tourState]);

  // ── Sessions 169: StreamPireX export ─────────────────────────────────────
  const handlePublishToSPX = useCallback(async () => {
    if (!sceneRef.current || !rendererRef.current) { setStatus("No scene to publish"); return; }
    setStatus("Publishing to StreamPireX...");
    try {
      generateThumbnail(rendererRef.current, sceneRef.current, cameraRef.current);
      const payload = buildSPXExportPayload(sceneRef.current, { format: "spx" });
      const result = await exportToStreamPireX(payload);
      if (result.offline) {
        downloadSPXFile(payload, "scene.spx");
        setStatus("Published locally (offline) ✓");
      } else {
        setStatus("Published to StreamPireX ✓");
      }
    } catch(e) { setStatus("Publish failed: " + e.message); }
  }, []);

  const handleExportToSPX = useCallback(async () => {
    if (!sceneRef.current) return;
    const payload = buildSPXExportPayload(sceneRef.current, { format: exportFormat });
    if (exportFormat === "spx") {
      downloadSPXFile(payload);
      setExportResult({ success: true, local: true });
      setStatus("SPX scene downloaded");
    } else {
      setStatus("Exporting to StreamPireX...");
      const result = await exportToStreamPireX(payload);
      setExportResult(result);
      if (result.offline) {
        downloadSPXFile(payload, "scene." + exportFormat);
        setStatus("Exported locally (offline mode)");
      } else {
        setStatus("Exported to StreamPireX ✓");
      }
    }
  }, [exportFormat]);

  // ── Sessions 143-150: GPU Particle handlers ─────────────────────────────
  const handleCreateGPUParticles = useCallback(() => {
    const sys = createGPUParticleSystem({ maxCount: 50000, emitRate: 200, spread: 0.3 });
    sys.color1 = new THREE.Color(VFX_PRESETS[vfxPreset]?.color1 || "#ff4400");
    sys.color2 = new THREE.Color(VFX_PRESETS[vfxPreset]?.color2 || "#ffaa00");
    gpuParticleSysRef.current = sys;
    setGpuParticleSys(sys);
    sceneRef.current?.add(sys.instanced);
    setStatus("GPU particle system created — up to 50k particles");
  }, [vfxPreset]);

  const handleStartGPUParticles = useCallback(() => {
    const sys = gpuParticleSysRef.current; if (!sys) { setStatus("Create GPU particles first"); return; }
    setGpuRunning(true);
    const pos = meshRef.current?.position.clone() || new THREE.Vector3(0, 1, 0);
    const loop = () => {
      continuousEmit(sys, pos, 1 / 60);
      const active = stepGPUParticles(sys, 1 / 60);
      if (active % 30 === 0) setGpuParticleStats(getGPUParticleStats(sys));
      gpuRafRef.current = requestAnimationFrame(loop);
    };
    gpuRafRef.current = requestAnimationFrame(loop);
    setStatus("GPU particles running");
  }, []);

  const handleStopGPUParticles = useCallback(() => {
    if (gpuRafRef.current) cancelAnimationFrame(gpuRafRef.current);
    setGpuRunning(false);
    setStatus("GPU particles stopped");
  }, []);

  const handleBurstGPUParticles = useCallback(() => {
    const sys = gpuParticleSysRef.current; if (!sys) return;
    const pos = meshRef.current?.position.clone() || new THREE.Vector3(0, 1, 0);
    burstEmit(sys, pos, 500);
    if (!gpuRunning) {
      const loop = () => {
        const active = stepGPUParticles(sys, 1 / 60);
        if (active > 0) gpuRafRef.current = requestAnimationFrame(loop);
        else { setGpuRunning(false); }
      };
      setGpuRunning(true);
      gpuRafRef.current = requestAnimationFrame(loop);
    }
    setStatus("Burst: 500 particles");
  }, [gpuRunning]);

  const handleAddForceField = useCallback(() => {
    const sys = gpuParticleSysRef.current; if (!sys) return;
    const pos = meshRef.current?.position.clone() || new THREE.Vector3(0, 1, 0);
    const ff = createForceField(forceFieldType, pos, { strength: 1.5, radius: 2.0 });
    sys.forceFields.push(ff);
    setForceFields([...sys.forceFields]);
    setStatus("Force field added: " + forceFieldType);
  }, [forceFieldType]);

  // ── Sessions 151-153: Cloth upgrade handlers ──────────────────────────────
  const handleUpgradeCloth = useCallback(() => {
    const cloth = clothSimRef.current; if (!cloth) { setStatus("Create cloth first"); return; }
    const full = buildFullConstraints(cloth.mesh.geometry, cloth.particles);
    cloth.constraints = full;
    setUseUpgradedCloth(true);
    setStatus("Cloth upgraded — " + full.length + " constraints (stretch+shear+bend)");
  }, []);

  const handleStartUpgradedCloth = useCallback(() => {
    const cloth = clothSimRef.current; if (!cloth) return;
    setClothRunning(true);
    let time = 0;
    const loop = () => {
      time += 1 / 60;
      stepClothUpgraded(cloth, clothSpatialHash.current, 1 / 60, time);
      clothRafRef.current = requestAnimationFrame(loop);
    };
    clothRafRef.current = requestAnimationFrame(loop);
    setStatus("Upgraded cloth running");
  }, []);

  // ── Sessions 154-155: Hair upgrade handlers ───────────────────────────────
  const handleEmitHairFromUV = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    const dm = createDensityMap(256, 256, densityPattern);
    const strands = emitHairFromUV(mesh, dm, { length: 0.3, segments: 8 });
    hairStrandsRef.current = strands;
    setHairStrands([...strands]);
    if (hairGroup) sceneRef.current?.remove(hairGroup);
    const group = buildHairLines(strands);
    sceneRef.current?.add(group);
    setHairGroup(group);
    const stats = getHairUpgradeStats(strands);
    setStatus("UV hair: " + stats.total + " strands");
  }, [densityPattern, hairGroup]);

  const handleGenerateHairStyle = useCallback((style) => {
    const mesh = meshRef.current; if (!mesh) return;
    const pos = mesh.position.clone().add(new THREE.Vector3(0, 0.5, 0));
    const nor = new THREE.Vector3(0, 1, 0);
    let strands = [];
    switch (style) {
      case "braid": strands = generateBraidPreset(pos, nor, { length: 0.4, strands: 3 }); break;
      case "bun": strands = generateBunPreset(pos, nor, { radius: 0.1, strands: 20 }); break;
      case "ponytail": strands = generatePonytailPreset(pos, nor, { length: 0.4, strands: 30 }); break;
    }
    hairStrandsRef.current = [...hairStrandsRef.current, ...strands];
    setHairStrands([...hairStrandsRef.current]);
    if (hairGroup) sceneRef.current?.remove(hairGroup);
    const group = buildHairLines(hairStrandsRef.current);
    sceneRef.current?.add(group);
    setHairGroup(group);
    setStatus("Hair style: " + style + " (" + strands.length + " strands)");
  }, [hairGroup]);

  // ── Session 156: Animation upgrade handlers ───────────────────────────────
  const handleCreateIKFKBlend = useCallback(() => {
    const arm = armatureRef.current; if (!arm) { setStatus("Create armature first"); return; }
    if (!ikChains.length) { setStatus("Create IK chain first"); return; }
    const blend = createIKFKBlend(ikChainsRef.current[0]);
    ikfkRef.current = blend;
    setIkfkBlend(blend);
    setStatus("IK/FK blend created");
  }, [ikChains]);

  const handleSetIKFKBlend = useCallback((value) => {
    setIkfkValue(value);
    if (ikfkRef.current) {
      ikfkRef.current.blend = value;
      if (value < 0.5) captureFKPose(ikfkRef.current);
      else captureIKPose(ikfkRef.current);
      updateIKFKBlend(ikfkRef.current);
    }
  }, []);

  const handleUpdateShapeKeyDrivers = useCallback(() => {
    updateShapeKeyDrivers(shapeKeys, drivers, animFrame);
    setStatus("Shape key drivers updated at frame " + animFrame);
  }, [shapeKeys, drivers, animFrame]);

  const handleComputeEnvelopeWeights = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    const arm = armatureRef.current; if (!arm) return;
    computeEnvelopeWeights(mesh, arm);
    setStatus("Envelope weights computed");
  }, []);

  // ── Sessions 122-124: Collaboration handlers ────────────────────────────
  const handleCreateCollabSession = useCallback(() => {
    const session = createCollabSession({ userName: "User_" + Math.floor(Math.random() * 1000) });
    const channel = connectSession(session, (msg) => {
      if (msg.type === "join") {
        setCollabUsers(prev => [...prev, msg.user]);
        setStatus("User joined: " + msg.user.name);
      } else if (msg.type === "leave") {
        setCollabUsers(prev => prev.filter(u => u.id !== msg.userId));
      } else if (msg.type === "operation") {
        applyOperation(msg.op, sceneObjects);
        setStatus("Remote op: " + msg.op.type);
      } else if (msg.type === "comment") {
        setCommentPins(prev => [...prev, msg.comment]);
        if (sceneRef.current) buildCommentPinMesh(msg.comment, sceneRef.current);
      }
    });
    collabRef.current = session;
    setCollabSession(session);
    setStatus("Collaboration session created — ID: " + session.id.slice(0, 8));
  }, [sceneObjects]);

  const handleAddComment = useCallback(() => {
    if (!commentText || !collabRef.current) return;
    const pos = meshRef.current?.position.clone() || new THREE.Vector3(0, 1, 0);
    const pin = createCommentPin(pos, commentText, collabRef.current.localUser.name);
    broadcastComment(collabRef.current, pin);
    setCommentPins(prev => [...prev, pin]);
    if (sceneRef.current) buildCommentPinMesh(pin, sceneRef.current);
    setCommentText("");
    setStatus("Comment added");
  }, [commentText]);

  const handleSaveVersion = useCallback(() => {
    const snap = createVersionSnapshot(sceneObjects, "v" + (versionHistory.length + 1));
    setVersionHistory(prev => [...prev.slice(-49), snap]);
    setStatus("Version saved: " + snap.message);
  }, [sceneObjects, versionHistory]);

  const handleRestoreVersion = useCallback((snapId) => {
    const snap = versionHistory.find(v => v.id === snapId);
    if (!snap) return;
    restoreVersion(snap, sceneObjects);
    setStatus("Restored: " + snap.message);
  }, [versionHistory, sceneObjects]);

  const handleDisconnectCollab = useCallback(() => {
    if (collabRef.current) {
      disconnectSession(collabRef.current);
      setCollabSession(null);
      setCollabUsers([]);
      setStatus("Disconnected from session");
    }
  }, []);

  // ── Sessions 125-130: Electron/Desktop handlers ───────────────────────────
  const handleGetPlatformInfo = useCallback(() => {
    const info = getPlatformInfo();
    setPlatformInfo(info);
    setStatus(info.isElectron ? "Running in Electron desktop" : "Running in browser");
  }, []);

  const handleNativeOpen = useCallback(async () => {
    try {
      const result = await openFile({ accept: ".glb,.gltf,.obj,.fbx,.spx" });
      if (result) setStatus("Opened: " + result.path);
    } catch (e) { setStatus("Open cancelled"); }
  }, []);

  const handleNativeSave = useCallback(async () => {
    if (!sceneRef.current) return;
    try {
      const data = JSON.stringify({ scene: "SPX Scene", objects: sceneObjects.length });
      await saveFile(data, { filename: "scene.spx", mimeType: "application/json" });
      setStatus("Scene saved");
    } catch (e) { setStatus("Save failed: " + e.message); }
  }, [sceneObjects]);

  const handleCheckUpdates = useCallback(async () => {
    const result = await checkForUpdates();
    setUpdateAvailable(result.hasUpdate);
    setStatus(result.hasUpdate ? "Update available: " + result.version : "Up to date");
  }, []);

  // Register keyboard shortcuts on mount
  useEffect(() => {
    const handlers = {
      save: handleNativeSave,
      open: handleNativeOpen,
      toggleWireframe: () => { const m = meshRef.current; if (m?.material) { m.material.wireframe = !m.material.wireframe; } },
      focusSelected: () => { if (meshRef.current) { const b = new THREE.Box3().setFromObject(meshRef.current); cameraRef.current?.lookAt(b.getCenter(new THREE.Vector3())); } },
      duplicate: () => { const m = meshRef.current; if (m && sceneRef.current) { const c = m.clone(); c.position.x += 0.5; sceneRef.current.add(c); } },
    };
    shortcutCleanupRef.current = registerShortcuts(handlers);
    return () => shortcutCleanupRef.current?.();
  }, [handleNativeSave, handleNativeOpen]);

  // ── Sessions 108-115: VFX handlers ──────────────────────────────────────
  const handleCreateVFXEmitter = useCallback(() => {
    const pos = meshRef.current?.position.clone() || new THREE.Vector3(0, 0, 0);
    const emitter = createEmitter({ preset: vfxPreset, position: pos, type: "sphere" });
    vfxEmittersRef.current = [...vfxEmittersRef.current, emitter];
    setVfxEmitters([...vfxEmittersRef.current]);
    const pts = buildParticleSystem(emitter);
    sceneRef.current?.add(pts);
    vfxSystemsRef.current = [...vfxSystemsRef.current, { emitter, pts }];
    setVfxSystems([...vfxSystemsRef.current]);
    setStatus("VFX emitter: " + vfxPreset);
  }, [vfxPreset]);

  const handleStartVFX = useCallback(() => {
    setVfxRunning(true);
    const loop = () => {
      vfxEmittersRef.current.forEach(em => stepEmitter(em, 1 / 60));
      vfxSystemsRef.current.forEach(({ emitter, pts }) => updateParticleSystem(pts, emitter));
      if (destFragsRef.current.length) {
        destFragsRef.current = stepDestructionFrags(destFragsRef.current, 1 / 60);
        setDestFrags([...destFragsRef.current]);
      }
      vfxRafRef.current = requestAnimationFrame(loop);
    };
    vfxRafRef.current = requestAnimationFrame(loop);
    setStatus("VFX running");
  }, []);

  const handleStopVFX = useCallback(() => {
    if (vfxRafRef.current) cancelAnimationFrame(vfxRafRef.current);
    setVfxRunning(false);
    setStatus("VFX stopped");
  }, []);

  const handleDestructMesh = useCallback(() => {
    const mesh = meshRef.current; if (!mesh || !sceneRef.current) return;
    const frags = createDestructionEffect(mesh, sceneRef.current, { pieces: 16, force: 2.0 });
    destFragsRef.current = frags;
    setDestFrags([...frags]);
    meshRef.current = null;
    if (!vfxRunning) handleStartVFX();
    setStatus("Mesh destructed: " + frags.length + " pieces");
  }, [vfxRunning, handleStartVFX]);

  // ── Sessions 108: Fluid handlers ─────────────────────────────────────────
  const handleCreateFluid = useCallback(() => {
    const preset = FLUID_PRESETS[fluidPreset];
    const fluid = createFluidSettings({ type: fluidPreset, viscosity: preset?.viscosity || 0.1 });
    const pos = meshRef.current?.position.clone() || new THREE.Vector3(0, 1, 0);
    emitFluid(fluid, pos, 50);
    fluid.enabled = true;
    fluidSimRef.current = fluid;
    setFluidSim(fluid);
    const mesh2 = buildFluidMesh(fluid);
    if (mesh2) { sceneRef.current?.add(mesh2); fluidMeshRef.current = mesh2; setFluidMesh(mesh2); }
    setStatus("Fluid created: " + fluidPreset);
  }, [fluidPreset]);

  const handleStartFluid = useCallback(() => {
    const fluid = fluidSimRef.current; if (!fluid) { setStatus("Create fluid first"); return; }
    setFluidRunning(true);
    const loop = () => {
      stepSPH(fluid, 1 / 60);
      if (fluidMeshRef.current) updateFluidMesh(fluidMeshRef.current, fluid);
      fluidRafRef.current = requestAnimationFrame(loop);
    };
    fluidRafRef.current = requestAnimationFrame(loop);
    setStatus("Fluid running: " + getFluidStats(fluid).particles + " particles");
  }, []);

  const handleStopFluid = useCallback(() => {
    if (fluidRafRef.current) cancelAnimationFrame(fluidRafRef.current);
    setFluidRunning(false);
    setStatus("Fluid stopped");
  }, []);

  const handleCreatePyro = useCallback(() => {
    const pos = meshRef.current?.position.clone() || new THREE.Vector3(0, 0, 0);
    const pyro = createPyroEmitter(pos, { temperature: 800 });
    pyroSimRef.current = pyro;
    setPyroSim(pyro);
    const mesh2 = buildFluidMesh(pyro);
    if (mesh2) sceneRef.current?.add(mesh2);
    setStatus("Pyro/fire created");
  }, []);

  // ── Sessions 116-119: Asset Library handlers ──────────────────────────────
  const handleSaveToLibrary = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    const thumb = rendererRef.current ? generateThumbnail(rendererRef.current, sceneRef.current, cameraRef.current) : null;
    const asset = addAsset(assetLibrary, {
      name: mesh.name || "Asset_" + Date.now(),
      type: "mesh",
      thumbnail: thumb,
      tags: ["user"],
    });
    setAssetLibrary({ ...assetLibrary });
    setStatus("Saved to library: " + asset.name);
  }, [assetLibrary]);

  const handleSearchAssets = useCallback((query) => {
    setAssetSearch(query);
  }, []);

  // ── Session 120: Procedural animation handlers ────────────────────────────
  const handleToggleProcAnim = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    if (procAnimEnabled) {
      setProcAnimEnabled(false);
      if (procAnimRef.current) cancelAnimationFrame(procAnimRef.current);
      setStatus("Procedural animation stopped");
    } else {
      setProcAnimEnabled(true);
      const startTime = Date.now();
      const loop = () => {
        const t = (Date.now() - startTime) / 1000;
        applyProceduralAnimation(mesh, procAnimKey, t);
        procAnimRef.current = requestAnimationFrame(loop);
      };
      procAnimRef.current = requestAnimationFrame(loop);
      setStatus("Procedural animation: " + procAnimKey);
    }
  }, [procAnimEnabled, procAnimKey]);

  // ── Session 121: Performance + Scene stats handlers ───────────────────────
  const handleOptimizeScene = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) return;
    const stats = optimizeScene(sceneRef.current, cameraRef.current);
    const scStats = getSceneStats(sceneRef.current);
    setSceneStats({ ...stats, ...scStats });
    setStatus("Optimized — " + stats.visible + " visible, " + stats.culled + " culled");
  }, []);

  const handleGetSceneStats = useCallback(() => {
    if (!sceneRef.current) return;
    const stats = getSceneStats(sceneRef.current);
    setSceneStats(stats);
    setStatus("Scene: " + stats.meshes + " meshes, " + stats.triangles + " tris");
  }, []);

  // ── Sessions 91-107: Render handlers ────────────────────────────────────
  const handleApplySSS = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    const mat = createSSSMaterial(sssPreset);
    mesh.material = mat;
    setPbrMaterial(mat);
    setStatus("SSS applied: " + sssPreset);
  }, [sssPreset]);

  const handleApplyTransmission = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    const mat = createTransmissionMaterial(transmissionPreset);
    mesh.material = mat;
    setPbrMaterial(mat);
    setStatus("Transmission: " + transmissionPreset);
  }, [transmissionPreset]);

  const handleApplyPBR = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    const mat = createPBRMaterial({ roughness: 0.5, metalness: 0.0 });
    mesh.material = mat;
    setPbrMaterial(mat);
    setStatus("PBR material applied");
  }, []);

  const handleApplyDisplacement = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    const tex = createDisplacementTexture(256, 256, dispPattern);
    if (!mesh.material) mesh.material = createPBRMaterial();
    mesh.material.displacementMap = tex;
    mesh.material.displacementScale = dispScale;
    mesh.material.needsUpdate = true;
    setStatus("Displacement applied: " + dispPattern);
  }, [dispPattern, dispScale]);

  const handleApplyToneMapping = useCallback(() => {
    if (!rendererRef.current) return;
    applyToneMappingMode(rendererRef.current, toneMappingMode, toneExposure);
    setStatus("Tone mapping: " + toneMappingMode + " @ " + toneExposure.toFixed(2));
  }, [toneMappingMode, toneExposure]);

  const handleApplyRenderPreset = useCallback(() => {
    if (!rendererRef.current) return;
    const preset = applyRenderPreset(rendererRef.current, renderPreset);
    setStatus("Render preset: " + preset?.label);
  }, [renderPreset]);

  const handleCaptureFrame = useCallback(() => {
    if (!rendererRef.current) return;
    downloadFrame(rendererRef.current, "render_" + Date.now() + ".png", "PNG");
    setStatus("Frame captured");
  }, []);

  const handleApplyAtmosphere = useCallback(() => {
    if (!sceneRef.current) return;
    const preset = applyAtmospherePreset(sceneRef.current, atmospherePreset);
    setStatus("Atmosphere: " + preset?.label);
  }, [atmospherePreset]);

  const handleToggleVolumetric = useCallback(() => {
    const next = { ...volumetricSettings, enabled: !volumetricSettings.enabled };
    setVolumetricSettings(next);
    if (sceneRef.current) applyVolumetricFog(sceneRef.current, next);
    setStatus(next.enabled ? "Volumetric fog ON" : "Volumetric fog OFF");
  }, [volumetricSettings]);

  const handleSeek = useCallback((frame, keys) => {
    setAnimFrame(frame);
    setAnimKeys(keys);
    // Apply keyframe values to objects
    sceneObjects.forEach(obj => {
      if (!obj.mesh || !keys[obj.id]) return;
      const ch = keys[obj.id];
      if (ch["pos.x"] !== undefined) {
        const x = getLinearValue(ch["pos.x"], frame);
        const y = getLinearValue(ch["pos.y"], frame);
        const z = getLinearValue(ch["pos.z"], frame);
        if (x !== null) obj.mesh.position.x = x;
        if (y !== null) obj.mesh.position.y = y;
        if (z !== null) obj.mesh.position.z = z;
      }
      if (ch["rot.x"] !== undefined) {
        const rx = getLinearValue(ch["rot.x"], frame);
        const ry = getLinearValue(ch["rot.y"], frame);
        const rz = getLinearValue(ch["rot.z"], frame);
        if (rx !== null) obj.mesh.rotation.x = rx;
        if (ry !== null) obj.mesh.rotation.y = ry;
        if (rz !== null) obj.mesh.rotation.z = rz;
      }
      if (ch["scale"] !== undefined) {
        const s = getLinearValue(ch["scale"], frame);
        if (s !== null) obj.mesh.scale.setScalar(s);
      }
    });
  }, [sceneObjects]);

  const handleRenderVideo = useCallback(async () => {
    const renderer = rendererRef.current;
    const canvas   = canvasRef.current;
    if (!renderer || !canvas) { setStatus("No renderer"); return; }

    setVideoRendering(true);
    setVideoProgress(0);
    setStatus("Rendering video...");

    const fps        = videoFps;
    const startFrame = videoStartFrame;
    const endFrame   = videoEndFrame;
    const total      = endFrame - startFrame;

    // Set up offscreen canvas at target resolution
    const offscreen  = document.createElement("canvas");
    offscreen.width  = videoWidth;
    offscreen.height = videoHeight;
    const octx       = offscreen.getContext("2d");

    // MediaRecorder setup
    const stream   = offscreen.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
      videoBitsPerSecond: 8_000_000,
    });
    const chunks = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.start();

    const msPerFrame = 1000 / fps;

    for (let f = startFrame; f <= endFrame; f++) {
      // Seek timeline to this frame
      handleSeek(f, animKeys);
      // Re-render scene
      renderer.setSize(videoWidth, videoHeight, false);
      renderer.render(sceneRef.current, cameraRef.current);
      // Copy to offscreen canvas
      octx.drawImage(canvas, 0, 0, videoWidth, videoHeight);
      // Wait one frame interval so MediaRecorder samples it
      await new Promise(res => setTimeout(res, msPerFrame));
      setVideoProgress(Math.round(((f - startFrame) / total) * 100));
    }

    // Restore renderer size
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight, false);

    recorder.stop();
    await new Promise(res => { recorder.onstop = res; });

    const blob = new Blob(chunks, { type: "video/webm" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "spx_render_" + Date.now() + ".webm";
    a.click();
    URL.revokeObjectURL(url);

    setVideoRendering(false);
    setVideoProgress(0);
    setStatus("Video exported ✓");
  }, [videoFps, videoStartFrame, videoEndFrame, videoWidth, videoHeight, animKeys, handleSeek]);

  const handleRenderPasses = useCallback(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setStatus("Rendering passes...");
    try {
      const results = renderAllPasses(rendererRef.current, sceneRef.current, cameraRef.current, passStack);
      setPassResults(results);
      setStatus("Passes rendered: " + Object.keys(results).join(", "));
    } catch (e) { setStatus("Pass render failed: " + e.message); }
  }, [passStack]);

  const handleDownloadPass = useCallback((passType) => {
    const canvas = passResults[passType];
    if (!canvas) { setStatus("Render passes first"); return; }
    downloadPass(canvas, passType, "PNG");
    setStatus("Downloaded: " + passType);
  }, [passResults]);

  const handleAddProbe = useCallback(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    const probe = createReflectionProbe(
      meshRef.current?.position.clone() || new THREE.Vector3(0, 1, 0)
    );
    probeManagerRef.current.add(probe, sceneRef.current);
    updateReflectionProbe(probe, rendererRef.current, sceneRef.current);
    applyProbeToScene(sceneRef.current, probe);
    setProbes([...probeManagerRef.current.probes]);
    setStatus("Reflection probe added");
  }, []);

  const handleAddAmbientProbe = useCallback(() => {
    if (!sceneRef.current) return;
    createAmbientProbe(sceneRef.current, { intensity: 0.5 });
    setStatus("Ambient (GI) probe added");
  }, []);

  const handleGetRenderStats = useCallback(() => {
    if (!rendererRef.current) return;
    const stats = getRenderStats(rendererRef.current);
    setRenderStats(stats);
  }, []);

  // ── Sessions 78-87: Hair handlers ───────────────────────────────────────
  const handleEmitHair = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    setStatus("Emitting hair...");
    try {
      const preset = HAIR_PRESETS[hairPreset];
      const strands = applyHairPreset(mesh, hairPreset);
      hairStrandsRef.current = strands;
      setHairStrands([...strands]);
      if (hairGroup) sceneRef.current?.remove(hairGroup);
      const group = hairDisplayMode === "tubes"
        ? buildHairTubes(strands)
        : buildHairLines(strands);
      sceneRef.current?.add(group);
      setHairGroup(group);
      const stats = getHairStats(strands);
      setStatus("Hair: " + stats.strands + " strands emitted");
    } catch (e) { setStatus("Hair emit failed: " + e.message); }
  }, [hairPreset, hairDisplayMode, hairGroup]);

  const handleGroomHair = useCallback((hit) => {
    const strands = hairStrandsRef.current;
    if (!strands.length || !hit) return;
    applyGroomBrush(hairGroomBrush, strands, hit.point,
      hit.face?.normal || new THREE.Vector3(0, 1, 0), { radius: 0.3, strength: 0.05 });
    if (hairGroup) sceneRef.current?.remove(hairGroup);
    const group = hairDisplayMode === "tubes"
      ? buildHairTubes(strands)
      : buildHairLines(strands);
    sceneRef.current?.add(group);
    setHairGroup(group);
  }, [hairGroomBrush, hairDisplayMode, hairGroup]);

  const handleGenerateHairCards = useCallback(() => {
    const strands = hairStrandsRef.current;
    if (!strands.length) { setStatus("Emit hair first"); return; }
    const cards = generateHairCards(strands);
    const cardMesh = buildHairCardMesh(cards, createAnisotropicHairMaterial(hairShaderPreset));
    if (hairCardMesh) sceneRef.current?.remove(hairCardMesh);
    sceneRef.current?.add(cardMesh);
    setHairCards(cards);
    setHairCardMesh(cardMesh);
    const stats = getHairCardStats(cards);
    setStatus("Hair cards: " + stats.cards + " cards, " + stats.triangles + " tris");
  }, [hairShaderPreset, hairCardMesh]);

  const handleToggleHairPhysics = useCallback(() => {
    setHairPhysSettings(prev => {
      const next = { ...prev, enabled: !prev.enabled };
      hairPhysRef.current = next;
      return next;
    });
  }, []);

  const handleResetHair = useCallback(() => {
    resetHairToRest(hairStrandsRef.current);
    if (hairGroup) sceneRef.current?.remove(hairGroup);
    const group = buildHairLines(hairStrandsRef.current);
    sceneRef.current?.add(group);
    setHairGroup(group);
    setStatus("Hair reset to rest");
  }, [hairGroup]);

  // ── Sessions 88-90: Cloth handlers ───────────────────────────────────────
  const handleCreateCloth = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    try {
      const cloth = createCloth(mesh, { stiffness: 0.8, damping: 0.99 });
      if (!cloth) { setStatus("Cloth creation failed"); return; }
      applyClothPreset(cloth, clothPreset);
      clothSimRef.current = cloth;
      setClothSim(cloth);
      const colliders = [createPlaneCollider(new THREE.Vector3(0, 1, 0), 0)];
      setClothColliders(colliders);
      pinTopRow(cloth);
      const stats = getClothStats(cloth);
      setStatus("Cloth: " + stats.particles + " particles, " + stats.pinned + " pinned");
    } catch (e) { setStatus("Cloth failed: " + e.message); }
  }, [clothPreset]);

  const handleStartCloth = useCallback(() => {
    const cloth = clothSimRef.current; if (!cloth) { setStatus("Create cloth first"); return; }
    setClothRunning(true);
    const simulate = () => {
      stepCloth(cloth, 1 / 60);
      if (clothSelfCol) applySelfCollision(cloth);
      applyCollisions(cloth, clothColliders);
      clothRafRef.current = requestAnimationFrame(simulate);
    };
    clothRafRef.current = requestAnimationFrame(simulate);
    setStatus("Cloth simulation running");
  }, [clothColliders, clothSelfCol]);

  const handleStopCloth = useCallback(() => {
    if (clothRafRef.current) cancelAnimationFrame(clothRafRef.current);
    setClothRunning(false);
    setStatus("Cloth stopped");
  }, []);

  const handleResetCloth = useCallback(() => {
    handleStopCloth();
    const cloth = clothSimRef.current; if (!cloth) return;
    resetCloth(cloth);
    setStatus("Cloth reset");
  }, [handleStopCloth]);

  const handleAddClothCollider = useCallback(() => {
    const mesh = meshRef.current;
    if (mesh) {
      const cols = createCollidersFromMesh(mesh);
      setClothColliders(prev => [...prev, ...cols]);
      cols.forEach(c => visualizeCollider(c, sceneRef.current));
      setStatus("Colliders added from mesh");
    } else {
      const col = createSphereCollider(new THREE.Vector3(0, 0, 0), 0.5);
      setClothColliders(prev => [...prev, col]);
      visualizeCollider(col, sceneRef.current);
      setStatus("Sphere collider added");
    }
  }, []);

  // ── Session 71-72: DynaMesh handlers ────────────────────────────────────
  const handleDynaMeshRemesh = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    setStatus("DynaMesh remeshing...");
    try {
      const newMesh = dynaMeshRemesh(mesh, dynaMeshSettings);
      sceneRef.current?.remove(mesh);
      sceneRef.current?.add(newMesh);
      meshRef.current = newMesh;
      heMeshRef.current = null;
      setSceneObjects(prev => prev.map(o => o.mesh === mesh ? { ...o, mesh: newMesh } : o));
      const stats = getDynaMeshStats(newMesh);
      setDynaMeshStats(stats);
      setStatus("DynaMesh complete — " + stats.vertices + "v / " + stats.triangles + "t");
    } catch (e) { setStatus("DynaMesh failed: " + e.message); }
  }, [dynaMeshSettings]);

  const handleToggleDynaMesh = useCallback(() => {
    setDynaMeshSettings(prev => ({ ...prev, enabled: !prev.enabled }));
    setStatus(dynaMeshSettings.enabled ? "DynaMesh off" : "DynaMesh on");
  }, [dynaMeshSettings.enabled]);

  // ── Sessions 75-76: Auto-retopo handlers ─────────────────────────────────
  const handleAutoRetopo = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    setStatus("Auto-retopo running...");
    try {
      const result = quadDominantRetopo(mesh, retopoSettings);
      const stats = getRetopoStats(mesh, result);
      sceneRef.current?.add(result);
      setRetopoResult(result);
      setRetopoStats(stats);
      setSceneObjects(prev => [...prev, {
        id: crypto.randomUUID(), name: result.name, type: "box",
        visible: true, parentId: null, mesh: result,
      }]);
      setStatus("Retopo complete — " + stats.reductionRatio + " reduction, " + stats.retopoFaces + " faces");
    } catch (e) { setStatus("Retopo failed: " + e.message); }
  }, [retopoSettings]);

  const handleApplyRetopo = useCallback(() => {
    if (!retopoResult) { setStatus("Run auto-retopo first"); return; }
    const mesh = meshRef.current; if (!mesh) return;
    sceneRef.current?.remove(mesh);
    meshRef.current = retopoResult;
    setSceneObjects(prev => prev.map(o => o.mesh === mesh ? { ...o, mesh: retopoResult } : o));
    setRetopoResult(null);
    setStatus("Retopo applied");
  }, [retopoResult]);

  // ── Session 77: Fibermesh handlers ───────────────────────────────────────
  const handleGenerateFibermesh = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    setStatus("Generating fibermesh...");
    try {
      const strands = generateFibermesh(mesh, {
        density: fiberDensity, length: fiberLength, segments: 8,
      });
      fiberStrandsRef.current = strands;
      setFiberStrands([...strands]);

      // Remove old fiber group
      if (fiberGroup) sceneRef.current?.remove(fiberGroup);

      const group = fiberMode === "tubes"
        ? buildFibermeshTubes(strands)
        : buildFibermeshLines(strands);

      if (group) {
        sceneRef.current?.add(group);
        setFiberGroup(group);
      }
      const stats = getFibermeshStats(strands);
      setStatus("Fibermesh: " + stats.strands + " strands, avg " + stats.avgLength + " length");
    } catch (e) { setStatus("Fibermesh failed: " + e.message); }
  }, [fiberDensity, fiberLength, fiberMode, fiberGroup]);

  const handleFiberBrushStroke = useCallback((hit) => {
    const strands = fiberStrandsRef.current;
    if (!strands.length || !hit) return;
    switch (fiberBrush) {
      case "comb": combStrands(strands, hit.point, hit.face?.normal || new THREE.Vector3(0, 1, 0), { radius: 0.3, strength: 0.05 }); break;
      case "length": adjustLength(strands, hit.point, 1.1, { radius: 0.3 }); break;
      case "clump": clumpStrands(strands, hit.point, { radius: 0.3, strength: 0.2 }); break;
      case "puff": puffStrands(strands, hit.point, hit.face?.normal || new THREE.Vector3(0, 1, 0), { radius: 0.3, strength: 0.05 }); break;
      case "smooth": smoothStrands(strands, hit.point, { radius: 0.3, strength: 0.3 }); break;
    }
    // Rebuild display
    if (fiberGroup) sceneRef.current?.remove(fiberGroup);
    const group = fiberMode === "tubes"
      ? buildFibermeshTubes(strands)
      : buildFibermeshLines(strands);
    if (group) { sceneRef.current?.add(group); setFiberGroup(group); }
  }, [fiberBrush, fiberMode, fiberGroup]);

  // ── Session 64: Driver handlers ──────────────────────────────────────────
  const handleAddDriver = useCallback(() => {
    const driver = createDriver({
      name: "Driver_" + drivers.length,
      expression: driverExpr,
      targetObjId: activeObjId,
      targetProp: "rot.y",
    });
    // Add frame variable by default
    driver.variables.push(createVariable("frame", null, "frame"));
    setDrivers(prev => [...prev, driver]);
    setActiveDriverId(driver.id);
    setStatus("Driver added: " + driver.name);
  }, [drivers, driverExpr, activeObjId]);

  const handleApplyDriverPreset = useCallback((presetKey) => {
    const preset = DRIVER_PRESETS[presetKey];
    if (!preset) return;
    setDriverExpr(preset.expression);
    setStatus("Driver preset: " + preset.label);
  }, []);

  const handleEvalDrivers = useCallback(() => {
    applyAllDrivers(drivers, sceneObjects, shapeKeys, animFrame);
    setStatus("Drivers evaluated at frame " + animFrame);
  }, [drivers, sceneObjects, shapeKeys, animFrame]);

  const handleRemoveDriver = useCallback((id) => {
    setDrivers(prev => prev.filter(d => d.id !== id));
    if (activeDriverId === id) setActiveDriverId(null);
    setStatus("Driver removed");
  }, [activeDriverId]);

  // ── Session 65: Constraint handlers ──────────────────────────────────────
  const handleAddConstraint = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select object first"); return; }
    const targetObj = sceneObjects.find(o => o.mesh !== mesh);
    const constraint = createConstraint(constraintType, targetObj?.id || null);
    setConstraints(prev => [...prev, constraint]);
    setStatus("Constraint added: " + constraintType);
  }, [constraintType, sceneObjects]);

  const handleApplyConstraints = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    applyAllConstraints(constraints, mesh, sceneObjects);
    setStatus("Constraints applied");
  }, [constraints, sceneObjects]);

  const handleRemoveConstraint = useCallback((id) => {
    setConstraints(prev => prev.filter(c => c.id !== id));
    setStatus("Constraint removed");
  }, []);

  // ── Session 66: Physics bake handlers ────────────────────────────────────
  const handleAddRigidBody = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    const rb = createRigidBody(mesh, { mass: 1.0 });
    setRigidBodies(prev => [...prev, rb]);
    setStatus("Rigid body added — " + rigidBodies.length + 1 + " total");
  }, [rigidBodies]);

  const handleBakePhysics = useCallback(async () => {
    if (!rigidBodies.length) { setStatus("Add rigid bodies first"); return; }
    setPhysBaking(true);
    setStatus("Baking physics...");
    try {
      const baked = bakeRigidBodies(rigidBodies, 120, 24);
      setBakedPhysics(baked);
      setStatus("Physics baked — 120 frames");
    } catch (e) { setStatus("Bake failed: " + e.message); }
    setPhysBaking(false);
  }, [rigidBodies]);

  const handleApplyBakedPhysicsFrame = useCallback((frame) => {
    if (!bakedPhysics) return;
    rigidBodies.forEach(rb => applyBakedFrame(bakedPhysics, rb.mesh, frame));
  }, [bakedPhysics, rigidBodies]);

  const handleFractureMesh = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    const frags = fractureMesh(mesh, 8);
    sceneRef.current?.remove(mesh);
    frags.forEach(f => sceneRef.current?.add(f.mesh));
    setFragments(frags);
    setRigidBodies(prev => [...prev, ...frags.map(f => f.rb)]);
    setSceneObjects(prev => {
      const filtered = prev.filter(o => o.mesh !== mesh);
      return [...filtered, ...frags.map(f => ({
        id: crypto.randomUUID(), name: f.mesh.name, type: "box",
        visible: true, parentId: null, mesh: f.mesh,
      }))];
    });
    setStatus("Mesh fractured into " + frags.length + " pieces");
  }, []);

  // ── Session 67: Walk cycle handlers ──────────────────────────────────────
  const handleGenerateWalkCycle = useCallback(() => {
    const arm = armatureRef.current;
    if (!arm) { setStatus("Create armature first"); return; }
    const walkData = generateWalkCycle(arm, {
      style: walkStyle, speed: walkSpeed, stride: walkStride, fps: 24, loopFrames: 24,
    });
    setWalkCycleData(walkData);
    setStatus("Walk cycle generated — " + walkStyle + " style");
  }, [walkStyle, walkSpeed, walkStride]);

  const handleGenerateIdle = useCallback(() => {
    const arm = armatureRef.current; if (!arm) return;
    const idleData = generateIdleCycle(arm, { loopFrames: 48 });
    setWalkCycleData(idleData);
    setStatus("Idle cycle generated");
  }, []);

  const handleGenerateBreathing = useCallback(() => {
    const arm = armatureRef.current; if (!arm) return;
    const breathData = generateBreathingCycle(arm, { speed: 1.0, loopFrames: 60 });
    setWalkCycleData(breathData);
    setStatus("Breathing cycle generated");
  }, []);

  // ── Sessions 51-52: Light handlers ──────────────────────────────────────
  const handleAddLight = useCallback(() => {
    if (!sceneRef.current) return;
    const light = createLight(lightType, { color: lightColor, intensity: lightIntensity });
    light.position.set((Math.random() - 0.5) * 6, 3 + Math.random() * 3, (Math.random() - 0.5) * 6);
    sceneRef.current.add(light);
    addLightHelper(sceneRef.current, light);
    const lights = getSceneLights(sceneRef.current);
    setSceneLights([...lights]);
    setActiveLightId(light.userData.lightId);
    setStatus("Light added: " + lightType);
  }, [lightType, lightColor, lightIntensity]);

  const handleThreePointLighting = useCallback(() => {
    if (!sceneRef.current) return;
    const lights = createThreePointLighting(sceneRef.current, lightIntensity);
    setSceneLights(prev => [...prev, ...lights]);
    setStatus("Three-point lighting created");
  }, [lightIntensity]);

  const handleApplyTemperature = useCallback((tempKey) => {
    const light = sceneLights.find(l => l.userData.lightId === activeLightId);
    if (!light) return;
    const preset = applyTemperature(light, TEMPERATURE_PRESETS[tempKey]?.kelvin || 5500);
    setLightTemp(tempKey);
    setStatus("Temperature: " + preset.label + " (" + preset.kelvin + "K)");
  }, [sceneLights, activeLightId]);

  const handleToggleFog = useCallback(() => {
    if (!sceneRef.current) return;
    if (fogEnabled) { removeFog(sceneRef.current); setFogEnabled(false); setStatus("Fog removed"); }
    else { createVolumericFog(sceneRef.current, { color: fogColor, density: fogDensity }); setFogEnabled(true); setStatus("Fog enabled"); }
  }, [fogEnabled, fogColor, fogDensity]);

  const handleApplyHDRI = useCallback((presetId) => {
    if (!sceneRef.current) return;
    const preset = applyHDRI(sceneRef.current, presetId);
    setHdriPreset(presetId);
    setStatus("HDRI: " + preset.label);
  }, []);

  // ── Session 55: Camera handlers ───────────────────────────────────────────
  const handleAddCamera = useCallback(() => {
    const cam = createCamera({ fov: camFOV, name: "Camera_" + cameras.length });
    cam.position.copy(cameraRef.current?.position || new THREE.Vector3(0, 2, 8));
    cam.lookAt(0, 0, 0);
    camManagerRef.current.add(cam);
    setCameras(prev => [...prev, cam]);
    setActiveCamId(cam.userData.cameraId);
    setStatus("Camera added: " + cam.name);
  }, [cameras, camFOV]);

  const handleSaveBookmark = useCallback(() => {
    const cam = cameraRef.current; if (!cam) return;
    if (!cam.userData.bookmarks) cam.userData.bookmarks = [];
    const bm = saveBookmark(cam, "Bookmark_" + cam.userData.bookmarks.length);
    setStatus("Bookmark saved: " + bm.name);
  }, []);

  const handleCameraShake = useCallback(() => {
    const cam = cameraRef.current; if (!cam) return;
    applyCameraShake(cam, { intensity: 0.05, duration: 0.5 });
    setStatus("Camera shake applied");
  }, []);

  // ── Session 56: Post processing handlers ─────────────────────────────────
  const handleToggleEffect = useCallback((index) => {
    setPostEffects(prev => prev.map((e, i) => i === index ? { ...e, enabled: !e.enabled } : e));
  }, []);

  const handleUpdateEffect = useCallback((index, key, value) => {
    setPostEffects(prev => prev.map((e, i) => i === index ? { ...e, [key]: value } : e));
  }, []);

  // ── Session 59: Mocap retarget handlers ───────────────────────────────────
  const handleAutoDetectBoneMap = useCallback(() => {
    const arm = armatureRef.current; if (!arm || !bvhData) return;
    const map = autoDetectBoneMap(bvhData.bvh.joints, arm.userData.bones || []);
    setBoneMap({ ...DEFAULT_BONE_MAP, ...map });
    const stats = getRetargetStats(bvhData.bvh, map, arm);
    setRetargetStats(stats);
    setStatus("Bone map detected — " + stats.coverage + "% coverage");
  }, [bvhData]);

  const handleRetargetFrame = useCallback((frame) => {
    const arm = armatureRef.current; if (!arm || !bvhData) return;
    retargetFrame(bvhData.bvh, boneMap, arm, frame);
    buildBoneDisplay(arm);
    setStatus("Retargeted frame " + frame);
  }, [bvhData, boneMap]);

  // ── Session 61: IK handlers ───────────────────────────────────────────────
  const handleCreateIKChain = useCallback(() => {
    const arm = armatureRef.current; if (!arm) { setStatus("Create armature first"); return; }
    const bones = arm.userData.bones?.slice(0, 3) || [];
    if (bones.length < 2) { setStatus("Need at least 2 bones"); return; }
    const target = new THREE.Vector3(0, 2, 0);
    const chain = createIKChain(bones, target);
    ikChainsRef.current = [...ikChainsRef.current, chain];
    setIkChains([...ikChainsRef.current]);
    setStatus("IK chain created — " + bones.length + " bones");
  }, []);

  const handleSolveIK = useCallback(() => {
    ikChainsRef.current.forEach(chain => { solveFABRIK(chain); });
    const arm = armatureRef.current;
    if (arm) buildBoneDisplay(arm);
    setStatus("IK solved");
  }, []);

  const handleSetIKTarget = useCallback((x, y, z) => {
    ikChainsRef.current.forEach(chain => setIKTarget(chain, new THREE.Vector3(x, y, z)));
    handleSolveIK();
  }, [handleSolveIK]);

  // ── Sessions 31-32: Advanced sculpt brush handlers ──────────────────────
  const handleAdvBrushStroke = useCallback((e) => {
    const mesh = meshRef.current; if (!mesh?.geometry) return;
    const camera = cameraRef.current; if (!camera) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const { getSculptHit } = window.__sculptHit || {};
    if (typeof getSculptHit !== "function") return;
    const hit = getSculptHit(e, canvas, camera, mesh);
    if (!hit) return;
    applyBrush(advBrush, mesh, hit, {
      radius: advBrushRadius, strength: advBrushStr, invert: advBrushInvert,
    });
  }, [advBrush, advBrushRadius, advBrushStr, advBrushInvert]);

  // ── Session 33: Remesh handlers ───────────────────────────────────────────
  const handleVoxelRemesh = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    const newMesh = voxelRemesh(mesh, remeshVoxel);
    sceneRef.current?.remove(mesh);
    sceneRef.current?.add(newMesh);
    meshRef.current = newMesh;
    setSceneObjects(prev => prev.map(o => o.mesh === mesh ? { ...o, mesh: newMesh } : o));
    setStatus("Voxel remesh complete — voxel size: " + remeshVoxel);
  }, [remeshVoxel]);

  const handleSymmetrize = useCallback((axis) => {
    const mesh = meshRef.current; if (!mesh) return;
    symmetrizeMesh(mesh, axis);
    setStatus("Symmetrized along " + axis + " axis");
  }, []);

  // ── Sessions 34-35: Multires handlers ────────────────────────────────────
  const handleCreateMultires = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    const stack = createMultiresStack(mesh);
    setMultiresStack(stack);
    setMultiresLevel2(0);
    setStatus("Multires stack created — 1 level");
  }, []);

  const handleSubdivideMultires = useCallback(() => {
    if (!multiresStack) { setStatus("Create multires stack first"); return; }
    subdivideLevel(multiresStack);
    setMultiresLevel2(multiresStack.currentLevel);
    const stats = getMultiresStats(multiresStack);
    setStatus("Subdivided to level " + multiresStack.currentLevel + " — " + stats.vertices[multiresStack.currentLevel] + " verts");
  }, [multiresStack]);

  const handleSetMultiresLevel = useCallback((level) => {
    if (!multiresStack) return;
    setMultiresLevel(multiresStack, level);
    setMultiresLevel2(level);
    setStatus("Multires level: " + level);
  }, [multiresStack]);

  const handleBakeDownMultires = useCallback(() => {
    if (!multiresStack) return;
    bakeDownLevel(multiresStack);
    setMultiresLevel2(multiresStack.currentLevel);
    setStatus("Baked down to level " + multiresStack.currentLevel);
  }, [multiresStack]);

  // ── Session 36: Alpha brush handlers ─────────────────────────────────────
  const handleLoadAlpha = useCallback(async (file) => {
    try {
      const alpha = await loadAlpha(file);
      setAlphaList(prev => [...prev, alpha]);
      setActiveAlpha(alpha);
      setStatus("Alpha loaded: " + alpha.name);
    } catch (e) { setStatus("Alpha load failed"); }
  }, []);

  const handleGenerateAlpha = useCallback((type) => {
    const alpha = generateProceduralAlpha(type, 64);
    setAlphaList(prev => [...prev, alpha]);
    setActiveAlpha(alpha);
    setStatus("Alpha generated: " + type);
  }, []);

  // ── Session 37: Grease Pencil handlers ───────────────────────────────────
  const handleGPStartStroke = useCallback((point) => {
    const stroke = createStroke([point], gpColor, gpThickness);
    setGpCurrentStroke(stroke);
    setGpDrawing(true);
  }, [gpColor, gpThickness]);

  const handleGPAddPoint = useCallback((point) => {
    if (!gpCurrentStroke || !gpDrawing) return;
    gpCurrentStroke.points.push(point);
  }, [gpCurrentStroke, gpDrawing]);

  const handleGPEndStroke = useCallback((frame) => {
    if (!gpCurrentStroke) return;
    const layers = [...gpLayers];
    addStrokeToFrame(layers[gpActiveLayer], frame || animFrame, gpCurrentStroke);
    setGpLayers(layers);

    // Build mesh and add to scene
    const meshes = buildFrameMeshes(layers[gpActiveLayer], frame || animFrame);
    if (!gpGroupRef.current) {
      gpGroupRef.current = new (require("three").Group)();
      gpGroupRef.current.name = "GreasePencil";
      sceneRef.current?.add(gpGroupRef.current);
    }
    meshes.forEach(m => gpGroupRef.current?.add(m));
    setGpCurrentStroke(null);
    setGpDrawing(false);
  }, [gpCurrentStroke, gpLayers, gpActiveLayer, animFrame]);

  const handleGPStrokeToMesh = useCallback(() => {
    const layer = gpLayers[gpActiveLayer];
    const strokes = layer.frames[animFrame] || [];
    strokes.forEach(stroke => {
      const mesh = strokeToMesh(stroke);
      if (mesh) {
        sceneRef.current?.add(mesh);
        setSceneObjects(prev => [...prev, {
          id: crypto.randomUUID(), name: "GP_Mesh", type: "box",
          visible: true, parentId: null, mesh,
        }]);
      }
    });
    setStatus("Strokes converted to mesh");
  }, [gpLayers, gpActiveLayer, animFrame]);

  // ── Session 38: Geometry Nodes handlers ──────────────────────────────────
  const handleGNAddNode = useCallback((type) => {
    const graph = { ...gnGraph };
    addNode(graph, type, { x: Math.random() * 400, y: Math.random() * 300 });
    setGnGraph(graph);
    setStatus("Node added: " + type);
  }, [gnGraph]);

  const handleGNEvaluate = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    const result = evaluateGraph(gnGraph, mesh);
    if (result && result !== mesh) {
      sceneRef.current?.add(result);
      setSceneObjects(prev => [...prev, {
        id: crypto.randomUUID(), name: "GN_Result", type: "box",
        visible: true, parentId: null, mesh: result,
      }]);
      setStatus("Geometry nodes evaluated");
    }
  }, [gnGraph]);

  // ── Session 39: Curve handlers ────────────────────────────────────────────
  const handleAddSpline = useCallback(() => {
    const spline = createSpline([
      { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 2, z: 0 }
    ]);
    setSplines(prev => [...prev, spline]);
    setActiveSpline(spline);
    setStatus("Spline added");
  }, []);

  const handlePipeAlongCurve = useCallback(() => {
    if (!activeSpline) { setStatus("Add a spline first"); return; }
    const mesh = pipeAlongCurve(activeSpline, { radius: 0.1 });
    if (!mesh) return;
    sceneRef.current?.add(mesh);
    setSceneObjects(prev => [...prev, {
      id: crypto.randomUUID(), name: "Pipe", type: "box",
      visible: true, parentId: null, mesh,
    }]);
    setStatus("Pipe created along curve");
  }, [activeSpline]);

  const handleMeshToCurve = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    const spline = meshToCurve(mesh);
    setSplines(prev => [...prev, spline]);
    setActiveSpline(spline);
    setStatus("Mesh converted to curve — " + spline.points.length + " points");
  }, []);

  // ── Session 40: Smart Materials handlers ─────────────────────────────────
  const handleApplyPreset = useCallback((key) => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    applyPreset(mesh, key);
    setMatPreset(key);
    setStatus("Material applied: " + (MATERIAL_PRESETS[key]?.label || key));
  }, []);

  const handleEdgeWear = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    applyEdgeWear(mesh);
    setStatus("Edge wear applied");
  }, []);

  const handleCavityDirt = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    applyCavityDirt(mesh);
    setStatus("Cavity dirt applied");
  }, []);

  // ── Sessions 41-43: Texture Painter handlers ──────────────────────────────
  const handleInitPaintStack = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    const stack = createLayerStack(1024, 1024);
    const texture = createPaintTexture(stack.layers[0].canvas);
    applyPaintTexture(mesh, texture);
    setPaintStack(stack);
    setPaintTexture(texture);
    setStatus("Paint canvas initialized — 1024x1024");
  }, []);

  const handlePaintAtUV = useCallback((uv) => {
    if (!paintStack || !uv) return;
    const activeLayer = paintStack.layers[paintStack.activeLayer];
    paintAtUV(activeLayer.canvas, uv.x, uv.y, {
      color: paintColor, radius: paintRadius, opacity: paintOpacity,
    });
    if (paintTexture) paintTexture.needsUpdate = true;
  }, [paintStack, paintTexture, paintColor, paintRadius, paintOpacity]);

  const handleAddPaintLayer = useCallback(() => {
    if (!paintStack) return;
    addLayer(paintStack, "Layer_" + paintStack.layers.length);
    setPaintStack({ ...paintStack });
    setStatus("Paint layer added");
  }, [paintStack]);

  const handleExportPaintMaps = useCallback(() => {
    if (!paintStack) { setStatus("Initialize paint canvas first"); return; }
    const flat = flattenLayers(paintStack);
    const url = exportTexture(flat);
    downloadBakedMap(url, "paint_albedo.png");
    setStatus("Paint maps exported");
  }, [paintStack]);

  // ── Sessions 48: Texture Baker handlers ──────────────────────────────────
  const handleBakeAllMaps = useCallback(async () => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    setBakingStatus("Baking AO, Normal, Curvature...");
    try {
      const maps = bakeAllMaps(mesh, { width: 512, height: 512, samples: 8 });
      setBakedMaps(maps);
      setBakingStatus("Bake complete — " + Object.keys(maps).filter(k => maps[k]).length + " maps");
      setStatus("Texture bake complete");
    } catch (e) {
      setBakingStatus("Bake failed: " + e.message);
      setStatus("Bake failed");
    }
  }, []);

  const handleDownloadBakedMap = useCallback((mapKey) => {
    const url = bakedMaps[mapKey]; if (!url) return;
    downloadBakedMap(url, mapKey + "_map.png");
  }, [bakedMaps]);

  // ── Session 21: Pose mode handlers ──────────────────────────────────────
  const handleEnterPoseMode = useCallback(() => {
    const arm = armatureRef.current; if (!arm) { setStatus("Create armature first"); return; }
    enterPoseMode(arm);
    setPoseMode(true);
    setStatus("Pose mode — rotate bones to pose");
  }, []);

  const handleExitPoseMode = useCallback(() => {
    const arm = armatureRef.current; if (!arm) return;
    exitPoseMode(arm);
    setPoseMode(false);
    setStatus("Object mode");
  }, []);

  const handleResetPose = useCallback(() => {
    const arm = armatureRef.current; if (!arm) return;
    resetToRestPose(arm);
    buildBoneDisplay(arm);
    setStatus("Pose reset to rest");
  }, []);

  const handleSavePose = useCallback((name) => {
    const arm = armatureRef.current; if (!arm) return;
    setPoseLibrary(prev => savePoseToLibrary(arm, name || "Pose_" + Date.now(), { ...prev }));
    setStatus("Pose saved");
  }, []);

  const handleLoadPose = useCallback((name) => {
    const arm = armatureRef.current; if (!arm) return;
    loadPoseFromLibrary(arm, name, poseLibrary);
    buildBoneDisplay(arm);
    setStatus("Pose loaded: " + name);
  }, [poseLibrary]);

  // ── Session 26: Weight painting handlers ─────────────────────────────────
  const handleEnterWeightPaint = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select a mesh first"); return; }
    initWeights(mesh, 4);
    setWeightPainting(true);
    setStatus("Weight paint mode — paint bone influences");
  }, []);

  const applyWeightPaint = useCallback(async (e) => {
    const mesh = meshRef.current; if (!mesh) return;
    const camera = cameraRef.current; if (!camera) return;
    const canvas = canvasRef.current; if (!canvas) return;
    
    if (!getSculptHit) return;
    const hit = getSculptHit(e, canvas, camera, mesh);
    if (!hit) return;
    paintWeight(mesh, hit, { boneIndex: wpBoneIndex, radius: wpRadius, strength: wpStrength, mode: wpMode });
    visualizeWeights(mesh, wpBoneIndex);
  }, [wpBoneIndex, wpRadius, wpStrength, wpMode]);

  // ── Session 28: Bind mesh to rig ─────────────────────────────────────────
  const handleBindToRig = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Select mesh first"); return; }
    const arm = armatureRef.current; if (!arm) { setStatus("Create armature first"); return; }
    const skinned = bindMeshToArmature(mesh, arm);
    if (!skinned) { setStatus("Binding failed"); return; }
    sceneRef.current?.remove(mesh);
    sceneRef.current?.add(skinned);
    meshRef.current = skinned;
    setSkinnedMesh(skinned);
    setStatus("Mesh bound to armature — auto-weights applied");
  }, []);

  // ── Sessions 29-30: Dyntopo handlers ─────────────────────────────────────
  const handleDyntopoFlood = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    dyntopoFloodFill(mesh, dyntopoDetail);
    setStatus("Dyntopo flood fill applied");
  }, [dyntopoDetail]);

  const handleSmoothTopology = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    smoothTopology(mesh, 3);
    setStatus("Topology smoothed");
  }, []);

  // ── Sessions 22-23: NLA handlers ─────────────────────────────────────────
  const handlePushDownAction = useCallback(() => {
    if (!animKeys || !Object.keys(animKeys).length) { setStatus("No keyframes to push down"); return; }
    const action = pushDownAction("Action_" + nlaActions.length, animKeys, animFrame);
    setNlaActions(prev => [...prev, action]);
    const strip = createStrip(action, { frameStart: 0, frameEnd: animFrame });
    setNlaTracks(prev => prev.map((t, i) => i === 0 ? { ...t, strips: [...t.strips, strip] } : t));
    setStatus("Action pushed down: " + action.name);
  }, [animKeys, animFrame, nlaActions]);

  // ── Sessions 22-23: NLA evaluate ─────────────────────────────────────────
  const handleNLASeek = useCallback((frame) => {
    if (!showNLA) return;
    const result = evaluateNLA(nlaTracks, nlaActions, frame);
    sceneObjects.forEach(obj => {
      if (!obj.mesh || !result[obj.id]) return;
      const ch = result[obj.id];
      if (ch["pos.x"] !== undefined) obj.mesh.position.x = ch["pos.x"];
      if (ch["pos.y"] !== undefined) obj.mesh.position.y = ch["pos.y"];
      if (ch["pos.z"] !== undefined) obj.mesh.position.z = ch["pos.z"];
    });
  }, [nlaTracks, nlaActions, showNLA, sceneObjects]);

  // ── Session 25: BVH import ────────────────────────────────────────────────
  const handleBVHImport = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bvh = parseBVH(e.target.result);
        const { skeleton, bones, rootBone } = buildSkeletonFromBVH(bvh);
        setBvhData({ bvh, skeleton, bones, rootBone });
        setStatus("BVH imported: " + bvh.joints.length + " joints, " + bvh.frames.length + " frames");
      } catch (err) { setStatus("BVH parse error: " + err.message); }
    };
    reader.readAsText(file);
  }, []);

  const handleApplyBVHFrame = useCallback((frame) => {
    if (!bvhData) return;
    applyBVHFrame(bvhData.bvh, bvhData.skeleton, frame);
    const arm = armatureRef.current;
    if (arm) buildBoneDisplay(arm);
  }, [bvhData]);

  // ── Sessions 17-18: Animation handlers ──────────────────────────────────

  function getLinearValue(channel, frame) {
    const frames = Object.keys(channel).map(Number).sort((a, b) => a - b);
    if (!frames.length) return null;
    if (frame <= frames[0]) return channel[frames[0]];
    if (frame >= frames[frames.length - 1]) return channel[frames[frames.length - 1]];
    for (let i = 0; i < frames.length - 1; i++) {
      const f0 = frames[i], f1 = frames[i + 1];
      if (frame >= f0 && frame <= f1) {
        const t = (frame - f0) / (f1 - f0);
        return channel[f0] + (channel[f1] - channel[f0]) * t;
      }
    }
    return null;
  }

  // ── Session 20: Armature handlers ────────────────────────────────────────
  const handleCreateArmature = useCallback(() => {
    const arm = createArmature("Armature_" + armatures.length);
    // Add a default root bone
    addBone(arm, { name: "Root", head: new THREE.Vector3(0, 0, 0), tail: new THREE.Vector3(0, 1, 0) });
    buildBoneDisplay(arm);
    sceneRef.current?.add(arm);
    armatureRef.current = arm;
    setArmatures(prev => [...prev, arm]);
    setActiveArmId(arm.uuid);
    setSceneObjects(prev => [...prev, {
      id: arm.uuid, name: arm.name, type: "armature",
      visible: true, parentId: null, mesh: arm,
    }]);
    setStatus("Armature created with root bone");
  }, [armatures]);

  const handleAddBone = useCallback(() => {
    const arm = armatureRef.current; if (!arm) { setStatus("Create armature first"); return; }
    const bone = addBone(arm, {
      name: "Bone_" + arm.userData.bones.length,
      head: new THREE.Vector3(0, arm.userData.bones.length * 0.5, 0),
      tail: new THREE.Vector3(0, arm.userData.bones.length * 0.5 + 0.5, 0),
      parentId: selectedBoneId,
    });
    buildBoneDisplay(arm);
    setSelectedBoneId(bone.userData.boneId);
    setStatus("Bone added: " + bone.name);
  }, [selectedBoneId]);

  const handleSelectBone = useCallback((boneId) => {
    const arm = armatureRef.current; if (!arm) return;
    selectBone(arm, boneId);
    setSelectedBoneId(boneId);
    setStatus("Bone selected: " + boneId);
  }, []);

  const handleParentBone = useCallback((childId, parentId) => {
    const arm = armatureRef.current; if (!arm) return;
    parentBone(arm, childId, parentId);
    setStatus("Bone parented");
  }, []);

  // ── Session 14: LOD handlers ────────────────────────────────────────────
  const handleGenerateLOD = useCallback(() => {
    const mesh = meshRef.current; if (!mesh || !mesh.geometry) { setStatus("No mesh selected"); return; }
    const lod = generateLOD(mesh);
    sceneRef.current?.remove(mesh);
    sceneRef.current?.add(lod);
    const stats = getLODStats(lod);
    setLodObject(lod);
    setLodStats(stats);
    setLodLevelState("auto");
    setStatus("LOD generated — " + stats.length + " levels");
  }, []);

  const handleSetLODLevel = useCallback((level) => {
    if (!lodObject) return;
    if (level === "auto") {
      restoreAutoLOD(lodObject);
    } else {
      setLODLevel(lodObject, Number(level));
    }
    setLodLevelState(level);
    setStatus("LOD level: " + level);
  }, [lodObject]);

  // ── Session 15: Instancing handlers ──────────────────────────────────────
  const handleCreateInstances = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    const instanced = createInstances(mesh, instanceCount, instanceLayout, {
      spread: instanceSpread,
    });
    sceneRef.current?.add(instanced);
    setSceneObjects(prev => {
      const obj = {
        id: crypto.randomUUID(),
        name: "Instances_x" + instanceCount,
        type: "instanced",
        visible: true,
        parentId: null,
        mesh: instanced,
      };
      return [...prev, obj];
    });
    setStatus("Created " + instanceCount + " instances (" + instanceLayout + ")");
  }, [instanceCount, instanceLayout, instanceSpread]);

  const handleFlattenInstances = useCallback(() => {
    const mesh = meshRef.current;
    if (!mesh || !mesh.isInstancedMesh) { setStatus("Select an instanced mesh first"); return; }
    const meshes = flattenInstances(mesh);
    sceneRef.current?.remove(mesh);
    meshes.forEach(m => sceneRef.current?.add(m));
    setSceneObjects(prev => {
      const filtered = prev.filter(o => o.mesh !== mesh);
      const newObjs = meshes.map(m => ({
        id: crypto.randomUUID(),
        name: m.name,
        type: "box",
        visible: true,
        parentId: null,
        mesh: m,
      }));
      return [...filtered, ...newObjs];
    });
    setStatus("Flattened " + meshes.length + " instances to individual meshes");
  }, []);

  // ── Session 16: GLTF extension helpers (wired into exportGLB) ────────────
  const [exportUnlit, setExportUnlit] = useState(false);
  const [exportDraco, setExportDraco] = useState(false);
  // ── Sessions 17-20: Animation + Armature state ───────────────────────────
  const [showTimeline, setShowTimeline] = useState(false);
  const [activeArmId, setActiveArmId] = useState(null);
  const [boneMode, setBoneMode] = useState(false);
  const armatureRef = useRef(null);
  // ── Sessions 21-30: Pose + Weight + Dyntopo + NLA + BVH + Skinning ────────
  const [poseMode, setPoseMode] = useState(false);
  const [showPoseLibPanel, setShowPoseLibPanel] = useState(false);
  const [poseName, setPoseName] = useState("");
  const [weightPainting, setWeightPainting] = useState(false);
  const wpPaintingRef = useRef(false);
  const [dyntopoMode, setDyntopoMode] = useState("both");
  const [skinnedMesh, setSkinnedMesh] = useState(null);
  const mixerRef = useRef(null);
  const bvhInputRef = useRef(null);
  // ── Sessions 31-50: Sculpt Brushes + Texturing state ─────────────────────
  const [multiresLevel, setMultiresLevel2] = useState(0);
  const [alphaList, setAlphaList] = useState([]);
  const [activeAlpha, setActiveAlpha] = useState(null);
  const alphaInputRef = useRef(null);
  const [gpOnionSkin, setGpOnionSkin] = useState(false);
  const gpGroupRef = useRef(null);
  const [gnSelectedNode, setGnSelectedNode] = useState(null);
  const [showGN, setShowGN] = useState(false);
  const [splines, setSplines] = useState([]);
  const [matPreset, setMatPreset] = useState("chrome");
  const [matCategories, setMatCategories] = useState(getPresetCategories());
  const [bakingStatus, setBakingStatus] = useState(null);
  // ── Sessions 51-62: Light + Camera + Post + IK + Graph state ─────────────
  const [lightTemp, setLightTemp] = useState("daylight");
  const [hdriPreset, setHdriPreset] = useState("studio");
  const [showLightPanel, setShowLightPanel] = useState(false);
  const camManagerRef = useRef(createCameraManager());
  const [activeCamId, setActiveCamId] = useState(null);
  const [camDOF, setCamDOF] = useState(false);
  const [camDOFFocus, setCamDOFFocus] = useState(5.0);
  const [showCamPanel, setShowCamPanel] = useState(false);
  const [postEffects, setPostEffects] = useState([
    { ...EFFECT_PRESETS.colorGrade, enabled: false },
    { ...EFFECT_PRESETS.vignette, enabled: false },
    { ...EFFECT_PRESETS.filmGrain, enabled: false },
    { ...EFFECT_PRESETS.toneMap, enabled: false },
  ]);
  const [activeLUT, setActiveLUT] = useState("neutral");
  const [showPostPanel, setShowPostPanel] = useState(false);
  const [retargetStats, setRetargetStats] = useState(null);
  const ikChainsRef = useRef([]);
  const [showIKPanel, setShowIKPanel] = useState(false);
  const [showGraphEditor, setShowGraphEditor] = useState(false);
  // ── Session E: Geo Nodes + Mesh Tools + LOD ───────────────────────────
  const [showGeoNodesPanel, setShowGeoNodesPanel] = useState(false);
  const [geoGraph, setGeoGraph] = useState(() => createGraph());
  const [geoNodeType, setGeoNodeType] = useState('transform');
  const [geoSelectedNode, setGeoSelectedNode] = useState(null);
  const [geoApplied, setGeoApplied] = useState(false);
  const [showMeshToolsPanel, setShowMeshToolsPanel] = useState(false);
  const [lodObj, setLodObj] = useState(null);
  const [uvAxis, setUvAxis] = useState('z');
  const [boolOp, setBoolOp] = useState('union');
  // ── Sessions 63-70: Drivers + Constraints + Physics + Walk Cycle ──────────
  const [showDriverPanel, setShowDriverPanel] = useState(false);
  const [showConPanel, setShowConPanel] = useState(false);
  const [physBaking, setPhysBaking] = useState(false);
  const [fragments, setFragments] = useState([]);
  const [showPhysPanel, setShowPhysPanel] = useState(false);
  const [walkCycleData, setWalkCycleData] = useState(null);
  const [walkPlaying, setWalkPlaying] = useState(false);
  const [showWalkPanel, setShowWalkPanel] = useState(false);
  // ── Sessions 71-77: DynaMesh + AutoRetopo + Fibermesh ────────────────────
  const [dynaMeshStats, setDynaMeshStats] = useState(null);
  const [showDynaPanel, setShowDynaPanel] = useState(false);
  const dynaMeshPrevMatrix = useRef(null);
  const [retopoStats, setRetopoStats] = useState(null);
  const [showRetopoPanel, setShowRetopoPanel] = useState(false);
  const [fiberStrands, setFiberStrands] = useState([]);
  const fiberStrandsRef = useRef([]);
  const [showFiberPanel, setShowFiberPanel] = useState(false);
  // ── Sessions 78-90: Hair + Cloth state ───────────────────────────────────
  const [hairStrands, setHairStrands] = useState([]);
  const hairStrandsRef = useRef([]);
  const [hairPhysSettings, setHairPhysSettings] = useState(createHairPhysicsSettings());
  const hairPhysRef = useRef(null);
  const [hairCards, setHairCards] = useState([]);
  const [showHairPanel, setShowHairPanel] = useState(false);
  const [clothSim, setClothSim] = useState(null);
  const clothSimRef = useRef(null);
  const [clothRunning, setClothRunning] = useState(false);
  const clothRafRef = useRef(null);
  const [clothPinMode, setClothPinMode] = useState(false);
  const [showClothPanel, setShowClothPanel] = useState(false);
  // ── Sessions 91-107: Rendering state ─────────────────────────────────────
  const [pbrMaterial, setPbrMaterial] = useState(null);
  const [renderQueue, setRenderQueue] = useState(createRenderQueue());
  const [renderStats, setRenderStats] = useState(null);
  const [showRenderPanel, setShowRenderPanel] = useState(false);
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [videoRendering, setVideoRendering] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showVolPanel, setShowVolPanel] = useState(false);
  const [activePass, setActivePass] = useState("beauty");
  const [showPassPanel, setShowPassPanel] = useState(false);
  const probeManagerRef = useRef(createProbeManager());
  const [probes, setProbes] = useState([]);
  const [showProbePanel, setShowProbePanel] = useState(false);
  const [showUDIMPanel, setShowUDIMPanel] = useState(false);
  const [udimLayout, setUdimLayout] = useState(null);
  const [udimTileCount, setUdimTileCount] = useState(4);
  const [udimActiveTile, setUdimActiveTile] = useState(1001);
  const [udimPaintColor, setUdimPaintColor] = useState('#00ffc8');
  const [giResolution, setGiResolution] = useState(256);
  const [giProbes, setGiProbes] = useState([]);
  const [giBaked, setGiBaked] = useState(false);
  // ── Session D: GI + UDIM handlers ──────────────────────────────────────
  const handleBakeGI = useCallback(() => {
    const renderer = rendererRef.current;
    const scene    = sceneRef.current;
    const camera   = cameraRef.current;
    if (!renderer || !scene || !camera) { setStatus('No renderer'); return; }
    setStatus('Baking GI...');
    const envMap = bakeEnvironment(renderer, scene, camera, { resolution: giResolution });
    if (envMap) {
      applyIBLToScene(scene, envMap, { intensity: 1.0, background: false });
      const probe = createIrradianceProbe(new THREE.Vector3(0,0,0), { resolution: giResolution });
      setGiProbes(p => [...p, probe]);
      setGiBaked(true);
      setStatus('GI baked');
    } else { setStatus('GI bake failed'); }
  }, [giResolution]);

  const handleCreateReflectionProbe = useCallback(() => {
    const renderer = rendererRef.current;
    const scene    = sceneRef.current;
    const camera   = cameraRef.current;
    if (!renderer || !scene || !camera) return;
    const probe = createReflectionProbe(new THREE.Vector3(0,1,0), { resolution: giResolution });
    updateReflectionProbe(probe, renderer, scene);
    applyProbeToScene(scene, probe);
    setGiProbes(p => [...p, probe]);
    setStatus('Reflection probe created');
  }, [giResolution]);

  const handleInitUDIM = useCallback(() => {
    const layout = createUDIMLayout(udimTileCount);
    initUDIMLayout(layout, 1024, 1024);
    setUdimLayout(layout);
    setStatus('UDIM initialized: ' + udimTileCount + ' tiles');
  }, [udimTileCount]);

  const handleFillUDIMTile = useCallback(() => {
    if (!udimLayout) { setStatus('Init UDIM first'); return; }
    fillUDIMTile(udimLayout, udimActiveTile, udimPaintColor);
    setUdimLayout({ ...udimLayout });
    setStatus('Filled tile ' + udimActiveTile);
  }, [udimLayout, udimActiveTile, udimPaintColor]);

  const handleExportUDIMAtlas = useCallback(() => {
    if (!udimLayout) { setStatus('Init UDIM first'); return; }
    const atlas = buildUDIMAtlas(udimLayout, 4096, 4096);
    const url   = atlas.canvas.toDataURL('image/png');
    const a     = document.createElement('a');
    a.href = url; a.download = 'udim_atlas.png'; a.click();
    setStatus('UDIM atlas exported');
  }, [udimLayout]);

  const handleApplyUDIMToMesh = useCallback(() => {
    const mesh = meshRef.current;
    if (!mesh || !udimLayout) { setStatus('Need mesh + UDIM layout'); return; }
    applyUDIMToMaterial(mesh.material, udimLayout);
    setStatus('UDIM applied to mesh');
  }, [udimLayout]);
  // ── Session D END ─────────────────────────────────────────────────────
  // ── Session E: Geo Nodes handlers ──────────────────────────────────────
  const handleGeoAddNode = () => {
    const pos = { x: 20 + geoGraph.nodes.length * 140, y: 40 };
    const node = addNode(geoGraph, geoNodeType, pos);
    setGeoGraph({ ...geoGraph });
    setGeoSelectedNode(node.id);
    setStatus('Added ' + geoNodeType + ' node');
  };
  const handleGeoAddInput = () => {
    const node = addNode(geoGraph, 'input', { x: 20, y: 40 });
    setGeoGraph({ ...geoGraph }); setGeoSelectedNode(node.id);
  };
  const handleGeoAddOutput = () => {
    const node = addNode(geoGraph, 'output', { x: 20 + geoGraph.nodes.length * 140, y: 40 });
    setGeoGraph({ ...geoGraph }); setGeoSelectedNode(node.id);
  };
  const handleGeoConnect = () => {
    const nodes = geoGraph.nodes;
    if (nodes.length >= 2) {
      const from = nodes[nodes.length - 2];
      const to   = nodes[nodes.length - 1];
      connectNodes(geoGraph, from.id, 'geometry', to.id, 'geometry');
      setGeoGraph({ ...geoGraph });
      setStatus('Connected ' + from.type + ' -> ' + to.type);
    }
  };
  const handleGeoEvaluate = () => {
    const mesh = meshRef.current;
    if (!mesh) { setStatus('No mesh'); return; }
    const result = evaluateGraph(geoGraph, mesh);
    if (result && result !== mesh && sceneRef.current) {
      result.position.copy(mesh.position);
      sceneRef.current.add(result);
      setGeoApplied(true);
      setStatus('Geo nodes evaluated — result added to scene');
    }
  };
  const handleGeoClear = () => {
    setGeoGraph(createGraph()); setGeoSelectedNode(null); setGeoApplied(false);
    setStatus('Geo nodes graph cleared');
  };
  const handleGeoUpdateParam = (nodeId, key, val) => {
    const node = geoGraph.nodes.find(n => n.id === nodeId);
    if (node) { node.params[key] = isNaN(Number(val)) ? val : Number(val); setGeoGraph({ ...geoGraph }); }
  };

  // ── Sessions 108-121: VFX + Fluid + Asset + Procedural state ─────────────
  const [vfxEmitters, setVfxEmitters] = useState([]);
  const vfxEmittersRef = useRef([]);
  const [vfxSystems, setVfxSystems] = useState([]);
  const vfxSystemsRef = useRef([]);
  const vfxRafRef = useRef(null);
  const [destFrags, setDestFrags] = useState([]);
  const destFragsRef = useRef([]);
  const [showVFXPanel, setShowVFXPanel] = useState(false);
  const [fluidSim, setFluidSim] = useState(null);
  const fluidSimRef = useRef(null);
  const [fluidMesh, setFluidMesh] = useState(null);
  const fluidMeshRef = useRef(null);
  const [fluidRunning, setFluidRunning] = useState(false);
  const fluidRafRef = useRef(null);
  const [pyroSim, setPyroSim] = useState(null);
  const pyroSimRef = useRef(null);
  const [showFluidPanel, setShowFluidPanel] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState(null);
  const [showAssetPanel, setShowAssetPanel] = useState(false);
  const procAnimRef = useRef(null);
  const [sceneStats, setSceneStats] = useState(null);
  const [showPerfPanel, setShowPerfPanel] = useState(false);
  // ── Sessions 122-130: Collaboration + Electron state ─────────────────────
  const [collabSession, setCollabSession] = useState(null);
  const collabRef = useRef(null);
  const [collabUsers, setCollabUsers] = useState([]);
  const [commentPins, setCommentPins] = useState([]);
  const [showCollabPanel, setShowCollabPanel] = useState(false);
  const [platformInfo, setPlatformInfo] = useState(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showDesktopPanel, setShowDesktopPanel] = useState(false);
  const shortcutCleanupRef = useRef(null);
  // ── Sessions 131-142: GLSL Shaders + Post Passes + Marching Cubes ────────
  const [dissolveAmount, setDissolveAmount2] = useState(0.0);
  const [outlineMesh, setOutlineMesh] = useState(null);
  const [holoMesh, setHoloMesh] = useState(null);
  const postPassManagerRef = useRef(null);
  const [chromaticEnabled, setChromaticEnabled] = useState(false);
  const [bloomStrength, setBloomStrength] = useState(0.5);
  const [bloomThreshold, setBloomThreshold] = useState(0.8);
  const [showShaderPanel, setShowShaderPanel] = useState(false);
  const [showPostPassPanel, setShowPostPassPanel] = useState(false);
  const [mcStats, setMcStats] = useState(null);
  const [showMCPanel, setShowMCPanel] = useState(false);
  // ── Sessions 143-156: GPU Particles + Cloth/Hair/Anim upgrades ───────────
  const [gpuParticleSys, setGpuParticleSys] = useState(null);
  const gpuParticleSysRef = useRef(null);
  const [gpuParticleStats, setGpuParticleStats] = useState(null);
  const gpuRafRef = useRef(null);
  const [forceFields, setForceFields] = useState([]);
  const [showGPUPanel, setShowGPUPanel] = useState(false);
  const clothSpatialHash = useRef(createSpatialHash(0.1));
  const [useUpgradedCloth, setUseUpgradedCloth] = useState(false);
  const [hairStyle, setHairStyle] = useState("natural");
  const [showHairStylePanel, setShowHairStylePanel] = useState(false);
  const [ikfkBlend, setIkfkBlend] = useState(null);
  const ikfkRef = useRef(null);
  const [ikfkValue, setIkfkValue] = useState(0.0);
  const [splineIKChain, setSplineIKChain] = useState(null);
  const [showAnimUpPanel, setShowAnimUpPanel] = useState(false);
  // ── Sessions 157-169: Rendering + Performance + Polish ───────────────────
  const [webgpuInfo, setWebgpuInfo] = useState(null);
  const [webglInfo, setWebglInfo] = useState(null);
  const [iblEnabled, setIblEnabled] = useState(false);
  const [shadowsEnabled, setShadowsEnabled] = useState(false);
  const [nprOutline, setNprOutline] = useState(null);
  const [renderFarm, setRenderFarm] = useState(createRenderFarm());
  const renderFarmRef = useRef(createRenderFarm());
  const [showRenderFarmPanel, setShowRenderFarmPanel] = useState(false);
  const clothWorkerRef = useRef(null);
  const sphWorkerRef = useRef(null);
  const workerPoolRef = useRef(null);
  const [workerSupport, setWorkerSupport] = useState(null);
  const [showWorkerPanel, setShowWorkerPanel] = useState(false);
  const [activeTheme, setActiveTheme] = useState("dark");
  const [customTheme, setCustomTheme] = useState(THEMES.dark);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [showShortcutOverlay, setShowShortcutOverlay] = useState(false);
  const [tourVisible, setTourVisible] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  // ── Sessions 11-12: Procedural mesh handlers ────────────────────────────
  const addProceduralMesh = useCallback(() => {
    const p = procParams;
    let geo;
    switch (procType) {
      case "pipe": geo = createPipe(p); break;
      case "staircase": geo = createStaircase(p); break;
      case "arch": geo = createArch(p); break;
      case "gear": geo = createGear(p); break;
      case "helix": geo = createHelix(p); break;
      case "lathe": geo = createLathe(p); break;
      default: geo = createPipe(p);
    }
    const mesh = buildProceduralMesh(geo);
    sceneRef.current?.add(mesh);
    const { createSceneObject: cso } = require ? { createSceneObject: null } : {};
    setSceneObjects(prev => {
      const obj = { id: crypto.randomUUID(), name: procType + "_" + Date.now(), type: procType, visible: true, parentId: null, mesh };
      meshRef.current = mesh;
      heMeshRef.current = null;
      setActiveObjId(obj.id);
      return [...prev, obj];
    });
    setStatus("Added procedural: " + procType);
  }, [procType, procParams]);

  // ── Session 13: Mesh repair handlers ─────────────────────────────────────
  const handleFixNormals = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    fixNormals(mesh);
    setStatus("Normals fixed");
  }, []);

  const handleRemoveDoubles = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    const removed = removeDoubles(mesh, 0.001);
    setRepairStatus(removed + " vertices merged");
    setStatus(removed + " doubles removed");
  }, []);

  const handleRemoveDegenerates = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    const removed = removeDegenerates(mesh);
    setRepairStatus(removed + " degenerate faces removed");
    setStatus(removed + " degenerate faces removed");
  }, []);

  const handleFillHoles = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    const filled = fillHoles(mesh);
    setRepairStatus(filled + " holes filled");
    setStatus(filled + " holes filled");
  }, []);

  const handleFullRepair = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("No mesh selected"); return; }
    const result = fullRepair(mesh);
    const msg = "Repair: " + result.doubles + " merged, " + result.degenerates + " degens, " + result.holes + " holes";
    setRepairStatus(msg);
    setStatus(msg);
  }, []);

  // ── Sessions 9-10: Shape Key handlers ───────────────────────────────────
  const addBasisKey = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) { setStatus("Add a primitive first"); return; }
    if (shapeKeysRef.current.length > 0) { setStatus("Basis already exists"); return; }
    const basis = createShapeKey("Basis", mesh);
    basis.value = 1.0;
    const next = [basis];
    shapeKeysRef.current = next;
    setShapeKeys([...next]);
    setStatus("Basis key created");
  }, []);

  const addShapeKey = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    if (shapeKeysRef.current.length === 0) { setStatus("Create Basis first"); return; }
    const key = createShapeKey("Key_" + shapeKeysRef.current.length, mesh);
    const next = [...shapeKeysRef.current, key];
    shapeKeysRef.current = next;
    setShapeKeys([...next]);
    setStatus("Shape key added: " + key.name);
  }, []);

  const removeShapeKey = useCallback((id) => {
    if (shapeKeysRef.current[0]?.id === id) { setStatus("Cannot delete Basis"); return; }
    const next = shapeKeysRef.current.filter(k => k.id !== id);
    shapeKeysRef.current = next;
    setShapeKeys([...next]);
    const mesh = meshRef.current; if (mesh) applyShapeKeys(mesh, next);
    setStatus("Shape key deleted");
  }, []);

  const setShapeKeyValue = useCallback((id, value) => {
    const keys = shapeKeysRef.current;
    const key = keys.find(k => k.id === id); if (!key) return;
    key.value = value;
    shapeKeysRef.current = [...keys];
    setShapeKeys([...keys]);
    const mesh = meshRef.current; if (mesh) applyShapeKeys(mesh, keys);
  }, []);

  const resetAllShapeKeys = useCallback(() => {
    const keys = shapeKeysRef.current;
    keys.forEach((k, i) => { if (i > 0) k.value = 0; });
    shapeKeysRef.current = [...keys];
    setShapeKeys([...keys]);
    const mesh = meshRef.current; if (mesh) applyShapeKeys(mesh, keys);
    setStatus("All shape keys reset");
  }, []);

  return (
    <div style={{
      display: "flex", height: "100vh", background: COLORS.bg, color: "#dde6ef",
      fontFamily: "JetBrains Mono,monospace", fontSize: 12, overflow: "hidden"
    }}>

      {/* Left toolbar */}
      <div style={{
        width: 52, background: COLORS.panel, borderRight: `1px solid ${COLORS.border}`,
        display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0", gap: 4, flexShrink: 0
      }}>
        <div style={{ color: COLORS.teal, fontSize: 9, fontWeight: 700, marginBottom: 6, textAlign: "center", lineHeight: 1.3 }}>
          SPX<br />MESH
        </div>
        {TOOLS.map(t => (
          <button key={t.id} title={t.label} onClick={() => setActiveTool(t.id)}
            style={{
              width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
              background: activeTool === t.id ? COLORS.teal : COLORS.border,
              color: activeTool === t.id ? COLORS.bg : "#888",
              outline: activeTool === t.id ? `2px solid ${COLORS.teal}` : "none"
            }}>
            {t.icon}
          </button>
        ))}
        <div style={{ width: "80%", height: 1, background: COLORS.border, margin: "4px 0" }} />
        <button title="Import GLB/OBJ" onClick={() => fileInputRef.current?.click()}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 16,
            background: COLORS.border, color: COLORS.orange
          }}>📦</button>
        <button title="Export GLB" onClick={exportGLB}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 16,
            background: COLORS.border, color: COLORS.orange
          }}>💾</button>
        <button title="Bone Mode" onClick={() => setBoneMode(b => !b)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: boneMode ? "#8844ff" : COLORS.border,
            color: boneMode ? "#fff" : "#888"
          }}>🦴</button>
        <button title="Timeline" onClick={() => setShowTimeline(t => !t)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showTimeline ? "#00ffc8" : COLORS.border,
            color: showTimeline ? "#06060f" : "#888"
          }}>⏱</button>
        <button title="GLSL Shaders" onClick={() => setShowShaderPanel(s => !s)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showShaderPanel ? "#00ffc8" : COLORS.border,
            color: showShaderPanel ? "#06060f" : "#888", fontWeight: 700
          }}>GL</button>
        <button title="Post Passes" onClick={() => setShowPostPassPanel(p => !p)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showPostPassPanel ? "#FF6600" : COLORS.border,
            color: showPostPassPanel ? "#fff" : "#888", fontWeight: 700
          }}>PP</button>
        <button title="Marching Cubes" onClick={() => setShowMCPanel(m => !m)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showMCPanel ? "#8844ff" : COLORS.border,
            color: showMCPanel ? "#fff" : "#888", fontWeight: 700
          }}>MC</button>
        <button title="Render Farm" onClick={() => setShowRenderFarmPanel(r => !r)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showRenderFarmPanel ? "#FF6600" : COLORS.border,
            color: showRenderFarmPanel ? "#fff" : "#888", fontWeight: 700
          }}>RF</button>
        <button title="Worker Threads" onClick={() => setShowWorkerPanel(w => !w)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showWorkerPanel ? "#4488ff" : COLORS.border,
            color: showWorkerPanel ? "#fff" : "#888", fontWeight: 700
          }}>WT</button>
        <button title="Theme" onClick={() => setShowThemePanel(t => !t)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showThemePanel ? "#8844ff" : COLORS.border,
            color: showThemePanel ? "#fff" : "#888"
          }}>🎨</button>
        <button title="Export to StreamPireX" onClick={() => setShowExportPanel(e => !e)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showExportPanel ? "#00ffc8" : COLORS.border,
            color: showExportPanel ? "#06060f" : "#888"
          }}>🚀</button>
        <button title="GPU Particles" onClick={() => setShowGPUPanel(g => !g)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showGPUPanel ? "#4488ff" : COLORS.border,
            color: showGPUPanel ? "#fff" : "#888", fontWeight: 700
          }}>GPU</button>
        <button title="Hair Styles" onClick={() => setShowHairStylePanel(h => !h)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showHairStylePanel ? "#886644" : COLORS.border,
            color: showHairStylePanel ? "#fff" : "#888"
          }}>🪢</button>
        <button title="Animation Upgrades" onClick={() => setShowAnimUpPanel(a => !a)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showAnimUpPanel ? "#8844ff" : COLORS.border,
            color: showAnimUpPanel ? "#fff" : "#888", fontWeight: 700
          }}>AN</button>
        <button title="Collaboration" onClick={() => setShowCollabPanel(c => !c)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showCollabPanel ? "#00ffc8" : COLORS.border,
            color: showCollabPanel ? "#06060f" : "#888"
          }}>🔗</button>
        <button title="Desktop" onClick={() => setShowDesktopPanel(d => !d)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showDesktopPanel ? "#8844ff" : COLORS.border,
            color: showDesktopPanel ? "#fff" : "#888"
          }}>🖥</button>
        <button title="VFX Particles" onClick={() => setShowVFXPanel(v => !v)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showVFXPanel ? "#FF6600" : COLORS.border,
            color: showVFXPanel ? "#fff" : "#888"
          }}>✦</button>
        <button title="Fluid + Pyro" onClick={() => setShowFluidPanel(f => !f)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showFluidPanel ? "#4488ff" : COLORS.border,
            color: showFluidPanel ? "#fff" : "#888"
          }}>💧</button>
        <button title="Asset Library" onClick={() => setShowAssetPanel(a => !a)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showAssetPanel ? "#ffaa00" : COLORS.border,
            color: showAssetPanel ? "#06060f" : "#888"
          }}>📦</button>
        <button title="Performance" onClick={() => setShowPerfPanel(p => !p)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showPerfPanel ? "#44ff88" : COLORS.border,
            color: showPerfPanel ? "#06060f" : "#888"
          }}>⚡</button>
        <button title="Render" onClick={() => setShowRenderPanel(r => !r)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showRenderPanel ? "#FF6600" : COLORS.border,
            color: showRenderPanel ? "#fff" : "#888"
          }}>🎬</button>
        <button title="Render Video" onClick={() => setShowVideoPanel(v => !v)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showVideoPanel ? "#FF6600" : COLORS.border,
            color: showVideoPanel ? "#fff" : "#888", fontWeight: 700
          }}>VID</button>
        <button title="Volumetric" onClick={() => setShowVolPanel(v => !v)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showVolPanel ? "#4488ff" : COLORS.border,
            color: showVolPanel ? "#fff" : "#888"
          }}>🌫</button>
        <button title="Render Passes" onClick={() => setShowPassPanel(p => !p)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showPassPanel ? "#8844ff" : COLORS.border,
            color: showPassPanel ? "#fff" : "#888", fontWeight: 700
          }}>RP</button>
        <button title="Environment Probes" onClick={() => setShowProbePanel(p => !p)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showProbePanel ? "#00ffc8" : COLORS.border,
            color: showProbePanel ? "#06060f" : "#888"
          }}>🔮</button>
        <button title="Hair" onClick={() => setShowHairPanel(h => !h)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showHairPanel ? "#886644" : COLORS.border,
            color: showHairPanel ? "#fff" : "#888"
          }}>💇</button>
        <button title="Cloth" onClick={() => setShowClothPanel(c => !c)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showClothPanel ? "#4488ff" : COLORS.border,
            color: showClothPanel ? "#fff" : "#888"
          }}>🧵</button>
        <button title="DynaMesh" onClick={() => setShowDynaPanel(d => !d)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showDynaPanel ? "#00ffc8" : COLORS.border,
            color: showDynaPanel ? "#06060f" : "#888", fontWeight: 700
          }}>DM</button>
        <button title="Auto-Retopo" onClick={() => setShowRetopoPanel(r => !r)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showRetopoPanel ? "#FF6600" : COLORS.border,
            color: showRetopoPanel ? "#fff" : "#888", fontWeight: 700
          }}>RT</button>
        <button title="Fibermesh" onClick={() => setShowFiberPanel(f => !f)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showFiberPanel ? "#8844ff" : COLORS.border,
            color: showFiberPanel ? "#fff" : "#888"
          }}>🪡</button>
        <button title="Drivers" onClick={() => setShowDriverPanel(d => !d)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showDriverPanel ? "#8844ff" : COLORS.border,
            color: showDriverPanel ? "#fff" : "#888", fontWeight: 700
          }}>DR</button>
        <button title="Constraints" onClick={() => setShowConPanel(c => !c)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showConPanel ? "#4488ff" : COLORS.border,
            color: showConPanel ? "#fff" : "#888", fontWeight: 700
          }}>CN</button>
        <button title="Physics" onClick={() => setShowPhysPanel(p => !p)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showPhysPanel ? "#FF6600" : COLORS.border,
            color: showPhysPanel ? "#fff" : "#888", fontWeight: 700
          }}>PH</button>
        <button title="Walk Cycle" onClick={() => setShowWalkPanel(w => !w)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showWalkPanel ? "#00ffc8" : COLORS.border,
            color: showWalkPanel ? "#06060f" : "#888"
          }}>🚶</button>
        <button title="Lights" onClick={() => setShowLightPanel(l => !l)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showLightPanel ? "#ffd700" : COLORS.border,
            color: showLightPanel ? "#06060f" : "#888"
          }}>💡</button>
        <button title="Camera" onClick={() => setShowCamPanel(c => !c)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showCamPanel ? "#00ffc8" : COLORS.border,
            color: showCamPanel ? "#06060f" : "#888"
          }}>📷</button>
        <button title="Post FX" onClick={() => setShowPostPanel(p => !p)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 14,
            background: showPostPanel ? "#FF6600" : COLORS.border,
            color: showPostPanel ? "#fff" : "#888"
          }}>✨</button>
        <button title="IK" onClick={() => setShowIKPanel(i => !i)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showIKPanel ? "#8844ff" : COLORS.border,
            color: showIKPanel ? "#fff" : "#888", fontWeight: 700
          }}>IK</button>
        <button title="Graph Editor" onClick={() => setShowGraphEditor(g => !g)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: showGraphEditor ? "#4488ff" : COLORS.border,
            color: showGraphEditor ? "#fff" : "#888", fontWeight: 700
          }}>GR</button>
        <button title="Geometry Nodes" onClick={() => setShowGeoNodesPanel(g => !g)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 9,
            background: showGeoNodesPanel ? "#00ffc8" : COLORS.border,
            color: showGeoNodesPanel ? "#06060f" : "#888", fontWeight: 700
          }}>GEO</button>
        <button title="Mesh Tools" onClick={() => setShowMeshToolsPanel(m => !m)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 9,
            background: showMeshToolsPanel ? "#FF6600" : COLORS.border,
            color: showMeshToolsPanel ? "#fff" : "#888", fontWeight: 700
          }}>MSH</button>
        <button title="Pose Library" onClick={() => setShowPoseLibPanel(p => !p)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 10,
            background: showPoseLibPanel ? "#8844ff" : COLORS.border,
            color: showPoseLibPanel ? "#fff" : "#888", fontWeight: 700
          }}>POS</button>
        <button title="Weight Paint" onClick={() => { handleEnterWeightPaint(); setWeightPainting(w => !w); }}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: weightPainting ? "#FF6600" : COLORS.border,
            color: weightPainting ? "#fff" : "#888", fontWeight: 700
          }}>WP</button>
        <button title="Dyntopo" onClick={() => setDyntopoEnabled(d => !d)}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11,
            background: dyntopoEnabled ? "#8844ff" : COLORS.border,
            color: dyntopoEnabled ? "#fff" : "#888", fontWeight: 700
          }}>DT</button>
        <button title="Wireframe (Z)" onClick={toggleWireframe}
          style={{
            width: 38, height: 38, border: "none", borderRadius: 4, cursor: "pointer", fontSize: 10,
            background: wireframe ? COLORS.orange : COLORS.border,
            color: wireframe ? "#fff" : "#888", fontWeight: 700
          }}>WF</button>
        <input ref={fileInputRef} type="file" accept=".glb,.gltf,.obj" style={{ display: "none" }}
          onChange={e => e.target.files?.[0] && importGLB(e.target.files[0])} />
      </div>

      {/* Outliner — Session 2-3 */}
      <Outliner
        objects={sceneObjects}
        activeId={activeObjId}
        onSelect={selectSceneObject}
        onRename={renameSceneObject}
        onDelete={deleteSceneObject}
        onToggleVisible={toggleSceneObjectVisible}
        onSetParent={setParent}
        onGroup={groupSelected}
        onUngroup={ungroupSelected}
        onSaveScene={handleSaveScene}
        onLoadScene={handleLoadScene}
        onExportScene={handleExportScene}
      />



      {/* Viewport */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <canvas ref={canvasRef} width={1200} height={800}
          style={{
            width: "100%", height: "100%", display: "block",
            cursor: activeTool === "knife" ? "crosshair" : slideRef.current?.active ? "ew-resize" : "grab"
          }}
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel} />


        {/* Gizmo mode bar */}
        {gizmoActive && (
          <div style={{
            position: "absolute", top: 10, right: 10, display: "flex", gap: 4,
            background: "rgba(13,17,23,0.85)", borderRadius: 6, padding: "4px"
          }}>
            {[["move", "✋", "Move (W)"], ["rotate", "↺", "Rotate (E)"], ["scale", "⤢", "Scale (R)"]].map(([mode, icon, label]) => (
              <button key={mode} title={label} onClick={() => setGizmoModeAndUpdate(mode)}
                style={{
                  width: 34, height: 34, border: "none", borderRadius: 3, cursor: "pointer", fontSize: 14,
                  background: gizmoMode === mode ? "#00ffc8" : "transparent",
                  color: gizmoMode === mode ? "#06060f" : "#666"
                }}>
                {icon}
              </button>
            ))}
          </div>
        )}


        {/* Material Editor modal */}
        {showMatEditor && (
          <MaterialEditor
            material={matProps}
            onChange={(props) => applyMaterial(props)}
            onClose={() => setShowMatEditor(false)}
          />
        )}
        {/* UV Editor modal */}
        {showUVEditor && (
          <UVEditor
            uvTriangles={uvTriangles}
            width={400} height={400}
            onClose={() => setShowUVEditor(false)}
          />
        )}
        {/* Knife overlay SVG */}
        {activeTool === "knife" && editMode === "edit" && knifePoints.length > 0 && (
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            {knifePoints.slice(1).map((_, i) => (
              <line key={i}
                x1={knifePoints[i].x} y1={knifePoints[i].y}
                x2={knifePoints[i + 1].x} y2={knifePoints[i + 1].y}
                stroke={COLORS.teal} strokeWidth={2} strokeDasharray="6,3" />
            ))}
            {knifePoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={5} fill={COLORS.orange} stroke="#fff" strokeWidth={1} />
            ))}
          </svg>
        )}

        {/* Mode bar */}
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 4, background: "rgba(13,17,23,0.85)", borderRadius: 6, padding: "4px"
        }}>
          <button onClick={() => setShowNLA(n => !n)}
            style={{
              padding: "4px 10px", border: "none", borderRadius: 3, cursor: "pointer",
              fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              background: showNLA ? "#00ffc8" : "transparent",
              color: showNLA ? "#06060f" : "#666"
            }}>
            NLA
          </button>
          <button onClick={() => setShowTimeline(t => !t)}
            style={{
              padding: "4px 10px", border: "none", borderRadius: 3, cursor: "pointer",
              fontSize: 11, fontWeight: 700, textTransform: "uppercase",
              background: showTimeline ? "#8844ff" : "transparent",
              color: showTimeline ? "#fff" : "#666"
            }}>
            ANIM
          </button>
          {["object", "edit", "sculpt", "paint"].map(m => (
            <button key={m} onClick={() => m === "edit" ? toggleEditMode() : setEditMode("object")}
              style={{
                padding: "4px 16px", border: "none", borderRadius: 3, cursor: "pointer",
                fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                background: editMode === m ? COLORS.teal : "transparent",
                color: editMode === m ? COLORS.bg : "#666"
              }}>
              {m}
            </button>
          ))}
        </div>

        {/* Select mode bar */}
        {editMode === "edit" && (
          <div style={{
            position: "absolute", top: 46, left: "50%", transform: "translateX(-50%)",
            display: "flex", gap: 4, background: "rgba(13,17,23,0.85)", borderRadius: 6, padding: "4px"
          }}>
            {[["1", "vert", "V"], ["2", "edge", "E"], ["3", "face", "F"]].map(([key, mode, lbl]) => (
              <button key={mode} onClick={() => setSelectMode(mode)}
                title={`${lbl} select (${key})`}
                style={{
                  padding: "3px 14px", border: "none", borderRadius: 3, cursor: "pointer",
                  fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                  background: selectMode === mode ? COLORS.orange : "transparent",
                  color: selectMode === mode ? "#fff" : "#666"
                }}>
                {mode}
              </button>
            ))}
          </div>
        )}

        {/* Loop cut preview indicator */}
        {activeTool === "loop_cut" && editMode === "edit" && (
          <div style={{
            position: "absolute", top: 80, left: "50%", transform: "translateX(-50%)",
            background: "rgba(0,255,200,0.1)", border: `1px solid ${COLORS.teal}`,
            borderRadius: 4, padding: "4px 12px", fontSize: 10, color: COLORS.teal
          }}>
            Loop cut preview — t={loopCutT.toFixed(2)} — Ctrl+R to apply
          </div>
        )}

        {/* Slide indicator */}
        {slideRef.current?.active && (
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            background: "rgba(255,102,0,0.15)", border: `1px solid ${COLORS.orange}`,
            borderRadius: 4, padding: "6px 16px", fontSize: 11, color: COLORS.orange, fontWeight: 700
          }}>
            Edge Slide: {slideAmount.toFixed(3)} — release to confirm
          </div>
        )}

        {/* Status bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 26,
          background: "rgba(13,17,23,0.92)", borderTop: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", padding: "0 12px", gap: 16, flexShrink: 0
        }}>
          <span style={{ color: COLORS.teal, fontSize: 10 }}>{status}</span>
          <span style={{ color: "#444", fontSize: 10 }}>V:{stats.vertices}</span>
          <span style={{ color: "#444", fontSize: 10 }}>E:{stats.edges}</span>
          <span style={{ color: "#444", fontSize: 10 }}>F:{stats.faces}</span>

          {/* Proportional edit + snap indicators */}
          <span style={{ color: propEdit ? C.teal : "#333", fontSize: 10, cursor: "pointer" }}
            onClick={() => setPropEdit(p => !p)} title="Toggle Proportional Editing (O)">
            ◉ Prop {propEdit ? `ON r=${propRadius.toFixed(1)}` : "OFF"}
          </span>
          <span style={{ color: snapEnabled ? "#FF6600" : "#333", fontSize: 10, cursor: "pointer" }}
            onClick={() => setSnapEnabled(s => !s)} title="Toggle Snap">
            ⊞ Snap {snapEnabled ? `${snapSize}` : "OFF"}
          </span>
          <span style={{ color: "#222", fontSize: 9, marginLeft: "auto" }}>
            Tab:mode · 1/2/3:select · Ctrl+R:cut · K:knife · G+G:slide · Z:wireframe · Ctrl+Z:undo
          </span>
        </div>
      </div>

      {/* Sculpt panel — Sessions 4-5 */}
      {editMode === "sculpt" && (
        <div style={{
          width: 200, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", padding: 10, gap: 8, flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflowY: "auto"
        }}>
          <div style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Sculpt Brushes
          </div>
          {[["push", "Push"], ["pull", "Pull"], ["smooth", "Smooth"], ["clay", "Clay"],
          ["inflate", "Inflate"], ["pinch", "Pinch"], ["crease", "Crease"]].map(([id, label]) => (
            <button key={id} onClick={() => setSculptBrush(id)}
              style={{
                padding: "5px 8px", border: "none", borderRadius: 4, cursor: "pointer",
                fontSize: 10, fontWeight: 700, textAlign: "left",
                background: sculptBrush === id ? "#00ffc8" : "#1a1f2e",
                color: sculptBrush === id ? "#06060f" : "#888"
              }}>
              {label}
            </button>
          ))}
          <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginTop: 4 }}>
            <div style={{ color: "#666", fontSize: 9, marginBottom: 4 }}>Radius</div>
            <input type="range" min={0.1} max={3} step={0.05} value={sculptRadius}
              onChange={e => setSculptRadius(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ color: "#00ffc8", fontSize: 9, textAlign: "right" }}>{sculptRadius.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: "#666", fontSize: 9, marginBottom: 4 }}>Strength</div>
            <input type="range" min={0.001} max={0.1} step={0.001} value={sculptStrength}
              onChange={e => setSculptStrength(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ color: "#00ffc8", fontSize: 9, textAlign: "right" }}>{sculptStrength.toFixed(3)}</div>
          </div>
          <div>
            <div style={{ color: "#666", fontSize: 9, marginBottom: 4 }}>Falloff</div>
            <div style={{ display: "flex", gap: 3 }}>
              {["smooth", "linear", "sharp"].map(f => (
                <button key={f} onClick={() => setSculptFalloff(f)}
                  style={{
                    flex: 1, padding: "3px", border: "none", borderRadius: 3, cursor: "pointer",
                    fontSize: 9, fontWeight: 700,
                    background: sculptFalloff === f ? "#FF6600" : "#1a1f2e",
                    color: sculptFalloff === f ? "#fff" : "#666"
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: "#666", fontSize: 9, marginBottom: 4 }}>Symmetry</div>
            <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={sculptSymX} onChange={e => setSculptSymX(e.target.checked)} />
              <span style={{ color: "#aaa", fontSize: 10 }}>X Mirror</span>
            </label>
          </div>
          <div style={{ marginTop: "auto", color: "#333", fontSize: 9, lineHeight: 1.5 }}>
            Click + drag to sculpt.<br />Switch to Object/Edit mode to model.
          </div>
        </div>
      )}

      {/* Vertex Color Paint panel — Session 8 */}
      {editMode === "paint" && (
        <div style={{
          width: 200, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", padding: 10, gap: 8, flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflowY: "auto"
        }}>
          <div style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Vertex Colors
          </div>
          <div>
            <div style={{ color: "#666", fontSize: 9, marginBottom: 4 }}>Paint Color</div>
            <input type="color" value={vcPaintColor} onChange={e => setVcPaintColor(e.target.value)}
              style={{ width: "100%", height: 32, border: "none", borderRadius: 4, cursor: "pointer", background: "none" }} />
          </div>
          <div>
            <div style={{ color: "#666", fontSize: 9, marginBottom: 4 }}>Radius</div>
            <input type="range" min={0.05} max={3} step={0.05} value={vcRadius}
              onChange={e => setVcRadius(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ color: "#00ffc8", fontSize: 9, textAlign: "right" }}>{vcRadius.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: "#666", fontSize: 9, marginBottom: 4 }}>Strength</div>
            <input type="range" min={0.01} max={1} step={0.01} value={vcStrength}
              onChange={e => setVcStrength(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ color: "#00ffc8", fontSize: 9, textAlign: "right" }}>{vcStrength.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: "#666", fontSize: 9, marginBottom: 4 }}>Falloff</div>
            <div style={{ display: "flex", gap: 3 }}>
              {["smooth", "linear", "sharp"].map(f => (
                <button key={f} onClick={() => setVcFalloff(f)}
                  style={{
                    flex: 1, padding: "3px", border: "none", borderRadius: 3, cursor: "pointer",
                    fontSize: 9, fontWeight: 700,
                    background: vcFalloff === f ? "#FF6600" : "#1a1f2e",
                    color: vcFalloff === f ? "#fff" : "#666"
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ color: "#666", fontSize: 9, marginBottom: 2 }}>Fill Tools</div>
            <button onClick={() => { initVertexColors(meshRef.current); fillVertexColor(meshRef.current, vcPaintColor); }}
              style={{ padding: "5px", background: "#333333", border: "1px solid #3a3a3a", color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 10 }}>
              Fill All
            </button>
            <div style={{ color: "#666", fontSize: 9, marginTop: 4, marginBottom: 2 }}>Gradient Color B</div>
            <input type="color" value={vcPaintColor2} onChange={e => setVcPaintColor2(e.target.value)}
              style={{ width: "100%", height: 28, border: "none", borderRadius: 4, cursor: "pointer", background: "none" }} />
            <button onClick={() => { initVertexColors(meshRef.current); gradientFillVertexColor(meshRef.current, vcPaintColor, vcPaintColor2); }}
              style={{ padding: "5px", background: "#333333", border: "1px solid #3a3a3a", color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 10 }}>
              Gradient Fill (Y)
            </button>
          </div>
          <div style={{ marginTop: "auto", color: "#333", fontSize: 9, lineHeight: 1.5 }}>
            Click + drag to paint.<br />Add primitive first to paint.
          </div>
        </div>
      )}

      {/* NLA + Dyntopo + Weight + BVH panel — Sessions 21-30 */}
      {(showNLA || dyntopoEnabled || weightPainting) && (
        <div style={{
          width: 190, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
            <span style={{ color: "#8844ff", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Rig Tools
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

            {/* Pose Mode */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Pose Mode</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                <button onClick={handleEnterPoseMode}
                  style={{
                    flex: 1, padding: "4px", background: poseMode ? "#00ffc8" : "#1a1f2e",
                    border: "none", color: poseMode ? "#06060f" : "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9
                  }}>
                  Enter
                </button>
                <button onClick={handleExitPoseMode}
                  style={{
                    flex: 1, padding: "4px", background: "#1a1f2e",
                    border: "none", color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9
                  }}>
                  Exit
                </button>
              </div>
              <button onClick={handleResetPose}
                style={{
                  width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                  color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9, marginBottom: 4
                }}>
                Reset to Rest
              </button>
              <button onClick={() => handleSavePose("Pose_" + Object.keys(poseLibrary).length)}
                style={{
                  width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                  color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9
                }}>
                Save Pose
              </button>
              {Object.keys(poseLibrary).length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Pose Library</div>
                  {Object.keys(poseLibrary).map(name => (
                    <button key={name} onClick={() => handleLoadPose(name)}
                      style={{
                        width: "100%", padding: "3px", background: "#333333", border: "1px solid #3a3a3a",
                        color: "#00ffc8", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 2, textAlign: "left"
                      }}>
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bind to Rig */}
            <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
              <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Skinning</div>
              <button onClick={handleBindToRig}
                style={{
                  width: "100%", padding: "5px", background: "#FF6600", border: "none",
                  color: "#fff", borderRadius: 3, cursor: "pointer", fontSize: 9, marginBottom: 4
                }}>
                Bind Mesh to Rig
              </button>
              <button onClick={() => { const mesh = meshRef.current; if (mesh) autoWeightByDistance(mesh, armatureRef.current); }}
                style={{
                  width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                  color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9
                }}>
                Auto Weights
              </button>
            </div>

            {/* Weight Paint controls */}
            {weightPainting && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Weight Paint</div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Bone</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{wpBoneIndex}</span>
                  </div>
                  <input type="range" min={0} max={7} step={1} value={wpBoneIndex}
                    onChange={e => setWpBoneIndex(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Radius</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{wpRadius.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.05} max={3} step={0.05} value={wpRadius}
                    onChange={e => setWpRadius(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                  {["add", "sub", "set"].map(m => (
                    <button key={m} onClick={() => setWpMode(m)}
                      style={{
                        flex: 1, padding: "3px", border: "none", borderRadius: 3, cursor: "pointer",
                        fontSize: 8, fontWeight: 700,
                        background: wpMode === m ? "#FF6600" : "#1a1f2e",
                        color: wpMode === m ? "#fff" : "#666"
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
                <button onClick={() => { const m = meshRef.current; if (m) visualizeWeights(m, wpBoneIndex); }}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8
                  }}>
                  Visualize Weights
                </button>
              </div>
            )}

            {/* Dyntopo controls */}
            {dyntopoEnabled && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
                <div style={{ color: "#8844ff", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Dynamic Topology</div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Detail Size</span>
                    <span style={{ color: "#8844ff", fontSize: 8 }}>{dyntopoDetail.toFixed(3)}</span>
                  </div>
                  <input type="range" min={0.01} max={0.5} step={0.01} value={dyntopoDetail}
                    onChange={e => setDyntopoDetail(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                  {["subdivide", "collapse", "both"].map(m => (
                    <button key={m} onClick={() => setDyntopoMode(m)}
                      style={{
                        flex: 1, padding: "3px", border: "none", borderRadius: 3, cursor: "pointer",
                        fontSize: 8, fontWeight: 700,
                        background: dyntopoMode === m ? "#8844ff" : "#1a1f2e",
                        color: dyntopoMode === m ? "#fff" : "#666"
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
                <button onClick={handleDyntopoFlood}
                  style={{
                    width: "100%", padding: "4px", background: "#8844ff", border: "none",
                    color: "#fff", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  Flood Fill
                </button>
                <button onClick={handleSmoothTopology}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8
                  }}>
                  Smooth Topology
                </button>
              </div>
            )}

            {/* NLA */}
            {showNLA && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
                <div style={{ color: "#00ffc8", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>NLA Editor</div>
                <button onClick={handlePushDownAction}
                  style={{
                    width: "100%", padding: "5px", background: "#00ffc8", border: "none",
                    color: "#06060f", borderRadius: 3, cursor: "pointer", fontSize: 9, marginBottom: 4, fontWeight: 700
                  }}>
                  Push Down Action
                </button>
                {nlaActions.map(action => (
                  <div key={action.id} style={{
                    padding: "3px 6px", background: "#1a1f2e",
                    border: "1px solid #3a3a3a", borderRadius: 3, marginBottom: 3
                  }}>
                    <span style={{ color: "#aaa", fontSize: 8 }}>{action.name}</span>
                    <span style={{ color: "#555", fontSize: 8, marginLeft: 6 }}>{action.frameEnd}f</span>
                  </div>
                ))}
                {nlaTracks.map(track => (
                  <div key={track.id} style={{ marginTop: 4 }}>
                    <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>{track.name} — {track.strips.length} strips</div>
                    {track.strips.map(strip => (
                      <div key={strip.id} style={{
                        padding: "2px 6px", background: "#0a2a1a",
                        border: "1px solid #00ffc822", borderRadius: 3, marginBottom: 2
                      }}>
                        <span style={{ color: "#00ffc8", fontSize: 8 }}>{strip.actionName}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* BVH Import */}
            <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8 }}>
              <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>BVH / Mocap</div>
              <input ref={bvhInputRef} type="file" accept=".bvh" style={{ display: "none" }}
                onChange={e => e.target.files?.[0] && handleBVHImport(e.target.files[0])} />
              <button onClick={() => bvhInputRef.current?.click()}
                style={{
                  width: "100%", padding: "5px", background: "#333333", border: "1px solid #3a3a3a",
                  color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9, marginBottom: 4
                }}>
                📁 Import BVH
              </button>
              {bvhData && (
                <div style={{ color: "#00ffc8", fontSize: 8, lineHeight: 1.6 }}>
                  ✓ {bvhData.bvh.joints.length} joints<br />
                  ✓ {bvhData.bvh.frames.length} frames<br />
                  ✓ {(1 / bvhData.bvh.frameTime).toFixed(0)}fps
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Sessions 131-142: GLSL Shaders + Post Passes + Marching Cubes panel */}
      {(showShaderPanel || showPostPassPanel || showMCPanel) && (
        <div style={{
          width: 210, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              GLSL + Marching Cubes
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

            {/* GLSL Shaders — Sessions 131-138 */}
            {showShaderPanel && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>GLSL Shaders</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(SHADER_PRESETS).map(([k, v]) => (
                    <button key={k} onClick={() => setActiveShaderPreset(k)}
                      style={{
                        padding: "2px 5px", background: activeShaderPreset === k ? "#00ffc8" : "#1a1f2e",
                        border: "none", color: activeShaderPreset === k ? "#06060f" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 8
                      }}>
                      {v.icon} {v.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleApplyGLSLShader}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                  }}>
                  ▶ Apply Shader
                </button>
                <button onClick={handleApplyToon}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 2
                  }}>
                  🎨 Toon/NPR
                </button>
                <button onClick={handleApplyHolographic}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 2
                  }}>
                  🔮 Holographic
                </button>
                <button onClick={handleApplyDissolve}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  💨 Dissolve
                </button>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Dissolve Amount</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{dissolveAmount.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.01} value={dissolveAmount}
                    onChange={e => handleSetDissolveAmount(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <button onClick={handleAddOutline}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 2
                  }}>
                  ⬡ Add Outline
                </button>
                <button onClick={handleApplyHairGLSL}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8
                  }}>
                  💇 Hair GLSL Shader
                </button>
              </div>
            )}

            {/* Post Passes — Sessions 139-140 */}
            {showPostPassPanel && (
              <div style={{ borderTop: showShaderPanel ? "1px solid #3a3a3a" : "none", paddingTop: showShaderPanel ? 8 : 0, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Post Passes</div>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 3 }}>
                  <input type="checkbox" checked={bloomEnabled} onChange={handleToggleBloom} />
                  <span style={{ color: bloomEnabled ? "#00ffc8" : "#666", fontSize: 9 }}>Bloom</span>
                </label>
                {bloomEnabled && (
                  <div style={{ marginBottom: 4, paddingLeft: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                      <span style={{ color: "#555", fontSize: 7 }}>Strength</span>
                      <span style={{ color: "#00ffc8", fontSize: 7 }}>{bloomStrength.toFixed(2)}</span>
                    </div>
                    <input type="range" min={0} max={2} step={0.05} value={bloomStrength}
                      onChange={e => setBloomStrength(Number(e.target.value))} style={{ width: "100%" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                      <span style={{ color: "#555", fontSize: 7 }}>Threshold</span>
                      <span style={{ color: "#00ffc8", fontSize: 7 }}>{bloomThreshold.toFixed(2)}</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.05} value={bloomThreshold}
                      onChange={e => setBloomThreshold(Number(e.target.value))} style={{ width: "100%" }} />
                  </div>
                )}
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 3 }}>
                  <input type="checkbox" checked={ssaoEnabled} onChange={handleToggleSSAO} />
                  <span style={{ color: ssaoEnabled ? "#00ffc8" : "#666", fontSize: 9 }}>SSAO</span>
                </label>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 3 }}>
                  <input type="checkbox" checked={dofEnabled} onChange={handleToggleDOF} />
                  <span style={{ color: dofEnabled ? "#00ffc8" : "#666", fontSize: 9 }}>Depth of Field</span>
                </label>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 4 }}>
                  <input type="checkbox" checked={chromaticEnabled} onChange={() => setChromaticEnabled(c => !c)} />
                  <span style={{ color: chromaticEnabled ? "#00ffc8" : "#666", fontSize: 9 }}>Chromatic Aberration</span>
                </label>
                <button onClick={handleInitPostPasses}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8
                  }}>
                  ⚙ Init Post Manager
                </button>
              </div>
            )}

            {/* Marching Cubes — Sessions 141-142 */}
            {showMCPanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Marching Cubes</div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Resolution</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{mcResolution}</span>
                  </div>
                  <input type="range" min={8} max={64} step={4} value={mcResolution}
                    onChange={e => setMcResolution(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Isolevel</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{mcIsolevel.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.1} max={0.9} step={0.05} value={mcIsolevel}
                    onChange={e => setMcIsolevel(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <button onClick={handleMarchingCubesRemesh}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                  }}>
                  ⬡ MC Remesh
                </button>
                <button onClick={handleFluidSurface}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  💧 Fluid Surface Mesh
                </button>
                {mcStats && (
                  <div style={{ color: "#555", fontSize: 8, lineHeight: 1.6 }}>
                    Vertices: {mcStats.vertices}<br />
                    Triangles: {mcStats.triangles}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions 3-9: PathTracer + FBX + Plugin + Preset panel */}
      {(showPathTracerPanel || showPipelinePanel || showPluginPanel || showMarketPanel) && (
        <div style={{width:210,background:"#2a2a2a",borderLeft:"1px solid #3a3a3a",
          display:"flex",flexDirection:"column",flexShrink:0,
          fontFamily:"JetBrains Mono,monospace",fontSize:11,overflow:"hidden"}}>
          <div style={{padding:"6px 10px",borderBottom:"1px solid #3a3a3a"}}>
            <span style={{color:"#00ffc8",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>
              Pro Pipeline
            </span>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>

            {/* Path Tracer */}
            {showPathTracerPanel && (
              <div style={{marginBottom:10}}>
                <div style={{color:"#FF6600",fontSize:9,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>Path Tracer</div>
                <button onClick={handleDetectPathTracer}
                  style={{width:"100%",padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:8,marginBottom:3}}>
                  🔍 Detect PathTracer
                </button>
                {ptDetected && (
                  <div style={{color:ptDetected.available?"#00ffc8":"#888",fontSize:8,marginBottom:4}}>
                    {ptDetected.available ? "✓ " + ptDetected.version : "Using built-in"}
                  </div>
                )}
                <button onClick={handleCreatePathTracer}
                  style={{width:"100%",padding:"5px",background:"#00ffc8",border:"none",color:"#06060f",
                    borderRadius:3,cursor:"pointer",fontSize:9,fontWeight:700,marginBottom:3}}>
                  ✦ Create Path Tracer
                </button>
                <div style={{display:"flex",gap:3,marginBottom:4}}>
                  <button onClick={handleStartPathTracing} disabled={ptRunning}
                    style={{flex:1,padding:"4px",background:ptRunning?"#555":"#FF6600",
                      border:"none",color:"#fff",borderRadius:3,cursor:"pointer",fontSize:9}}>▶</button>
                  <button onClick={handleStopPathTracing}
                    style={{flex:1,padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                      color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:9}}>■</button>
                  <button onClick={handleExportPathTracedFrame}
                    style={{flex:1,padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                      color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:9}}>⬇</button>
                </div>
                {ptStats && (
                  <div style={{color:"#555",fontSize:8,lineHeight:1.6}}>
                    Samples: {ptStats.samples}/{ptStats.maxSamples}<br/>
                    Progress: {Math.round(ptStats.progress*100)}%<br/>
                    SPS: {ptStats.sps}<br/>
                    ETA: {ptStats.eta}s<br/>
                    Time: {ptStats.elapsed}s<br/>
                    {ptRunning && <span style={{color:"#00ffc8"}}>● Rendering</span>}
                  </div>
                )}
              </div>
            )}

            {/* FBX/OBJ Pipeline */}
            {showPipelinePanel && (
              <div style={{borderTop:showPathTracerPanel?"1px solid #3a3a3a":"none",
                paddingTop:showPathTracerPanel?8:0,marginBottom:10}}>
                <div style={{color:"#FF6600",fontSize:9,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>Import / Export</div>
                <div style={{color:"#555",fontSize:8,marginBottom:3}}>Import</div>
                <button onClick={handleImportOBJ}
                  style={{width:"100%",padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:8,marginBottom:2}}>
                  📂 Import OBJ
                </button>
                <button onClick={handleImportFBX}
                  style={{width:"100%",padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:8,marginBottom:4}}>
                  📂 Import FBX (backend)
                </button>
                <div style={{color:"#555",fontSize:8,marginBottom:3}}>Export</div>
                <button onClick={handleExportOBJ}
                  style={{width:"100%",padding:"5px",background:"#00ffc8",border:"none",color:"#06060f",
                    borderRadius:3,cursor:"pointer",fontSize:9,fontWeight:700,marginBottom:2}}>
                  💾 Export OBJ + MTL
                </button>
                <button onClick={handleExportFBX}
                  style={{width:"100%",padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:8,marginBottom:2}}>
                  💾 Export FBX (backend)
                </button>
                <div style={{color:"#555",fontSize:7,marginTop:4,lineHeight:1.5}}>
                  {SUPPORTED_EXPORT_FORMATS.map(f=>(
                    <div key={f.ext} style={{display:"flex",gap:4,marginBottom:1}}>
                      <span style={{color:f.native?"#00ffc8":"#888",width:36}}>{f.label}</span>
                      <span style={{color:"#333"}}>{f.native?"native":"backend"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plugin Manager */}
            {showPluginPanel && (
              <div style={{borderTop:"1px solid #3a3a3a",paddingTop:8,marginBottom:10}}>
                <div style={{color:"#FF6600",fontSize:9,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>Plugin Manager</div>
                <button onClick={handleInitPlugins}
                  style={{width:"100%",padding:"5px",background:"#00ffc8",border:"none",color:"#06060f",
                    borderRadius:3,cursor:"pointer",fontSize:9,fontWeight:700,marginBottom:3}}>
                  ⚙ Init Plugin API
                </button>
                <button onClick={handleLoadPlugin}
                  style={{width:"100%",padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:8,marginBottom:4}}>
                  📂 Load Plugin (.js)
                </button>
                {pluginStats && (
                  <div style={{color:"#555",fontSize:8,lineHeight:1.6,marginBottom:4}}>
                    Total: {pluginStats.total}<br/>
                    Brushes: {pluginStats.brushes||0}<br/>
                    Shaders: {pluginStats.shaders||0}<br/>
                    Exporters: {pluginStats.exporters||0}
                  </div>
                )}
                <div style={{color:"#555",fontSize:8,marginBottom:2}}>Built-in brushes</div>
                {BUILTIN_BRUSH_PLUGINS.map(p=>(
                  <div key={p.name} style={{padding:"2px 6px",background:"#1a1f2e",
                    border:"1px solid #3a3a3a",borderRadius:3,marginBottom:2,
                    display:"flex",alignItems:"center",gap:4}}>
                    <span style={{color:"#00ffc8",fontSize:9}}>{p.icon}</span>
                    <span style={{color:"#dde6ef",fontSize:8}}>{p.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Preset Marketplace */}
            {showMarketPanel && (
              <div style={{borderTop:"1px solid #3a3a3a",paddingTop:8}}>
                <div style={{color:"#FF6600",fontSize:9,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>Preset Marketplace</div>
                <input value={presetSearch} onChange={e=>setPresetSearch(e.target.value)}
                  placeholder="Search presets..."
                  style={{width:"100%",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#dde6ef",borderRadius:3,padding:"4px",fontSize:8,marginBottom:3,
                    fontFamily:"JetBrains Mono,monospace"}}/>
                <div style={{display:"flex",gap:2,flexWrap:"wrap",marginBottom:4}}>
                  {Object.entries(PRESET_CATEGORIES).map(([k,v])=>(
                    <button key={k} onClick={()=>setPresetCategory(presetCategory===k?null:k)}
                      title={v.label}
                      style={{padding:"2px 4px",background:presetCategory===k?v.color:"#1a1f2e",
                        border:"none",color:presetCategory===k?"#06060f":"#555",
                        borderRadius:3,cursor:"pointer",fontSize:9}}>
                      {v.icon}
                    </button>
                  ))}
                </div>
                <label style={{display:"flex",gap:4,alignItems:"center",color:"#555",fontSize:8,marginBottom:4,cursor:"pointer"}}>
                  <input type="checkbox" checked={presetFreeOnly} onChange={e=>setPresetFreeOnly(e.target.checked)}/>
                  Free only
                </label>
                <div style={{maxHeight:200,overflowY:"auto"}}>
                  {searchPresets(pluginMarketplace, presetSearch, { category:presetCategory, freeOnly:presetFreeOnly }).map(p=>(
                    <div key={p.id} style={{padding:"4px 6px",background:"#1a1f2e",
                      border:"1px solid #3a3a3a",borderRadius:3,marginBottom:3}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{color:"#dde6ef",fontSize:8,fontWeight:700}}>{p.name}</span>
                        <span style={{color:p.free?"#00ffc8":"#ffaa00",fontSize:7}}>
                          {p.free?"FREE":"$"+p.price}
                        </span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                        <span style={{color:"#555",fontSize:7}}>by {p.author} · ★{p.rating}</span>
                        <button
                          onClick={()=>isPresetInstalled(pluginMarketplace,p.id)
                            ? uninstallPreset(pluginMarketplace,p.id)
                            : handleInstallPreset(p.id)}
                          style={{background:isPresetInstalled(pluginMarketplace,p.id)?"#333":"#00ffc8",
                            border:"none",color:isPresetInstalled(pluginMarketplace,p.id)?"#888":"#06060f",
                            borderRadius:2,padding:"1px 6px",cursor:"pointer",fontSize:7,fontWeight:700}}>
                          {isPresetInstalled(pluginMarketplace,p.id)?"✓":"GET"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={handleSavePreset}
                  style={{width:"100%",padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:8,marginTop:4}}>
                  + Save Custom Preset
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions 3-9: PathTracer + FBX + Plugin + Preset panel */}
      {(showPathTracerPanel || showPipelinePanel || showPluginPanel || showMarketPanel) && (
        <div style={{width:210,background:"#2a2a2a",borderLeft:"1px solid #3a3a3a",
          display:"flex",flexDirection:"column",flexShrink:0,
          fontFamily:"JetBrains Mono,monospace",fontSize:11,overflow:"hidden"}}>
          <div style={{padding:"6px 10px",borderBottom:"1px solid #3a3a3a"}}>
            <span style={{color:"#00ffc8",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>
              Pro Pipeline
            </span>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"8px 10px"}}>

            {/* Path Tracer */}
            {showPathTracerPanel && (
              <div style={{marginBottom:10}}>
                <div style={{color:"#FF6600",fontSize:9,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>Path Tracer</div>
                <button onClick={handleDetectPathTracer}
                  style={{width:"100%",padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:8,marginBottom:3}}>
                  🔍 Detect PathTracer
                </button>
                {ptDetected && (
                  <div style={{color:ptDetected.available?"#00ffc8":"#888",fontSize:8,marginBottom:4}}>
                    {ptDetected.available ? "✓ " + ptDetected.version : "Using built-in"}
                  </div>
                )}
                <button onClick={handleCreatePathTracer}
                  style={{width:"100%",padding:"5px",background:"#00ffc8",border:"none",color:"#06060f",
                    borderRadius:3,cursor:"pointer",fontSize:9,fontWeight:700,marginBottom:3}}>
                  ✦ Create Path Tracer
                </button>
                <div style={{display:"flex",gap:3,marginBottom:4}}>
                  <button onClick={handleStartPathTracing} disabled={ptRunning}
                    style={{flex:1,padding:"4px",background:ptRunning?"#555":"#FF6600",
                      border:"none",color:"#fff",borderRadius:3,cursor:"pointer",fontSize:9}}>▶</button>
                  <button onClick={handleStopPathTracing}
                    style={{flex:1,padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                      color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:9}}>■</button>
                  <button onClick={handleExportPathTracedFrame}
                    style={{flex:1,padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                      color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:9}}>⬇</button>
                </div>
                {ptStats && (
                  <div style={{color:"#555",fontSize:8,lineHeight:1.6}}>
                    Samples: {ptStats.samples}/{ptStats.maxSamples}<br/>
                    Progress: {Math.round(ptStats.progress*100)}%<br/>
                    SPS: {ptStats.sps}<br/>
                    ETA: {ptStats.eta}s<br/>
                    Time: {ptStats.elapsed}s<br/>
                    {ptRunning && <span style={{color:"#00ffc8"}}>● Rendering</span>}
                  </div>
                )}
              </div>
            )}

            {/* FBX/OBJ Pipeline */}
            {showPipelinePanel && (
              <div style={{borderTop:showPathTracerPanel?"1px solid #3a3a3a":"none",
                paddingTop:showPathTracerPanel?8:0,marginBottom:10}}>
                <div style={{color:"#FF6600",fontSize:9,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>Import / Export</div>
                <div style={{color:"#555",fontSize:8,marginBottom:3}}>Import</div>
                <button onClick={handleImportOBJ}
                  style={{width:"100%",padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:8,marginBottom:2}}>
                  📂 Import OBJ
                </button>
                <button onClick={handleImportFBX}
                  style={{width:"100%",padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:8,marginBottom:4}}>
                  📂 Import FBX (backend)
                </button>
                <div style={{color:"#555",fontSize:8,marginBottom:3}}>Export</div>
                <button onClick={handleExportOBJ}
                  style={{width:"100%",padding:"5px",background:"#00ffc8",border:"none",color:"#06060f",
                    borderRadius:3,cursor:"pointer",fontSize:9,fontWeight:700,marginBottom:2}}>
                  💾 Export OBJ + MTL
                </button>
                <button onClick={handleExportFBX}
                  style={{width:"100%",padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:8,marginBottom:2}}>
                  💾 Export FBX (backend)
                </button>
                <div style={{color:"#555",fontSize:7,marginTop:4,lineHeight:1.5}}>
                  {SUPPORTED_EXPORT_FORMATS.map(f=>(
                    <div key={f.ext} style={{display:"flex",gap:4,marginBottom:1}}>
                      <span style={{color:f.native?"#00ffc8":"#888",width:36}}>{f.label}</span>
                      <span style={{color:"#333"}}>{f.native?"native":"backend"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plugin Manager */}
            {showPluginPanel && (
              <div style={{borderTop:"1px solid #3a3a3a",paddingTop:8,marginBottom:10}}>
                <div style={{color:"#FF6600",fontSize:9,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>Plugin Manager</div>
                <button onClick={handleInitPlugins}
                  style={{width:"100%",padding:"5px",background:"#00ffc8",border:"none",color:"#06060f",
                    borderRadius:3,cursor:"pointer",fontSize:9,fontWeight:700,marginBottom:3}}>
                  ⚙ Init Plugin API
                </button>
                <button onClick={handleLoadPlugin}
                  style={{width:"100%",padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:8,marginBottom:4}}>
                  📂 Load Plugin (.js)
                </button>
                {pluginStats && (
                  <div style={{color:"#555",fontSize:8,lineHeight:1.6,marginBottom:4}}>
                    Total: {pluginStats.total}<br/>
                    Brushes: {pluginStats.brushes||0}<br/>
                    Shaders: {pluginStats.shaders||0}<br/>
                    Exporters: {pluginStats.exporters||0}
                  </div>
                )}
                <div style={{color:"#555",fontSize:8,marginBottom:2}}>Built-in brushes</div>
                {BUILTIN_BRUSH_PLUGINS.map(p=>(
                  <div key={p.name} style={{padding:"2px 6px",background:"#1a1f2e",
                    border:"1px solid #3a3a3a",borderRadius:3,marginBottom:2,
                    display:"flex",alignItems:"center",gap:4}}>
                    <span style={{color:"#00ffc8",fontSize:9}}>{p.icon}</span>
                    <span style={{color:"#dde6ef",fontSize:8}}>{p.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Preset Marketplace */}
            {showMarketPanel && (
              <div style={{borderTop:"1px solid #3a3a3a",paddingTop:8}}>
                <div style={{color:"#FF6600",fontSize:9,fontWeight:700,marginBottom:4,textTransform:"uppercase"}}>Preset Marketplace</div>
                <input value={presetSearch} onChange={e=>setPresetSearch(e.target.value)}
                  placeholder="Search presets..."
                  style={{width:"100%",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#dde6ef",borderRadius:3,padding:"4px",fontSize:8,marginBottom:3,
                    fontFamily:"JetBrains Mono,monospace"}}/>
                <div style={{display:"flex",gap:2,flexWrap:"wrap",marginBottom:4}}>
                  {Object.entries(PRESET_CATEGORIES).map(([k,v])=>(
                    <button key={k} onClick={()=>setPresetCategory(presetCategory===k?null:k)}
                      title={v.label}
                      style={{padding:"2px 4px",background:presetCategory===k?v.color:"#1a1f2e",
                        border:"none",color:presetCategory===k?"#06060f":"#555",
                        borderRadius:3,cursor:"pointer",fontSize:9}}>
                      {v.icon}
                    </button>
                  ))}
                </div>
                <label style={{display:"flex",gap:4,alignItems:"center",color:"#555",fontSize:8,marginBottom:4,cursor:"pointer"}}>
                  <input type="checkbox" checked={presetFreeOnly} onChange={e=>setPresetFreeOnly(e.target.checked)}/>
                  Free only
                </label>
                <div style={{maxHeight:200,overflowY:"auto"}}>
                  {searchPresets(pluginMarketplace, presetSearch, { category:presetCategory, freeOnly:presetFreeOnly }).map(p=>(
                    <div key={p.id} style={{padding:"4px 6px",background:"#1a1f2e",
                      border:"1px solid #3a3a3a",borderRadius:3,marginBottom:3}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{color:"#dde6ef",fontSize:8,fontWeight:700}}>{p.name}</span>
                        <span style={{color:p.free?"#00ffc8":"#ffaa00",fontSize:7}}>
                          {p.free?"FREE":"$"+p.price}
                        </span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                        <span style={{color:"#555",fontSize:7}}>by {p.author} · ★{p.rating}</span>
                        <button
                          onClick={()=>isPresetInstalled(pluginMarketplace,p.id)
                            ? uninstallPreset(pluginMarketplace,p.id)
                            : handleInstallPreset(p.id)}
                          style={{background:isPresetInstalled(pluginMarketplace,p.id)?"#333":"#00ffc8",
                            border:"none",color:isPresetInstalled(pluginMarketplace,p.id)?"#888":"#06060f",
                            borderRadius:2,padding:"1px 6px",cursor:"pointer",fontSize:7,fontWeight:700}}>
                          {isPresetInstalled(pluginMarketplace,p.id)?"✓":"GET"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={handleSavePreset}
                  style={{width:"100%",padding:"4px",background:"#333333",border:"1px solid #3a3a3a",
                    color:"#aaa",borderRadius:3,cursor:"pointer",fontSize:8,marginTop:4}}>
                  + Save Custom Preset
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions 157-169: Rendering + Performance + Polish panel */}
      {(showRenderFarmPanel || showWorkerPanel || showThemePanel || showExportPanel) && (
        <div style={{
          width: 210, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Rendering + Polish
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

            {/* Render Farm — Sessions 157-161 */}
            {showRenderFarmPanel && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Render Farm</div>
                <button onClick={handleDetectWebGPU}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  🔍 Detect WebGPU
                </button>
                {webgpuInfo && (
                  <div style={{ color: webgpuInfo.supported ? "#00ffc8" : "#ff4444", fontSize: 8, marginBottom: 4 }}>
                    {webgpuInfo.supported ? "✓ WebGPU: " + webgpuInfo.vendor : "✗ " + webgpuInfo.reason}
                  </div>
                )}
                <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                  <button onClick={handleEnableIBL}
                    style={{
                      flex: 1, padding: "4px", background: iblEnabled ? "#00ffc8" : "#1a1f2e",
                      border: "1px solid #3a3a3a", color: iblEnabled ? "#06060f" : "#aaa",
                      borderRadius: 3, cursor: "pointer", fontSize: 8
                    }}>IBL</button>
                  <button onClick={handleEnableShadows}
                    style={{
                      flex: 1, padding: "4px", background: shadowsEnabled ? "#ffaa00" : "#1a1f2e",
                      border: "1px solid #3a3a3a", color: shadowsEnabled ? "#06060f" : "#aaa",
                      borderRadius: 3, cursor: "pointer", fontSize: 8
                    }}>CSM</button>
                  <button onClick={handleEnableNPROutline}
                    style={{
                      flex: 1, padding: "4px", background: nprOutline ? "#8844ff" : "#1a1f2e",
                      border: "1px solid #3a3a3a", color: nprOutline ? "#fff" : "#aaa",
                      borderRadius: 3, cursor: "pointer", fontSize: 8
                    }}>NPR</button>
                </div>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Job Name</div>
                <input value={farmJobName} onChange={e => setFarmJobName(e.target.value)}
                  style={{
                    width: "100%", background: "#333333", border: "1px solid #3a3a3a", color: "#dde6ef",
                    borderRadius: 3, padding: "3px", fontSize: 8, marginBottom: 3, fontFamily: "JetBrains Mono,monospace"
                  }} />
                <div style={{ display: "flex", gap: 3, marginBottom: 3 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#555", fontSize: 7, marginBottom: 1 }}>Start</div>
                    <input type="number" value={farmFrameStart} onChange={e => setFarmFrameStart(Number(e.target.value))}
                      style={{
                        width: "100%", background: "#333333", border: "1px solid #3a3a3a", color: "#dde6ef",
                        borderRadius: 3, padding: "3px", fontSize: 8, fontFamily: "JetBrains Mono,monospace"
                      }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#555", fontSize: 7, marginBottom: 1 }}>End</div>
                    <input type="number" value={farmFrameEnd} onChange={e => setFarmFrameEnd(Number(e.target.value))}
                      style={{
                        width: "100%", background: "#333333", border: "1px solid #3a3a3a", color: "#dde6ef",
                        borderRadius: 3, padding: "3px", fontSize: 8, fontFamily: "JetBrains Mono,monospace"
                      }} />
                  </div>
                </div>
                <button onClick={handleAddRenderJob}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  + Add Job
                </button>
                <button onClick={handleRunRenderFarm}
                  style={{
                    width: "100%", padding: "5px", background: "#FF6600", border: "none", color: "#fff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  ▶ Run Farm
                </button>
                <div style={{ maxHeight: 80, overflowY: "auto" }}>
                  {renderFarm.jobs.map(j => (
                    <div key={j.id} style={{
                      padding: "2px 4px", background: "#1a1f2e",
                      border: "1px solid #3a3a3a", borderRadius: 3, marginBottom: 2,
                      display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <span style={{ color: JOB_STATUS[j.status]?.color || "#aaa", fontSize: 7 }}>●</span>
                      <span style={{ color: "#dde6ef", fontSize: 7, flex: 1, margin: "0 4px" }}>{j.name}</span>
                      <span style={{ color: "#555", fontSize: 7 }}>{Math.round(j.progress * 100)}%</span>
                      <button onClick={() => { cancelRenderJob(renderFarm, j.id); setRenderFarm({ ...renderFarm }); }}
                        style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 8 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Workers — Sessions 162-165 */}
            {showWorkerPanel && (
              <div style={{ borderTop: showRenderFarmPanel ? "1px solid #3a3a3a" : "none", paddingTop: showRenderFarmPanel ? 8 : 0, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Worker Threads</div>
                <button onClick={handleInitWorkers}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  ⚙ Init Workers
                </button>
                {workerSupport && (
                  <div style={{ color: "#555", fontSize: 8, marginBottom: 4 }}>
                    Workers: {workerSupport.workers ? "✓" : "✗"}<br />
                    SharedArrayBuffer: {workerSupport.sharedArrayBuffer ? "✓" : "✗"}
                  </div>
                )}
                <button onClick={handleToggleWorkerCloth}
                  style={{
                    width: "100%", padding: "4px",
                    background: useWorkerCloth ? "#4488ff" : "#1a1f2e",
                    border: "1px solid #3a3a3a",
                    color: useWorkerCloth ? "#fff" : "#aaa",
                    borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  {useWorkerCloth ? "✓" : "○"} Cloth → Worker
                </button>
                <button onClick={handleToggleWorkerSPH}
                  style={{
                    width: "100%", padding: "4px",
                    background: useWorkerSPH ? "#4488ff" : "#1a1f2e",
                    border: "1px solid #3a3a3a",
                    color: useWorkerSPH ? "#fff" : "#aaa",
                    borderRadius: 3, cursor: "pointer", fontSize: 8
                  }}>
                  {useWorkerSPH ? "✓" : "○"} SPH → Worker
                </button>
              </div>
            )}

            {/* Theme — Sessions 166 */}
            {showThemePanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Theme</div>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6 }}>
                  {Object.entries(THEMES).map(([k, v]) => (
                    <button key={k} onClick={() => handleApplyTheme(k)}
                      style={{
                        padding: "4px 8px",
                        background: activeTheme === k ? v.accent : "#1a1f2e",
                        border: "1px solid " + (activeTheme === k ? v.accent : "#21262d"),
                        color: activeTheme === k ? "#06060f" : "#aaa",
                        borderRadius: 3, cursor: "pointer", fontSize: 8, fontWeight: activeTheme === k ? 700 : 400
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleToggleShortcutOverlay}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  ⌨ Keyboard Shortcuts
                </button>
                <button onClick={handleStartTour}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8
                  }}>
                  🎓 Start Tour
                </button>
              </div>
            )}

            {/* Export — Sessions 169 */}
            {showExportPanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Export to StreamPireX</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(SPX_EXPORT_FORMATS).map(([k, v]) => (
                    <button key={k} onClick={() => setExportFormat(k)}
                      style={{
                        padding: "2px 5px", background: exportFormat === k ? "#00ffc8" : "#1a1f2e",
                        border: "none", color: exportFormat === k ? "#06060f" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 8, fontWeight: exportFormat === k ? 700 : 400
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 4 }}>
                  {SPX_EXPORT_FORMATS[exportFormat]?.desc}
                </div>
                <button onClick={handleExportToSPX}
                  style={{
                    width: "100%", padding: "6px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 10, fontWeight: 700, marginBottom: 4
                  }}>
                  🚀 Export to StreamPireX
                </button>
                {exportResult && (
                  <div style={{ color: exportResult.success ? "#00ffc8" : "#ff4444", fontSize: 8 }}>
                    {exportResult.success
                      ? (exportResult.offline ? "✓ Downloaded locally" : "✓ Sent to StreamPireX")
                      : "✗ Export failed"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions 143-156: GPU Particles + Upgrades panel */}
      {(showGPUPanel || showHairStylePanel || showAnimUpPanel) && (
        <div style={{
          width: 200, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Upgrades
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

            {/* GPU Particles */}
            {showGPUPanel && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>GPU Particles</div>
                <button onClick={handleCreateGPUParticles}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                  }}>
                  ✦ Create GPU System
                </button>
                <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                  <button onClick={handleStartGPUParticles} disabled={gpuRunning}
                    style={{
                      flex: 1, padding: "4px", background: gpuRunning ? "#555" : "#FF6600",
                      border: "none", color: "#fff", borderRadius: 3, cursor: "pointer", fontSize: 9
                    }}>▶</button>
                  <button onClick={handleStopGPUParticles}
                    style={{
                      flex: 1, padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                      color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9
                    }}>■</button>
                  <button onClick={handleBurstGPUParticles}
                    style={{
                      flex: 1, padding: "4px", background: "#8844ff", border: "none",
                      color: "#fff", borderRadius: 3, cursor: "pointer", fontSize: 9
                    }}>💥</button>
                </div>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Force Field</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 3 }}>
                  {Object.entries(FORCE_FIELD_TYPES).map(([k, v]) => (
                    <button key={k} onClick={() => setForceFieldType(k)}
                      title={v.label}
                      style={{
                        padding: "2px 5px", background: forceFieldType === k ? "#4488ff" : "#1a1f2e",
                        border: "none", color: forceFieldType === k ? "#fff" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 9
                      }}>
                      {v.icon}
                    </button>
                  ))}
                </div>
                <button onClick={handleAddForceField}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  + Add Force Field
                </button>
                {gpuParticleStats && (
                  <div style={{ color: "#555", fontSize: 8, lineHeight: 1.6 }}>
                    Active: {gpuParticleStats.active}/{gpuParticleStats.max}<br />
                    Usage: {gpuParticleStats.usage}<br />
                    Fields: {gpuParticleStats.fields}<br />
                    {gpuRunning && <span style={{ color: "#00ffc8" }}>● GPU Running</span>}
                  </div>
                )}
              </div>
            )}

            {/* Hair Styles */}
            {showHairStylePanel && (
              <div style={{ borderTop: showGPUPanel ? "1px solid #3a3a3a" : "none", paddingTop: showGPUPanel ? 8 : 0, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Hair Styles</div>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Density Map</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {["full", "gradient", "center", "parting", "thinning"].map(p => (
                    <button key={p} onClick={() => setDensityPattern(p)}
                      style={{
                        padding: "2px 4px", background: densityPattern === p ? "#00ffc8" : "#1a1f2e",
                        border: "none", color: densityPattern === p ? "#06060f" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
                <button onClick={handleEmitHairFromUV}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  💇 Emit from UV
                </button>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Presets</div>
                {["braid", "bun", "ponytail"].map(s => (
                  <button key={s} onClick={() => handleGenerateHairStyle(s)}
                    style={{
                      width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                      color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 2, textTransform: "capitalize"
                    }}>
                    {s === "braid" ? "🪢" : s === "bun" ? "🔵" : "🐴"} {s}
                  </button>
                ))}
              </div>
            )}

            {/* Animation Upgrades */}
            {showAnimUpPanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Anim Upgrades</div>
                <button onClick={handleCreateIKFKBlend}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  Create IK/FK Blend
                </button>
                {ikfkBlend && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                      <span style={{ color: "#555", fontSize: 8 }}>FK</span>
                      <span style={{ color: "#00ffc8", fontSize: 8 }}>{ikfkValue.toFixed(2)}</span>
                      <span style={{ color: "#555", fontSize: 8 }}>IK</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.01} value={ikfkValue}
                      onChange={e => handleSetIKFKBlend(Number(e.target.value))} style={{ width: "100%" }} />
                  </div>
                )}
                <button onClick={handleUpdateShapeKeyDrivers}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  Update SK Drivers
                </button>
                <button onClick={handleComputeEnvelopeWeights}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  Compute Envelope Weights
                </button>
                <button onClick={handleUpgradeCloth}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  Upgrade Cloth Constraints
                </button>
                {useUpgradedCloth && (
                  <button onClick={handleStartUpgradedCloth}
                    style={{
                      width: "100%", padding: "4px", background: "#4488ff", border: "none",
                      color: "#fff", borderRadius: 3, cursor: "pointer", fontSize: 8
                    }}>
                    ▶ Start Upgraded Cloth
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions 122-130: Collaboration + Desktop panel */}
      {(showCollabPanel || showDesktopPanel) && (
        <div style={{
          width: 210, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Collab + Desktop
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

            {/* Collaboration — Sessions 122-124 */}
            {showCollabPanel && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Collaboration</div>
                {!collabSession ? (
                  <button onClick={handleCreateCollabSession}
                    style={{
                      width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                      borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                    }}>
                    🔗 Start Session
                  </button>
                ) : (
                  <>
                    <div style={{ color: "#00ffc8", fontSize: 8, marginBottom: 4 }}>
                      Session: {collabSession.id.slice(0, 8)}...<br />
                      Users online: {collabUsers.length + 1}
                    </div>
                    {collabUsers.map(u => (
                      <div key={u.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: u.color, flexShrink: 0 }} />
                        <span style={{ color: "#dde6ef", fontSize: 8 }}>{u.name}</span>
                      </div>
                    ))}
                    <button onClick={handleDisconnectCollab}
                      style={{
                        width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                        color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginTop: 4, marginBottom: 6
                      }}>
                      Disconnect
                    </button>
                  </>
                )}
                <div style={{ color: "#FF6600", fontSize: 8, fontWeight: 700, marginBottom: 3, textTransform: "uppercase" }}>Comments</div>
                <input value={commentText} onChange={e => setCommentText(e.target.value)}
                  placeholder="Add comment..."
                  style={{
                    width: "100%", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#dde6ef", borderRadius: 3, padding: "4px", fontSize: 8, marginBottom: 3,
                    fontFamily: "JetBrains Mono,monospace"
                  }} />
                <button onClick={handleAddComment} disabled={!collabSession}
                  style={{
                    width: "100%", padding: "4px", background: collabSession ? "#ffaa00" : "#333",
                    border: "none", color: collabSession ? "#06060f" : "#555",
                    borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 6
                  }}>
                  📌 Pin Comment
                </button>
                {commentPins.length > 0 && (
                  <div style={{ maxHeight: 80, overflowY: "auto" }}>
                    {commentPins.map(p => (
                      <div key={p.id} style={{
                        padding: "2px 4px", background: "#1a1f2e",
                        border: "1px solid #3a3a3a", borderRadius: 3, marginBottom: 2
                      }}>
                        <div style={{ color: "#ffaa00", fontSize: 7 }}>{p.author}</div>
                        <div style={{ color: "#dde6ef", fontSize: 8 }}>{p.text}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ color: "#FF6600", fontSize: 8, fontWeight: 700, marginBottom: 3, textTransform: "uppercase", marginTop: 6 }}>Version History</div>
                <button onClick={handleSaveVersion}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  💾 Save Version
                </button>
                <div style={{ maxHeight: 100, overflowY: "auto" }}>
                  {versionHistory.map((v, i) => (
                    <div key={v.id} style={{
                      padding: "2px 6px", background: "#1a1f2e",
                      border: "1px solid #3a3a3a", borderRadius: 3, marginBottom: 2,
                      display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer"
                    }}
                      onClick={() => handleRestoreVersion(v.id)}>
                      <span style={{ color: "#8844ff", fontSize: 7 }}>v{i + 1}</span>
                      <span style={{ color: "#dde6ef", fontSize: 7 }}>{v.message}</span>
                    </div>
                  ))}
                  {versionHistory.length === 0 && <div style={{ color: "#555", fontSize: 8 }}>No versions saved</div>}
                </div>
              </div>
            )}

            {/* Desktop — Sessions 125-130 */}
            {showDesktopPanel && (
              <div style={{ borderTop: showCollabPanel ? "1px solid #3a3a3a" : "none", paddingTop: showCollabPanel ? 8 : 0 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Desktop App</div>
                <div style={{
                  padding: "4px 6px", background: "#1a1f2e", borderRadius: 3, marginBottom: 6,
                  border: `1px solid ${isElectron() ? "#00ffc8" : "#FF6600"}`
                }}>
                  <span style={{ color: isElectron() ? "#00ffc8" : "#FF6600", fontSize: 8, fontWeight: 700 }}>
                    {isElectron() ? "🖥 Electron Desktop" : "🌐 Browser Mode"}
                  </span>
                </div>
                <button onClick={handleNativeOpen}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                  }}>
                  📂 Open File
                </button>
                <button onClick={handleNativeSave}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  💾 Save Scene
                </button>
                <button onClick={handleGetPlatformInfo}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  ℹ Platform Info
                </button>
                <button onClick={handleCheckUpdates}
                  style={{
                    width: "100%", padding: "4px",
                    background: updateAvailable ? "#FF6600" : "#1a1f2e",
                    border: "1px solid #3a3a3a",
                    color: updateAvailable ? "#fff" : "#aaa",
                    borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 6
                  }}>
                  {updateAvailable ? "⬆ Update Available!" : "🔄 Check Updates"}
                </button>
                {platformInfo && (
                  <div style={{ color: "#555", fontSize: 8, lineHeight: 1.6 }}>
                    Platform: {platformInfo.platform}<br />
                    WebGL2: {platformInfo.webGL ? "✓" : "✗"}<br />
                    Memory: {platformInfo.memory}GB<br />
                    Cores: {platformInfo.cores}<br />
                    Version: {platformInfo.appVersion}
                  </div>
                )}
                <div style={{ color: "#555", fontSize: 8, marginTop: 6 }}>Keyboard Shortcuts</div>
                <div style={{ maxHeight: 80, overflowY: "auto", marginTop: 3 }}>
                  {Object.entries(KEYBOARD_SHORTCUTS).slice(0, 8).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                      <span style={{ color: "#4488ff", fontSize: 7, fontFamily: "monospace" }}>{k}</span>
                      <span style={{ color: "#555", fontSize: 7 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions 108-121: VFX + Fluid + Asset + Performance panel */}
      {(showVFXPanel || showFluidPanel || showAssetPanel || showPerfPanel) && (
        <div style={{
          width: 210, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              VFX + Assets
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

            {/* VFX — Sessions 108-115 */}
            {showVFXPanel && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>VFX Particles</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(VFX_PRESETS).map(([k, v]) => (
                    <button key={k} onClick={() => setVfxPreset(k)}
                      style={{
                        padding: "2px 4px", background: vfxPreset === k ? "#FF6600" : "#1a1f2e",
                        border: "none", color: vfxPreset === k ? "#fff" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleCreateVFXEmitter}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                  }}>
                  ✦ Create Emitter
                </button>
                <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                  <button onClick={handleStartVFX} disabled={vfxRunning}
                    style={{
                      flex: 1, padding: "4px", background: vfxRunning ? "#555" : "#FF6600",
                      border: "none", color: "#fff", borderRadius: 3, cursor: "pointer", fontSize: 9
                    }}>
                    ▶ Start
                  </button>
                  <button onClick={handleStopVFX}
                    style={{
                      flex: 1, padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                      color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9
                    }}>
                    ■ Stop
                  </button>
                </div>
                <button onClick={handleDestructMesh}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  💥 Destruct Mesh
                </button>
                <div style={{ color: "#555", fontSize: 8, lineHeight: 1.6 }}>
                  Emitters: {vfxEmitters.length}<br />
                  Particles: {vfxEmitters.reduce((s, e) => s + e.particles.length, 0)}<br />
                  Fragments: {destFrags.length}<br />
                  {vfxRunning && <span style={{ color: "#00ffc8" }}>● Running</span>}
                </div>
              </div>
            )}

            {/* Fluid — Sessions 108 */}
            {showFluidPanel && (
              <div style={{ borderTop: showVFXPanel ? "1px solid #3a3a3a" : "none", paddingTop: showVFXPanel ? 8 : 0, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Fluid + Pyro</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(FLUID_PRESETS).map(([k, v]) => (
                    <button key={k} onClick={() => setFluidPreset(k)}
                      style={{
                        padding: "2px 4px", background: fluidPreset === k ? "#4488ff" : "#1a1f2e",
                        border: "none", color: fluidPreset === k ? "#fff" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleCreateFluid}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                  }}>
                  💧 Create Fluid
                </button>
                <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                  <button onClick={handleStartFluid} disabled={fluidRunning}
                    style={{
                      flex: 1, padding: "4px", background: fluidRunning ? "#555" : "#4488ff",
                      border: "none", color: "#fff", borderRadius: 3, cursor: "pointer", fontSize: 9
                    }}>
                    ▶ Start
                  </button>
                  <button onClick={handleStopFluid}
                    style={{
                      flex: 1, padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                      color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9
                    }}>
                    ■ Stop
                  </button>
                </div>
                <button onClick={handleCreatePyro}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  🔥 Create Pyro/Fire
                </button>
                {fluidSim && (
                  <div style={{ color: "#555", fontSize: 8 }}>
                    Particles: {getFluidStats(fluidSim).particles}/{getFluidStats(fluidSim).max}<br />
                    {fluidRunning && <span style={{ color: "#4488ff" }}>● Simulating</span>}
                  </div>
                )}
              </div>
            )}

            {/* Asset Library — Sessions 116-119 */}
            {showAssetPanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Asset Library</div>
                <input value={assetSearch} onChange={e => handleSearchAssets(e.target.value)}
                  placeholder="Search assets..."
                  style={{
                    width: "100%", background: "#333333", border: "1px solid #3a3a3a", color: "#dde6ef",
                    borderRadius: 3, padding: "4px", fontSize: 9, marginBottom: 4,
                    fontFamily: "JetBrains Mono,monospace"
                  }} />
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(ASSET_TYPES).map(([k, v]) => (
                    <button key={k} onClick={() => setAssetTypeFilter(assetTypeFilter === k ? null : k)}
                      title={v.label}
                      style={{
                        padding: "2px 5px", background: assetTypeFilter === k ? v.color : "#1a1f2e",
                        border: "none", color: assetTypeFilter === k ? "#06060f" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 9
                      }}>
                      {v.icon}
                    </button>
                  ))}
                </div>
                <button onClick={handleSaveToLibrary}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  + Save to Library
                </button>
                <div style={{ maxHeight: 120, overflowY: "auto" }}>
                  {searchAssets(assetLibrary, assetSearch, { type: assetTypeFilter }).map(a => (
                    <div key={a.id} style={{
                      padding: "3px 6px", background: "#1a1f2e",
                      border: "1px solid #3a3a3a", borderRadius: 3, marginBottom: 2,
                      display: "flex", justifyContent: "space-between", alignItems: "center"
                    }}>
                      <div>
                        <span style={{ color: ASSET_TYPES[a.type]?.color || "#aaa", fontSize: 8 }}>{ASSET_TYPES[a.type]?.icon} </span>
                        <span style={{ color: "#dde6ef", fontSize: 8 }}>{a.name}</span>
                      </div>
                      <button onClick={() => { removeAsset(assetLibrary, a.id); setAssetLibrary({ ...assetLibrary }); }}
                        style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 9 }}>✕</button>
                    </div>
                  ))}
                  {assetLibrary.assets.length === 0 && (
                    <div style={{ color: "#555", fontSize: 8 }}>No assets — save meshes, materials, etc.</div>
                  )}
                </div>
              </div>
            )}

            {/* Performance + Procedural — Sessions 120-121 */}
            {showPerfPanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Performance</div>
                <button onClick={handleGetSceneStats}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  📊 Scene Stats
                </button>
                <button onClick={handleOptimizeScene}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 6
                  }}>
                  ⚡ Optimize Scene
                </button>
                {sceneStats && (
                  <div style={{ color: "#555", fontSize: 8, lineHeight: 1.6, marginBottom: 6 }}>
                    Meshes: {sceneStats.meshes}<br />
                    Triangles: {sceneStats.triangles}<br />
                    Vertices: {sceneStats.vertices}<br />
                    Lights: {sceneStats.lights}<br />
                    Materials: {sceneStats.materials}<br />
                    {sceneStats.culled !== undefined && <>Culled: {sceneStats.culled}<br /></>}
                  </div>
                )}
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Procedural Anim</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(PROCEDURAL_ANIMATIONS).map(([k, v]) => (
                    <button key={k} onClick={() => setProcAnimKey(k)}
                      title={v.label2}
                      style={{
                        padding: "2px 4px", background: procAnimKey === k ? "#8844ff" : "#1a1f2e",
                        border: "none", color: procAnimKey === k ? "#fff" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleToggleProcAnim}
                  style={{
                    width: "100%", padding: "5px",
                    background: procAnimEnabled ? "#FF6600" : "#00ffc8", border: "none",
                    color: procAnimEnabled ? "#fff" : "#06060f",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700
                  }}>
                  {procAnimEnabled ? "■ Stop" : "▶ Start"} Proc Anim
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions 91-107: Rendering panel */}
      {showUDIMPanel && (
        <div style={{position:'fixed',top:40,right:220,width:200,background:'#0d1117',
          border:'1px solid #3a3a3a',borderRadius:4,padding:8,zIndex:100,overflowY:'auto',maxHeight:'70vh'}}>
          <div style={{color:'#00ffc8',fontSize:9,fontWeight:700,marginBottom:6}}>UDIM TEXTURES</div>
          <div style={{marginBottom:4}}>
            <span style={{color:'#888',fontSize:8}}>Tile Count</span>
            <select value={udimTileCount} onChange={e=>setUdimTileCount(Number(e.target.value))}
              style={{width:'100%',background:'#0d1117',border:'1px solid #3a3a3a',color:'#dde6ef',fontSize:8,padding:2,marginTop:2}}>
              {[1,2,4,6,8,10,16,20].map(n=><option key={n} value={n}>{n} tile{n>1?'s':''}</option>)}
            </select>
          </div>
          <button onClick={handleInitUDIM} style={{width:'100%',padding:'4px',
            background:udimLayout?'#003322':'#1a1f2e',
            border:'1px solid '+(udimLayout?'#00ffc8':'#21262d'),
            color:udimLayout?'#00ffc8':'#aaa',borderRadius:3,cursor:'pointer',fontSize:8,marginBottom:3}}>
            {udimLayout ? 'Re-Init Layout' : 'Init UDIM Layout'}
          </button>
          {udimLayout && (<>
            <div style={{marginBottom:4}}>
              <span style={{color:'#888',fontSize:8}}>Active Tile</span>
              <select value={udimActiveTile} onChange={e=>setUdimActiveTile(Number(e.target.value))}
                style={{width:'100%',background:'#0d1117',border:'1px solid #3a3a3a',color:'#dde6ef',fontSize:8,padding:2,marginTop:2}}>
                {udimLayout.tiles.map(t=><option key={t.id} value={t.id}>UDIM {t.id}</option>)}
              </select>
            </div>
            <div style={{marginBottom:4}}>
              <span style={{color:'#888',fontSize:8}}>Paint Color</span>
              <input type='color' value={udimPaintColor} onChange={e=>setUdimPaintColor(e.target.value)}
                style={{width:'100%',height:24,border:'none',background:'none',cursor:'pointer',marginTop:2}} />
            </div>
            <button onClick={handleFillUDIMTile} style={{width:'100%',padding:'4px',background:'#1a1f2e',
              border:'1px solid #3a3a3a',color:'#aaa',borderRadius:3,cursor:'pointer',fontSize:8,marginBottom:3}}>
              Fill Active Tile
            </button>
            <button onClick={handleApplyUDIMToMesh} style={{width:'100%',padding:'4px',background:'#1a1f2e',
              border:'1px solid #3a3a3a',color:'#aaa',borderRadius:3,cursor:'pointer',fontSize:8,marginBottom:3}}>
              Apply to Mesh
            </button>
            <button onClick={handleExportUDIMAtlas} style={{width:'100%',padding:'4px',background:'#1a1f2e',
              border:'1px solid #3a3a3a',color:'#FF6600',borderRadius:3,cursor:'pointer',fontSize:8,marginBottom:3}}>
              Export Atlas 4096px
            </button>
            <div style={{color:'#555',fontSize:7}}>Tiles: {getUDIMStats(udimLayout).initialized}/{getUDIMStats(udimLayout).tiles}</div>
          </>)}
        </div>
      )}
      {/* Pose Library Panel */}
      {showPoseLibPanel && (
        <div style={{
          position: "fixed", right: 48, top: 120, width: 180, zIndex: 120,
          background: "#0d1117", border: "1px solid #3a3a3a", borderRadius: 6,
          padding: 10, color: "#dde6ef"
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#8844ff", marginBottom: 8 }}>POSE LIBRARY</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            <input
              value={poseName}
              onChange={e => setPoseName(e.target.value)}
              placeholder="Pose name..."
              style={{
                flex: 1, background: "#161b22", border: "1px solid #3a3a3a",
                color: "#dde6ef", borderRadius: 3, padding: "3px 6px", fontSize: 9
              }}
            />
            <button
              onClick={() => {
                const arm = armatureRef?.current;
                if (!arm) { setStatus("No armature selected"); return; }
                const name = poseName || ("Pose_" + Object.keys(poseLibrary).length);
                setPoseLibrary(prev => savePoseToLibrary(arm, name, { ...prev }));
                setPoseName("");
                setStatus("Pose saved: " + name);
              }}
              style={{
                background: "#8844ff", border: "none", borderRadius: 3,
                color: "#fff", cursor: "pointer", fontSize: 9, padding: "3px 7px"
              }}
            >Save</button>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {Object.keys(poseLibrary).length === 0 && (
              <div style={{ color: "#555", fontSize: 9, textAlign: "center", padding: 8 }}>No poses saved yet</div>
            )}
            {Object.keys(poseLibrary).map(name => (
              <div key={name} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "3px 0", borderBottom: "1px solid #161b22"
              }}>
                <span style={{ fontSize: 9, color: "#dde6ef", flex: 1 }}>{name}</span>
                <button
                  onClick={() => {
                    const arm = armatureRef?.current;
                    if (arm) { loadPoseFromLibrary(arm, name, poseLibrary); setStatus("Pose applied: " + name); }
                  }}
                  style={{
                    background: "#333333", border: "1px solid #3a3a3a", borderRadius: 3,
                    color: "#8844ff", cursor: "pointer", fontSize: 8, padding: "2px 5px"
                  }}
                >Apply</button>
              </div>
            ))}
          </div>
          {Object.keys(poseLibrary).length > 0 && (
            <button
              onClick={() => setPoseLibrary({})}
              style={{
                width: "100%", marginTop: 6, padding: "3px", background: "#1a1f2e",
                border: "1px solid #3a3a3a", borderRadius: 3, color: "#555",
                cursor: "pointer", fontSize: 8
              }}
            >Clear All</button>
          )}
        </div>
      )}

      {showVideoPanel && (
        <div style={{
          position: "fixed", right: 8, top: 54, width: 220, background: "#0d1117",
          border: "1px solid #3a3a3a", borderRadius: 6, padding: 12, zIndex: 120
        }}>
          <div style={{ color: "#00ffc8", fontSize: 10, fontWeight: 700, marginBottom: 8 }}>🎬 Render Video</div>
          {[
            ["Start Frame", videoStartFrame, setVideoStartFrame, 0, 9999, 1],
            ["End Frame",   videoEndFrame,   setVideoEndFrame,   1, 9999, 1],
            ["FPS",         videoFps,        setVideoFps,        1, 60,   1],
            ["Width",       videoWidth,      setVideoWidth,      320, 3840, 1],
            ["Height",      videoHeight,     setVideoHeight,     240, 2160, 1],
          ].map(([label, val, setter, min, max, step]) => (
            <div key={label} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ color: "#8fa8bf", fontSize: 9 }}>{label}</span>
                <span style={{ color: "#00ffc8", fontSize: 9 }}>{val}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => setter(Number(e.target.value))}
                style={{ width: "100%" }} />
            </div>
          ))}
          <div style={{ color: "#555", fontSize: 8, marginBottom: 6 }}>
            {videoEndFrame - videoStartFrame + 1} frames @ {videoFps}fps = {((videoEndFrame - videoStartFrame + 1) / videoFps).toFixed(1)}s
            {" · "}{videoWidth}×{videoHeight}
          </div>
          {videoRendering && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ color: "#8fa8bf", fontSize: 9 }}>Progress</span>
                <span style={{ color: "#00ffc8", fontSize: 9 }}>{videoProgress}%</span>
              </div>
              <div style={{ background: "#21262d", borderRadius: 3, height: 6 }}>
                <div style={{ background: "#00ffc8", borderRadius: 3, height: 6, width: videoProgress + "%" }} />
              </div>
            </div>
          )}
          <button
            onClick={handleRenderVideo}
            disabled={videoRendering}
            style={{
              width: "100%", padding: "6px", borderRadius: 4, border: "none", cursor: videoRendering ? "not-allowed" : "pointer",
              background: videoRendering ? "#1a1f2e" : "linear-gradient(135deg, #FF6600, #ff8833)",
              color: videoRendering ? "#555" : "#fff", fontWeight: 700, fontSize: 10
            }}>
            {videoRendering ? "Rendering... " + videoProgress + "%" : "▶ Render Animation"}
          </button>
        </div>
      )}

      {(showRenderPanel || showVolPanel || showPassPanel || showProbePanel) && (
        <div style={{
          width: 210, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Rendering
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

            {/* Render Settings — Sessions 91-107 */}
            {showRenderPanel && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Render Settings</div>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Preset</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(RENDER_PRESETS).map(([k, v]) => (
                    <button key={k} onClick={() => setRenderPreset(k)}
                      style={{
                        padding: "2px 4px", background: renderPreset === k ? "#00ffc8" : "#1a1f2e",
                        border: "none", color: renderPreset === k ? "#06060f" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleApplyRenderPreset}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  Apply Preset
                </button>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Tone Mapping</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(TONE_MAP_MODES).map(([k, v]) => (
                    <button key={k} onClick={() => setToneMappingMode(k)}
                      style={{
                        padding: "2px 4px", background: toneMappingMode === k ? "#FF6600" : "#1a1f2e",
                        border: "none", color: toneMappingMode === k ? "#fff" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Exposure</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{toneExposure.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.1} max={5} step={0.05} value={toneExposure}
                    onChange={e => setToneExposure(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <button onClick={handleApplyToneMapping}
                  style={{
                    width: "100%", padding: "4px", background: "#8844ff", border: "none", color: "#fff",
                    borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  Apply Tone Map
                </button>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Materials</div>
                <button onClick={handleApplyPBR}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 2
                  }}>
                  Apply PBR Material
                </button>
                <select value={sssPreset} onChange={e => setSssPreset(e.target.value)}
                  style={{ width: "100%", background: "#333333", border: "1px solid #3a3a3a", color: "#dde6ef", borderRadius: 3, padding: "3px", fontSize: 8, marginBottom: 2 }}>
                  {Object.entries(SSS_PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button onClick={handleApplySSS}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 2
                  }}>
                  Apply SSS
                </button>
                <select value={transmissionPreset} onChange={e => setTransmissionPreset(e.target.value)}
                  style={{ width: "100%", background: "#333333", border: "1px solid #3a3a3a", color: "#dde6ef", borderRadius: 3, padding: "3px", fontSize: 8, marginBottom: 2 }}>
                  {Object.entries(TRANSMISSION_PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button onClick={handleApplyTransmission}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  Apply Transmission
                </button>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Displacement</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 2 }}>
                  {["noise", "waves", "checkers", "gradient", "ridge"].map(p => (
                    <button key={p} onClick={() => setDispPattern(p)}
                      style={{
                        padding: "2px 4px", background: dispPattern === p ? "#4488ff" : "#1a1f2e",
                        border: "none", color: dispPattern === p ? "#fff" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
                <input type="range" min={0.01} max={1} step={0.01} value={dispScale}
                  onChange={e => setDispScale(Number(e.target.value))} style={{ width: "100%", marginBottom: 2 }} />
                <button onClick={handleApplyDisplacement}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  Apply Displacement
                </button>
                <button onClick={handleCaptureFrame}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  📷 Capture Frame
                </button>
                <button onClick={handleGetRenderStats}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8
                  }}>
                  📊 Render Stats
                </button>
                {renderStats && (
                  <div style={{ color: "#555", fontSize: 8, lineHeight: 1.6, marginTop: 4 }}>
                    Draw calls: {renderStats.drawCalls}<br />
                    Triangles: {renderStats.triangles}<br />
                    Textures: {renderStats.textures}
                  </div>
                )}
              </div>
            )}

            {/* Volumetric — Sessions 100-101 */}
            {showVolPanel && (
              <div style={{ borderTop: showRenderPanel ? "1px solid #3a3a3a" : "none", paddingTop: showRenderPanel ? 8 : 0, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Volumetric</div>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 4 }}>
                  <input type="checkbox" checked={volumetricSettings.enabled} onChange={handleToggleVolumetric} />
                  <span style={{ color: volumetricSettings.enabled ? "#00ffc8" : "#666", fontSize: 9, fontWeight: 700 }}>
                    {volumetricSettings.enabled ? "Volumetric ON" : "Volumetric OFF"}
                  </span>
                </label>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Atmosphere</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(ATMOSPHERE_PRESETS).map(([k, v]) => (
                    <button key={k} onClick={() => setAtmospherePreset(k)}
                      style={{
                        padding: "2px 4px", background: atmospherePreset === k ? "#00ffc8" : "#1a1f2e",
                        border: "none", color: atmospherePreset === k ? "#06060f" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleApplyAtmosphere}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700
                  }}>
                  Apply Atmosphere
                </button>
              </div>
            )}

            {/* Render Passes — Sessions 96, 101-103 */}
            {showPassPanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Render Passes</div>
                {Object.entries(PASS_TYPES).map(([k, v]) => (
                  <label key={k} style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 2 }}>
                    <input type="checkbox"
                      checked={passStack.passes.find(p => p.type === k)?.enabled || false}
                      onChange={e => setPassStack(prev => ({ ...prev, passes: prev.passes.map(p => p.type === k ? { ...p, enabled: e.target.checked } : p) }))} />
                    <span style={{ color: v.color, fontSize: 8 }}>{v.label}</span>
                    {passResults[k] && (
                      <button onClick={() => handleDownloadPass(k)}
                        style={{
                          marginLeft: "auto", padding: "1px 4px", background: "none", border: "none",
                          color: "#555", cursor: "pointer", fontSize: 9
                        }}>↓</button>
                    )}
                  </label>
                ))}
                <button onClick={handleRenderPasses}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginTop: 6
                  }}>
                  ▶ Render All Passes
                </button>
              </div>
            )}

            {/* Environment Probes — Sessions 102-103 */}
            {showProbePanel && (
              <div style={{padding:'8px 0',borderBottom:'1px solid #3a3a3a',marginBottom:6}}>
                <div style={{color:'#00ffc8',fontSize:9,fontWeight:700,marginBottom:6}}>GI / ENVIRONMENT PROBES</div>
                <div style={{marginBottom:4}}>
                  <span style={{color:'#888',fontSize:8}}>Bake Resolution</span>
                  <select value={giResolution} onChange={e=>setGiResolution(Number(e.target.value))}
                    style={{width:'100%',background:'#0d1117',border:'1px solid #3a3a3a',color:'#dde6ef',fontSize:8,padding:2,marginTop:2}}>
                    <option value={64}>64 (fast)</option>
                    <option value={128}>128</option>
                    <option value={256}>256 (default)</option>
                    <option value={512}>512 (high)</option>
                  </select>
                </div>
                <button onClick={handleBakeGI} style={{width:'100%',padding:'4px',
                  background:giBaked?'#003322':'#1a1f2e',
                  border:'1px solid '+(giBaked?'#00ffc8':'#21262d'),
                  color:giBaked?'#00ffc8':'#aaa',borderRadius:3,cursor:'pointer',fontSize:8,marginBottom:3}}>
                  {giBaked ? 'Rebake GI' : 'Bake GI Probe'}
                </button>
                <button onClick={handleCreateReflectionProbe} style={{width:'100%',padding:'4px',
                  background:'#1a1f2e',border:'1px solid #3a3a3a',color:'#aaa',
                  borderRadius:3,cursor:'pointer',fontSize:8,marginBottom:3}}>
                  Add Reflection Probe
                </button>
                <div style={{color:'#555',fontSize:7}}>Probes: {giProbes.length}</div>
              </div>
            )}
            {showProbePanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Environment Probes</div>
                <button onClick={handleAddProbe}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                  }}>
                  + Reflection Probe
                </button>
                <button onClick={handleAddAmbientProbe}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  + Ambient (GI) Probe
                </button>
                <div style={{ color: "#555", fontSize: 8 }}>Probes: {probes.length}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions 78-90: Hair + Cloth panel */}
      {(showHairPanel || showClothPanel) && (
        <div style={{
          width: 210, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Hair + Cloth
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

            {/* Hair — Sessions 78-87 */}
            {showHairPanel && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Hair System</div>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Preset</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(HAIR_PRESETS).map(([k, v]) => (
                    <button key={k} onClick={() => setHairPreset(k)}
                      style={{
                        padding: "2px 4px", background: hairPreset === k ? "#00ffc8" : "#1a1f2e",
                        border: "none", color: hairPreset === k ? "#06060f" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                  {["lines", "tubes"].map(m => (
                    <button key={m} onClick={() => setHairDisplayMode(m)}
                      style={{
                        flex: 1, padding: "3px", border: "none", borderRadius: 3, cursor: "pointer",
                        fontSize: 8, fontWeight: 700,
                        background: hairDisplayMode === m ? "#FF6600" : "#1a1f2e",
                        color: hairDisplayMode === m ? "#fff" : "#666"
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
                <button onClick={handleEmitHair}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  💇 Emit Hair
                </button>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Groom Brush</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(GROOM_BRUSHES).map(([k, v]) => (
                    <button key={k} onClick={() => setHairGroomBrush(k)}
                      title={v.description}
                      style={{
                        padding: "2px 5px", background: hairGroomBrush === k ? "#8844ff" : "#1a1f2e",
                        border: "none", color: hairGroomBrush === k ? "#fff" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 8
                      }}>
                      {v.icon}
                    </button>
                  ))}
                </div>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Shader</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(HAIR_SHADER_PRESETS).map(([k, v]) => (
                    <button key={k} onClick={() => setHairShaderPreset(k)}
                      style={{
                        padding: "2px 4px", background: hairShaderPreset === k ? "#FF6600" : "#1a1f2e",
                        border: "none", color: hairShaderPreset === k ? "#fff" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleGenerateHairCards}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  🃏 Generate Hair Cards
                </button>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 4 }}>
                  <input type="checkbox" checked={hairPhysSettings.enabled} onChange={handleToggleHairPhysics} />
                  <span style={{ color: hairPhysSettings.enabled ? "#00ffc8" : "#666", fontSize: 9 }}>Hair Physics</span>
                </label>
                <button onClick={handleResetHair}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  ↺ Reset Hair
                </button>
                <div style={{ color: "#555", fontSize: 8 }}>Strands: {hairStrands.length}</div>
              </div>
            )}

            {/* Cloth — Sessions 88-90 */}
            {showClothPanel && (
              <div style={{ borderTop: showHairPanel ? "1px solid #3a3a3a" : "none", paddingTop: showHairPanel ? 8 : 0 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Cloth Simulation</div>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Preset</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(CLOTH_PRESETS).map(([k, v]) => (
                    <button key={k} onClick={() => setClothPreset(k)}
                      style={{
                        padding: "2px 4px", background: clothPreset === k ? "#00ffc8" : "#1a1f2e",
                        border: "none", color: clothPreset === k ? "#06060f" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleCreateCloth}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                  }}>
                  🧵 Create Cloth
                </button>
                <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                  <button onClick={handleStartCloth} disabled={clothRunning}
                    style={{
                      flex: 1, padding: "4px", background: clothRunning ? "#555" : "#FF6600",
                      border: "none", color: "#fff", borderRadius: 3, cursor: "pointer", fontSize: 9
                    }}>
                    ▶ Start
                  </button>
                  <button onClick={handleStopCloth}
                    style={{
                      flex: 1, padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                      color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9
                    }}>
                    ■ Stop
                  </button>
                  <button onClick={handleResetCloth}
                    style={{
                      flex: 1, padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                      color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9
                    }}>
                    ↺
                  </button>
                </div>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 4 }}>
                  <input type="checkbox" checked={clothSelfCol} onChange={e => setClothSelfCol(e.target.checked)} />
                  <span style={{ color: "#c8c8c8", fontSize: 9 }}>Self Collision</span>
                </label>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 4 }}>
                  <input type="checkbox" checked={clothPinMode} onChange={e => setClothPinMode(e.target.checked)} />
                  <span style={{ color: "#c8c8c8", fontSize: 9 }}>Pin Mode</span>
                </label>
                <button onClick={handleAddClothCollider}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 4
                  }}>
                  + Add Collider
                </button>
                {clothSim && (
                  <div style={{ color: "#555", fontSize: 8, lineHeight: 1.6 }}>
                    Particles: {getClothStats(clothSim).particles}<br />
                    Constraints: {getClothStats(clothSim).constraints}<br />
                    Pinned: {getClothStats(clothSim).pinned}<br />
                    Colliders: {clothColliders.length}<br />
                    {clothRunning && <span style={{ color: "#00ffc8" }}>● Simulating</span>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions 71-77: DynaMesh + AutoRetopo + Fibermesh panel */}
      {(showDynaPanel || showRetopoPanel || showFiberPanel) && (
        <div style={{
          width: 200, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              ZBrush Tools
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

            {/* DynaMesh — Sessions 71-72 */}
            {showDynaPanel && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>DynaMesh</div>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 4 }}>
                  <input type="checkbox" checked={dynaMeshSettings.enabled}
                    onChange={handleToggleDynaMesh} />
                  <span style={{ color: dynaMeshSettings.enabled ? "#00ffc8" : "#666", fontSize: 9, fontWeight: 700 }}>
                    {dynaMeshSettings.enabled ? "DynaMesh ON" : "DynaMesh OFF"}
                  </span>
                </label>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Resolution</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{dynaMeshSettings.resolution}</span>
                  </div>
                  <input type="range" min={32} max={512} step={32} value={dynaMeshSettings.resolution}
                    onChange={e => setDynaMeshSettings(p => ({ ...p, resolution: Number(e.target.value) }))}
                    style={{ width: "100%" }} />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Smooth</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{dynaMeshSettings.smooth}</span>
                  </div>
                  <input type="range" min={0} max={5} step={1} value={dynaMeshSettings.smooth}
                    onChange={e => setDynaMeshSettings(p => ({ ...p, smooth: Number(e.target.value) }))}
                    style={{ width: "100%" }} />
                </div>
                <button onClick={handleDynaMeshRemesh}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  ⬡ DynaMesh Remesh
                </button>
                {dynaMeshStats && (
                  <div style={{ color: "#555", fontSize: 8, lineHeight: 1.6 }}>
                    {dynaMeshStats.vertices}v / {dynaMeshStats.triangles}t<br />
                    Size: {dynaMeshStats.meshSize}
                  </div>
                )}
              </div>
            )}

            {/* Auto-Retopo — Sessions 75-76 */}
            {showRetopoPanel && (
              <div style={{ borderTop: showDynaPanel ? "1px solid #3a3a3a" : "none", paddingTop: showDynaPanel ? 8 : 0, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Auto-Retopo</div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Target Faces</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{retopoSettings.targetFaces}</span>
                  </div>
                  <input type="range" min={100} max={10000} step={100} value={retopoSettings.targetFaces}
                    onChange={e => setRetopoSettings(p => ({ ...p, targetFaces: Number(e.target.value) }))}
                    style={{ width: "100%" }} />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Hard Edge Angle</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{retopoSettings.hardAngle}°</span>
                  </div>
                  <input type="range" min={15} max={90} step={5} value={retopoSettings.hardAngle}
                    onChange={e => setRetopoSettings(p => ({ ...p, hardAngle: Number(e.target.value) }))}
                    style={{ width: "100%" }} />
                </div>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 6 }}>
                  <input type="checkbox" checked={retopoSettings.preserveHard}
                    onChange={e => setRetopoSettings(p => ({ ...p, preserveHard: e.target.checked }))} />
                  <span style={{ color: "#c8c8c8", fontSize: 9 }}>Preserve Hard Edges</span>
                </label>
                <button onClick={handleAutoRetopo}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                  }}>
                  ⬡ Auto-Retopo
                </button>
                {retopoStats && (
                  <>
                    <div style={{ color: "#00ffc8", fontSize: 8, lineHeight: 1.6, marginBottom: 4 }}>
                      {retopoStats.originalFaces}f → {retopoStats.retopoFaces}f ({retopoStats.reductionRatio})
                    </div>
                    <button onClick={handleApplyRetopo}
                      style={{
                        width: "100%", padding: "4px", background: "#FF6600", border: "none", color: "#fff",
                        borderRadius: 3, cursor: "pointer", fontSize: 9
                      }}>
                      Apply Retopo
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Fibermesh — Session 77 */}
            {showFiberPanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Fibermesh</div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Density</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{fiberDensity.toFixed(1)}</span>
                  </div>
                  <input type="range" min={0.1} max={3} step={0.1} value={fiberDensity}
                    onChange={e => setFiberDensity(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Length</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{fiberLength.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.05} max={2} step={0.05} value={fiberLength}
                    onChange={e => setFiberLength(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                  {["lines", "tubes"].map(m => (
                    <button key={m} onClick={() => setFiberMode(m)}
                      style={{
                        flex: 1, padding: "3px", border: "none", borderRadius: 3, cursor: "pointer",
                        fontSize: 8, fontWeight: 700,
                        background: fiberMode === m ? "#FF6600" : "#1a1f2e",
                        color: fiberMode === m ? "#fff" : "#666"
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
                <button onClick={handleGenerateFibermesh}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 6
                  }}>
                  ✦ Generate Fibermesh
                </button>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 4 }}>Brush</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {["comb", "length", "clump", "puff", "smooth"].map(b => (
                    <button key={b} onClick={() => setFiberBrush(b)}
                      style={{
                        padding: "2px 5px", background: fiberBrush === b ? "#8844ff" : "#1a1f2e",
                        border: "none", color: fiberBrush === b ? "#fff" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 8
                      }}>
                      {b}
                    </button>
                  ))}
                </div>
                <div style={{ color: "#555", fontSize: 8 }}>
                  Strands: {fiberStrands.length}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions 63-70: Drivers + Constraints + Physics + Walk panel */}
      {(showDriverPanel || showConPanel || showPhysPanel || showWalkPanel) && (
        <div style={{
          width: 200, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Animation Systems
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

            {/* Drivers — Session 64 */}
            {showDriverPanel && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Drivers</div>
                <input value={driverExpr} onChange={e => setDriverExpr(e.target.value)}
                  style={{
                    width: "100%", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#00ffc8", borderRadius: 3, padding: "4px", fontSize: 9, marginBottom: 4,
                    fontFamily: "JetBrains Mono,monospace"
                  }}
                  placeholder="sin(frame * 0.1)" />
                <button onClick={handleAddDriver}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  + Add Driver
                </button>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Presets</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(DRIVER_PRESETS).map(([k, v]) => (
                    <button key={k} onClick={() => handleApplyDriverPreset(k)}
                      style={{
                        padding: "2px 4px", background: "#333333", border: "1px solid #3a3a3a",
                        color: "#8844ff", borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
                <button onClick={handleEvalDrivers}
                  style={{
                    width: "100%", padding: "4px", background: "#8844ff", border: "none", color: "#fff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, marginBottom: 4
                  }}>
                  ▶ Evaluate All
                </button>
                {drivers.map(d => (
                  <div key={d.id} style={{
                    padding: "3px 6px", background: "#1a1f2e",
                    border: `1px solid ${activeDriverId === d.id ? "#8844ff" : "#21262d"}`,
                    borderRadius: 3, marginBottom: 3, cursor: "pointer"
                  }}
                    onClick={() => setActiveDriverId(d.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#8844ff", fontSize: 8 }}>{d.name}</span>
                      <button onClick={e => { e.stopPropagation(); handleRemoveDriver(d.id); }}
                        style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 9 }}>✕</button>
                    </div>
                    <span style={{ color: "#555", fontSize: 7, fontFamily: "monospace" }}>{d.expression}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Constraints — Session 65 */}
            {showConPanel && (
              <div style={{ borderTop: showDriverPanel ? "1px solid #3a3a3a" : "none", paddingTop: showDriverPanel ? 8 : 0, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Constraints</div>
                <select value={constraintType} onChange={e => setConstraintType(e.target.value)}
                  style={{
                    width: "100%", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#dde6ef", borderRadius: 3, padding: "4px", fontSize: 9, marginBottom: 4
                  }}>
                  {Object.entries(CONSTRAINT_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
                <button onClick={handleAddConstraint}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  + Add Constraint
                </button>
                <button onClick={handleApplyConstraints}
                  style={{
                    width: "100%", padding: "4px", background: "#FF6600", border: "none", color: "#fff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, marginBottom: 4
                  }}>
                  ▶ Apply All
                </button>
                {constraints.map(c => (
                  <div key={c.id} style={{
                    padding: "3px 6px", background: "#1a1f2e",
                    border: "1px solid #3a3a3a", borderRadius: 3, marginBottom: 3,
                    display: "flex", justifyContent: "space-between", alignItems: "center"
                  }}>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>
                      {CONSTRAINT_TYPES[c.type]?.icon} {CONSTRAINT_TYPES[c.type]?.label}
                    </span>
                    <button onClick={() => handleRemoveConstraint(c.id)}
                      style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 9 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Physics Bake — Session 66 */}
            {showPhysPanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Physics</div>
                <button onClick={handleAddRigidBody}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  + Add Rigid Body
                </button>
                <button onClick={handleBakePhysics} disabled={physBaking}
                  style={{
                    width: "100%", padding: "4px", background: physBaking ? "#555" : "#FF6600",
                    border: "none", color: "#fff", borderRadius: 3, cursor: "pointer", fontSize: 9, marginBottom: 4
                  }}>
                  {physBaking ? "Baking..." : "▶ Bake Physics"}
                </button>
                <button onClick={handleFractureMesh}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9, marginBottom: 4
                  }}>
                  💥 Fracture Mesh
                </button>
                <div style={{ color: "#555", fontSize: 8, lineHeight: 1.6 }}>
                  Rigid Bodies: {rigidBodies.length}<br />
                  Fragments: {fragments.length}<br />
                  {bakedPhysics && "✓ Physics baked — 120 frames"}
                </div>
              </div>
            )}

            {/* Walk Cycle — Session 67 */}
            {showWalkPanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Walk Cycle</div>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Style</div>
                <select value={walkStyle} onChange={e => setWalkStyle(e.target.value)}
                  style={{
                    width: "100%", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#dde6ef", borderRadius: 3, padding: "4px", fontSize: 9, marginBottom: 4
                  }}>
                  {Object.entries(WALK_STYLES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Speed</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{walkSpeed.toFixed(1)}</span>
                  </div>
                  <input type="range" min={0.2} max={3} step={0.1} value={walkSpeed}
                    onChange={e => setWalkSpeed(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>Stride</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{walkStride.toFixed(1)}</span>
                  </div>
                  <input type="range" min={0.3} max={2} step={0.1} value={walkStride}
                    onChange={e => setWalkStride(Number(e.target.value))} style={{ width: "100%" }} />
                </div>
                <button onClick={handleGenerateWalkCycle}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                  }}>
                  🚶 Generate Walk
                </button>
                <button onClick={handleGenerateIdle}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  😐 Generate Idle
                </button>
                <button onClick={handleGenerateBreathing}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  🌬 Generate Breathing
                </button>
                {walkCycleData && (
                  <div style={{ color: "#00ffc8", fontSize: 8, marginTop: 4 }}>
                    ✓ {walkCycleData.type || walkCycleData.style} cycle — {walkCycleData.loopFrames} frames
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions 51-62: Light + Camera + Post + IK panel */}
      {(showLightPanel || showCamPanel || showPostPanel || showIKPanel) && (
        <div style={{
          width: 210, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Scene Tools
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

            {/* Lights — Sessions 51-52 */}
            {showLightPanel && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Lighting</div>
                <select value={lightType} onChange={e => setLightType(e.target.value)}
                  style={{
                    width: "100%", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#dde6ef", borderRadius: 3, padding: "4px", fontSize: 9, marginBottom: 4
                  }}>
                  {Object.entries(LIGHT_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
                <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4 }}>
                  <input type="color" value={lightColor} onChange={e => setLightColor(e.target.value)}
                    style={{ width: 24, height: 24, border: "none", borderRadius: 3, padding: 0, cursor: "pointer" }} />
                  <input type="range" min={0} max={5} step={0.1} value={lightIntensity}
                    onChange={e => setLightIntensity(Number(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ color: "#00ffc8", fontSize: 8, width: 24 }}>{lightIntensity.toFixed(1)}</span>
                </div>
                <button onClick={handleAddLight}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  + Add {lightType} Light
                </button>
                <button onClick={handleThreePointLighting}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 6
                  }}>
                  Three-Point Preset
                </button>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>Temperature</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {Object.entries(TEMPERATURE_PRESETS).map(([k, v]) => (
                    <button key={k} onClick={() => handleApplyTemperature(k)}
                      title={v.label + " " + v.kelvin + "K"}
                      style={{
                        width: 14, height: 14, borderRadius: 2, border: "none", cursor: "pointer",
                        background: v.color, outline: lightTemp === k ? "2px solid #fff" : "none"
                      }} />
                  ))}
                </div>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>HDRI</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                  {HDRI_PRESETS.map(p => (
                    <button key={p.id} onClick={() => handleApplyHDRI(p.id)}
                      title={p.label}
                      style={{
                        padding: "2px 4px", background: hdriPreset === p.id ? "#00ffc8" : "#1a1f2e",
                        border: "none", color: hdriPreset === p.id ? "#06060f" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 4 }}>
                  <input type="checkbox" checked={fogEnabled} onChange={handleToggleFog} />
                  <span style={{ color: "#c8c8c8", fontSize: 9 }}>Volumetric Fog</span>
                </label>
                {fogEnabled && (
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 2 }}>
                      <input type="color" value={fogColor} onChange={e => { setFogColor(e.target.value); }}
                        style={{ width: 20, height: 20, border: "none", padding: 0 }} />
                      <input type="range" min={0.001} max={0.1} step={0.001} value={fogDensity}
                        onChange={e => setFogDensity(Number(e.target.value))} style={{ flex: 1 }} />
                    </div>
                  </div>
                )}
                <div style={{ color: "#555", fontSize: 8 }}>Lights: {sceneLights.length}</div>
              </div>
            )}

            {/* Camera — Session 55 */}
            {showCamPanel && (
              <div style={{ borderTop: showLightPanel ? "1px solid #3a3a3a" : "none", paddingTop: showLightPanel ? 8 : 0, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Camera</div>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                    <span style={{ color: "#555", fontSize: 8 }}>FOV</span>
                    <span style={{ color: "#00ffc8", fontSize: 8 }}>{camFOV}°</span>
                  </div>
                  <input type="range" min={10} max={120} step={1} value={camFOV}
                    onChange={e => { setCamFOV(Number(e.target.value)); if (cameraRef.current) { cameraRef.current.fov = Number(e.target.value); cameraRef.current.updateProjectionMatrix(); } }}
                    style={{ width: "100%" }} />
                </div>
                <button onClick={handleAddCamera}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                  }}>
                  + Add Camera
                </button>
                <button onClick={handleSaveBookmark}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  📍 Save Bookmark
                </button>
                <button onClick={handleCameraShake}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                  }}>
                  📷 Camera Shake
                </button>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 4 }}>
                  <input type="checkbox" checked={camDOF} onChange={e => setCamDOF(e.target.checked)} />
                  <span style={{ color: "#c8c8c8", fontSize: 9 }}>Depth of Field</span>
                </label>
                {camDOF && (
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                      <span style={{ color: "#555", fontSize: 8 }}>Focus Distance</span>
                      <span style={{ color: "#00ffc8", fontSize: 8 }}>{camDOFFocus.toFixed(1)}m</span>
                    </div>
                    <input type="range" min={0.5} max={50} step={0.1} value={camDOFFocus}
                      onChange={e => setCamDOFFocus(Number(e.target.value))} style={{ width: "100%" }} />
                  </div>
                )}
                <div style={{ color: "#555", fontSize: 8 }}>Cameras: {cameras.length}</div>
              </div>
            )}

            {/* Post Processing — Session 56 */}
            {showPostPanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Post FX</div>
                {postEffects.map((effect, i) => (
                  <div key={effect.type} style={{
                    marginBottom: 4, padding: "4px 6px",
                    background: effect.enabled ? "#0a1a0a" : "#1a1f2e",
                    border: `1px solid ${effect.enabled ? "#00ffc8" : "#21262d"}`, borderRadius: 3
                  }}>
                    <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                      <input type="checkbox" checked={effect.enabled} onChange={() => handleToggleEffect(i)} />
                      <span style={{ color: effect.enabled ? "#00ffc8" : "#666", fontSize: 9, fontWeight: 700 }}>
                        {effect.type}
                      </span>
                    </label>
                  </div>
                ))}
                <div style={{ color: "#555", fontSize: 8, marginBottom: 2, marginTop: 4 }}>LUT</div>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {Object.entries(LUT_PRESETS).map(([k, v]) => (
                    <button key={k} onClick={() => setActiveLUT(k)}
                      style={{
                        padding: "2px 4px", background: activeLUT === k ? "#FF6600" : "#1a1f2e",
                        border: "none", color: activeLUT === k ? "#fff" : "#555",
                        borderRadius: 3, cursor: "pointer", fontSize: 7
                      }}>
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* IK — Session 61 */}
            {showIKPanel && (
              <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8 }}>
                <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Inverse Kinematics</div>
                <button onClick={handleCreateIKChain}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  + Create IK Chain
                </button>
                <button onClick={handleSolveIK}
                  style={{
                    width: "100%", padding: "4px", background: "#FF6600", border: "none", color: "#fff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, marginBottom: 4
                  }}>
                  ▶ Solve IK
                </button>
                <div style={{ color: "#555", fontSize: 8, marginBottom: 4 }}>
                  Chains: {ikChains.length}
                </div>
                {retargetStats && (
                  <div style={{ color: "#00ffc8", fontSize: 8, lineHeight: 1.6 }}>
                    Retarget: {retargetStats.coverage}% coverage<br />
                    {retargetStats.mapped}/{retargetStats.bvhJoints} joints mapped
                  </div>
                )}
                {bvhData && (
                  <button onClick={handleAutoDetectBoneMap}
                    style={{
                      width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                      color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginTop: 4
                    }}>
                    Auto-Detect Bone Map
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions 31-50: Advanced Tools panel */}
      {(showGN || matPreset || paintStack || bakedMaps.ao) && (
        <div style={{
          width: 200, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Advanced Tools
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

            {/* Remesh — Session 33 */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Remesh</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ color: "#555", fontSize: 8 }}>Voxel Size</span>
                <span style={{ color: "#00ffc8", fontSize: 8 }}>{remeshVoxel.toFixed(2)}</span>
              </div>
              <input type="range" min={0.02} max={0.5} step={0.01} value={remeshVoxel}
                onChange={e => setRemeshVoxel(Number(e.target.value))} style={{ width: "100%", marginBottom: 4 }} />
              <button onClick={handleVoxelRemesh}
                style={{
                  width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                  borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                }}>
                Voxel Remesh
              </button>
              <div style={{ display: "flex", gap: 3 }}>
                {["x", "y", "z"].map(ax => (
                  <button key={ax} onClick={() => handleSymmetrize(ax)}
                    style={{
                      flex: 1, padding: "3px", background: "#333333", border: "1px solid #3a3a3a",
                      color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8
                    }}>
                    Sym {ax.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Multires — Sessions 34-35 */}
            <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
              <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Multires</div>
              {!multiresStack ? (
                <button onClick={handleCreateMultires}
                  style={{
                    width: "100%", padding: "5px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9, marginBottom: 4
                  }}>
                  Create Stack
                </button>
              ) : (
                <>
                  <div style={{ color: "#00ffc8", fontSize: 8, marginBottom: 4 }}>
                    Level {multiresLevel}/{multiresStack.levels.length - 1} — {multiresStack.levels[multiresLevel]?.vertices || 0}v
                  </div>
                  <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                    <button onClick={handleSubdivideMultires}
                      style={{
                        flex: 1, padding: "4px", background: "#4772b3", border: "none", color: "#ffffff",
                        borderRadius: 3, cursor: "pointer", fontSize: 8, fontWeight: 700
                      }}>
                      + Subdivide
                    </button>
                    <button onClick={handleBakeDownMultires}
                      style={{
                        flex: 1, padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                        color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8
                      }}>
                      Bake Down
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {multiresStack.levels.map((_, i) => (
                      <button key={i} onClick={() => handleSetMultiresLevel(i)}
                        style={{
                          padding: "2px 5px", background: multiresLevel === i ? "#FF6600" : "#1a1f2e",
                          border: "none", color: multiresLevel === i ? "#fff" : "#666", borderRadius: 3,
                          cursor: "pointer", fontSize: 8
                        }}>
                        L{i}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Alpha Brush — Session 36 */}
            <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
              <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Alpha Brush</div>
              <input ref={alphaInputRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => e.target.files?.[0] && handleLoadAlpha(e.target.files[0])} />
              <button onClick={() => alphaInputRef.current?.click()}
                style={{
                  width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                  color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 9, marginBottom: 4
                }}>
                📁 Load Alpha Image
              </button>
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                {["circle", "square", "star", "diamond", "stripes", "noise"].map(t => (
                  <button key={t} onClick={() => handleGenerateAlpha(t)}
                    style={{
                      padding: "2px 4px", background: activeAlpha?.name === t ? "#8844ff" : "#1a1f2e",
                      border: "none", color: activeAlpha?.name === t ? "#fff" : "#666", borderRadius: 3,
                      cursor: "pointer", fontSize: 8
                    }}>
                    {t}
                  </button>
                ))}
              </div>
              {activeAlpha && (
                <div style={{ color: "#00ffc8", fontSize: 8 }}>✓ {activeAlpha.name} ({activeAlpha.width}px)</div>
              )}
            </div>

            {/* Smart Materials — Session 40 */}
            <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
              <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Materials</div>
              {Object.entries(matCategories).map(([cat, keys]) => (
                <div key={cat} style={{ marginBottom: 6 }}>
                  <div style={{ color: "#555", fontSize: 8, marginBottom: 2 }}>{cat}</div>
                  <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {keys.map(key => (
                      <button key={key} onClick={() => handleApplyPreset(key)}
                        title={MATERIAL_PRESETS[key]?.label}
                        style={{
                          width: 14, height: 14, borderRadius: 2, cursor: "pointer", border: "none",
                          background: MATERIAL_PRESETS[key]?.color || "#888",
                          outline: matPreset === key ? "2px solid #00ffc8" : "none"
                        }} />
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                <button onClick={handleEdgeWear}
                  style={{
                    flex: 1, padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8
                  }}>
                  Edge Wear
                </button>
                <button onClick={handleCavityDirt}
                  style={{
                    flex: 1, padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8
                  }}>
                  Cavity Dirt
                </button>
              </div>
            </div>

            {/* Texture Paint — Sessions 41-43 */}
            <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
              <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Texture Paint</div>
              {!paintStack ? (
                <button onClick={handleInitPaintStack}
                  style={{
                    width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                    borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                  }}>
                  Initialize Canvas
                </button>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4 }}>
                    <input type="color" value={paintColor} onChange={e => setPaintColor(e.target.value)}
                      style={{ width: 24, height: 24, border: "none", borderRadius: 3, cursor: "pointer", padding: 0 }} />
                    <span style={{ color: "#555", fontSize: 8 }}>Color</span>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                      <span style={{ color: "#555", fontSize: 8 }}>Radius</span>
                      <span style={{ color: "#00ffc8", fontSize: 8 }}>{paintRadius}px</span>
                    </div>
                    <input type="range" min={2} max={100} step={1} value={paintRadius}
                      onChange={e => setPaintRadius(Number(e.target.value))} style={{ width: "100%" }} />
                  </div>
                  <button onClick={handleAddPaintLayer}
                    style={{
                      width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                      color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                    }}>
                    + Add Layer ({paintStack.layers.length})
                  </button>
                  <button onClick={handleExportPaintMaps}
                    style={{
                      width: "100%", padding: "4px", background: "#FF6600", border: "none", color: "#fff",
                      borderRadius: 3, cursor: "pointer", fontSize: 8
                    }}>
                    Export Maps
                  </button>
                </>
              )}
            </div>

            {/* Texture Baker — Session 48 */}
            <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
              <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Texture Baker</div>
              {bakingStatus && (
                <div style={{ color: "#00ffc8", fontSize: 8, marginBottom: 4, lineHeight: 1.4 }}>{bakingStatus}</div>
              )}
              <button onClick={handleBakeAllMaps}
                style={{
                  width: "100%", padding: "5px", background: "#8844ff", border: "none", color: "#fff",
                  borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 4
                }}>
                Bake All Maps
              </button>
              {Object.keys(bakedMaps).length > 0 && (
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                  {Object.keys(bakedMaps).filter(k => bakedMaps[k]).map(k => (
                    <button key={k} onClick={() => handleDownloadBakedMap(k)}
                      style={{
                        padding: "3px 6px", background: "#333333", border: "1px solid #3a3a3a",
                        color: "#00ffc8", borderRadius: 3, cursor: "pointer", fontSize: 8
                      }}>
                      ↓ {k}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grease Pencil — Session 37 */}
            <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginBottom: 10 }}>
              <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Grease Pencil</div>
              <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4 }}>
                <input type="color" value={gpColor} onChange={e => setGpColor(e.target.value)}
                  style={{ width: 24, height: 24, border: "none", borderRadius: 3, cursor: "pointer", padding: 0 }} />
                <span style={{ color: "#555", fontSize: 8 }}>Stroke Color</span>
              </div>
              <div style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 1 }}>
                  <span style={{ color: "#555", fontSize: 8 }}>Thickness</span>
                  <span style={{ color: "#00ffc8", fontSize: 8 }}>{gpThickness}</span>
                </div>
                <input type="range" min={1} max={10} step={1} value={gpThickness}
                  onChange={e => setGpThickness(Number(e.target.value))} style={{ width: "100%" }} />
              </div>
              <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 4 }}>
                <input type="checkbox" checked={gpOnionSkin} onChange={e => setGpOnionSkin(e.target.checked)} />
                <span style={{ color: "#c8c8c8", fontSize: 9 }}>Onion Skin</span>
              </label>
              <button onClick={handleGPStrokeToMesh}
                style={{
                  width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                  color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8
                }}>
                Strokes → Mesh
              </button>
            </div>

            {/* Geometry Nodes — Session 38 */}
            <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8 }}>
              <div style={{ color: "#FF6600", fontSize: 9, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" }}>Geo Nodes</div>
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
                {["input", "output", "transform", "array", "noise", "subdivide", "decimate"].map(t => (
                  <button key={t} onClick={() => handleGNAddNode(t)}
                    style={{
                      padding: "2px 4px", background: "#1a1f2e", border: `1px solid ${NODE_TYPES[t]?.color || "#21262d"}`,
                      color: NODE_TYPES[t]?.color || "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 7
                    }}>
                    {t}
                  </button>
                ))}
              </div>
              <div style={{ color: "#555", fontSize: 8, marginBottom: 4 }}>
                Nodes: {gnGraph.nodes.length} | Connections: {gnGraph.connections.length}
              </div>
              <button onClick={handleGNEvaluate}
                style={{
                  width: "100%", padding: "5px", background: "#4772b3", border: "none", color: "#ffffff",
                  borderRadius: 3, cursor: "pointer", fontSize: 9, fontWeight: 700, marginBottom: 3
                }}>
                ▶ Evaluate Graph
              </button>
              <button onClick={() => handleAddSpline()}
                style={{
                  width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                  color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8, marginBottom: 3
                }}>
                + Add Spline
              </button>
              {activeSpline && (
                <button onClick={handlePipeAlongCurve}
                  style={{
                    width: "100%", padding: "4px", background: "#333333", border: "1px solid #3a3a3a",
                    color: "#aaa", borderRadius: 3, cursor: "pointer", fontSize: 8
                  }}>
                  Pipe Along Curve
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Armature panel — Session 20 */}
      {boneMode && (
        <div style={{
          width: 180, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{
            padding: "6px 10px", borderBottom: "1px solid #3a3a3a",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Armature
            </span>
            <button onClick={() => setBoneMode(false)}
              style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 11 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
            <button onClick={handleCreateArmature}
              style={{
                width: "100%", background: "#4772b3", border: "none", color: "#ffffff",
                borderRadius: 4, padding: "6px", cursor: "pointer", fontWeight: 700, fontSize: 10, marginBottom: 6
              }}>
              + Create Armature
            </button>
            {armatureRef.current && (
              <>
                <button onClick={handleAddBone}
                  style={{
                    width: "100%", background: "#FF6600", border: "none", color: "#fff",
                    borderRadius: 4, padding: "5px", cursor: "pointer", fontSize: 10, marginBottom: 4
                  }}>
                  + Add Bone
                </button>
                <div style={{ color: "#666", fontSize: 9, marginTop: 8, marginBottom: 4 }}>Bones</div>
                {armatureRef.current.userData.bones.map(bone => (
                  <div key={bone.userData.boneId}
                    onClick={() => handleSelectBone(bone.userData.boneId)}
                    style={{
                      padding: "4px 8px", borderRadius: 3, cursor: "pointer", marginBottom: 2,
                      background: selectedBoneId === bone.userData.boneId ? "#0a2a1a" : "#1a1f2e",
                      border: `1px solid ${selectedBoneId === bone.userData.boneId ? "#00ffc8" : "#21262d"}`
                    }}>
                    <span style={{ color: selectedBoneId === bone.userData.boneId ? "#00ffc8" : "#aaa", fontSize: 9 }}>
                      🦴 {bone.name}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* LOD + Instancing panel — Sessions 14-15 */}
      <div style={{
        width: 190, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
        display: "flex", flexDirection: "column", flexShrink: 0,
        fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
      }}>
        <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
          <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            LOD + Instances
          </span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>

          <div style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
            LOD System
          </div>
          <button onClick={handleGenerateLOD}
            style={{
              width: "100%", background: "#4772b3", border: "none", color: "#ffffff",
              borderRadius: 4, padding: "6px", cursor: "pointer", fontWeight: 700, fontSize: 10, marginBottom: 6
            }}>
            ⬡ Generate LOD
          </button>
          {lodStats.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: "#666", fontSize: 9, marginBottom: 4 }}>Preview Level</div>
              <select value={lodLevel} onChange={e => handleSetLODLevel(e.target.value)}
                style={{
                  width: "100%", background: "#333333", border: "1px solid #3a3a3a",
                  color: "#dde6ef", borderRadius: 3, padding: "4px", fontSize: 10, marginBottom: 6
                }}>
                <option value="auto">Auto (distance-based)</option>
                {lodStats.map(s => (
                  <option key={s.level} value={s.level}>
                    LOD{s.level} — {s.ratio} ({s.vertices}v)
                  </option>
                ))}
              </select>
              {lodStats.map(s => (
                <div key={s.level} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ color: "#555", fontSize: 9 }}>LOD{s.level} @{s.distance}m</span>
                  <span style={{ color: "#00ffc8", fontSize: 9 }}>{s.vertices}v / {s.triangles}t</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginTop: 4 }}>
            <div style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
              Instancing
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ color: "#666", fontSize: 9 }}>Count</span>
                <span style={{ color: "#00ffc8", fontSize: 9 }}>{instanceCount}</span>
              </div>
              <input type="range" min={1} max={500} step={1} value={instanceCount}
                onChange={e => setInstanceCount(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ color: "#666", fontSize: 9 }}>Spread</span>
                <span style={{ color: "#00ffc8", fontSize: 9 }}>{instanceSpread}</span>
              </div>
              <input type="range" min={1} max={50} step={0.5} value={instanceSpread}
                onChange={e => setInstanceSpread(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
              {["scatter", "grid"].map(l => (
                <button key={l} onClick={() => setInstanceLayout(l)}
                  style={{
                    flex: 1, padding: "4px", border: "none", borderRadius: 3, cursor: "pointer",
                    fontSize: 9, fontWeight: 700,
                    background: instanceLayout === l ? "#FF6600" : "#1a1f2e",
                    color: instanceLayout === l ? "#fff" : "#666"
                  }}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={handleCreateInstances}
              style={{
                width: "100%", background: "#FF6600", border: "none", color: "#fff",
                borderRadius: 4, padding: "6px", cursor: "pointer", fontWeight: 700, fontSize: 10, marginBottom: 4
              }}>
              ✦ Create Instances
            </button>
            <button onClick={handleFlattenInstances}
              style={{
                width: "100%", background: "#333333", border: "1px solid #3a3a3a", color: "#aaa",
                borderRadius: 4, padding: "5px", cursor: "pointer", fontSize: 9, marginBottom: 4
              }}>
              Flatten to Meshes
            </button>
          </div>

          <div style={{ borderTop: "1px solid #3a3a3a", paddingTop: 8, marginTop: 4 }}>
            <div style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
              Export Options
            </div>
            <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 4 }}>
              <input type="checkbox" checked={exportUnlit} onChange={e => setExportUnlit(e.target.checked)} />
              <span style={{ color: "#c8c8c8", fontSize: 10 }}>Unlit (KHR_materials_unlit)</span>
            </label>
            <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer", marginBottom: 4 }}>
              <input type="checkbox" checked={exportDraco} onChange={e => setExportDraco(e.target.checked)} />
              <span style={{ color: "#c8c8c8", fontSize: 10 }}>Draco compression</span>
            </label>
            {exportDraco && (
              <div style={{ color: "#555", fontSize: 9, lineHeight: 1.4 }}>
                Note: Draco requires viewer support. Reduces file size ~80%.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Procedural Mesh panel — Sessions 11-12 */}
      <div style={{
        width: 200, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
        display: "flex", flexDirection: "column", flexShrink: 0,
        fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
      }}>
        <div style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
          <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
            Procedural
          </span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px" }}>
          <div style={{ color: "#666", fontSize: 9, marginBottom: 4 }}>Type</div>
          <select value={procType} onChange={e => setProcType(e.target.value)}
            style={{
              width: "100%", background: "#333333", border: "1px solid #3a3a3a",
              color: "#dde6ef", borderRadius: 3, padding: "4px", fontSize: 10, marginBottom: 8
            }}>
            {["pipe", "staircase", "arch", "gear", "helix", "lathe"].map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          {["radius", "innerRadius", "height", "segments", "steps", "width",
            "stepHeight", "stepDepth", "thickness", "teeth", "toothHeight", "turns", "tubeRadius"].map(param => (
              <div key={param} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ color: "#666", fontSize: 9 }}>{param}</span>
                  <span style={{ color: "#a0a0a0", fontSize: 9 }}>{procParams[param]}</span>
                </div>
                <input type="range"
                  min={param === "segments" || param === "steps" || param === "teeth" ? 3 : 0.05}
                  max={param === "segments" || param === "steps" || param === "teeth" ? 256 : 4}
                  step={param === "segments" || param === "steps" || param === "teeth" ? 1 : 0.05}
                  value={procParams[param]}
                  onChange={e => setProcParams(p => ({ ...p, [param]: Number(e.target.value) }))}
                  style={{ width: "100%" }} />
              </div>
            ))}
          <button onClick={addProceduralMesh}
            style={{
              width: "100%", background: "#4772b3", border: "none", color: "#ffffff",
              borderRadius: 4, padding: "7px", cursor: "pointer", fontWeight: 700, fontSize: 11, marginTop: 4
            }}>
            + Generate {procType.charAt(0).toUpperCase() + procType.slice(1)}
          </button>

          <div style={{ borderTop: "1px solid #3a3a3a", marginTop: 12, paddingTop: 10 }}>
            <div style={{
              color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 6
            }}>Mesh Repair</div>
            {repairStatus && (
              <div style={{ color: "#00ffc8", fontSize: 9, marginBottom: 6, lineHeight: 1.4 }}>{repairStatus}</div>
            )}
            {[
              ["Fix Normals", handleFixNormals],
              ["Remove Doubles", handleRemoveDoubles],
              ["Remove Degenerates", handleRemoveDegenerates],
              ["Fill Holes", handleFillHoles],
              ["Full Repair", handleFullRepair],
            ].map(([label, fn]) => (
              <button key={label} onClick={fn}
                style={{
                  width: "100%", background: "#333333", border: "1px solid #3a3a3a",
                  color: "#dde6ef", borderRadius: 3, padding: "5px", cursor: "pointer",
                  fontSize: 10, marginBottom: 4, textAlign: "left"
                }}>
                🔧 {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Shape Keys panel — Sessions 9-10 */}
      {shapeKeys.length > 0 && (
        <div style={{
          width: 220, background: "#2a2a2a", borderLeft: "1px solid #3a3a3a",
          display: "flex", flexDirection: "column", flexShrink: 0,
          fontFamily: "JetBrains Mono,monospace", fontSize: 11, overflow: "hidden"
        }}>
          <div style={{
            padding: "6px 10px", borderBottom: "1px solid #3a3a3a",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <span style={{ color: "#c8c8c8", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Shape Keys ({shapeKeys.length})
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={addShapeKey}
                style={{
                  background: "#4772b3", border: "none", color: "#ffffff", borderRadius: 3,
                  padding: "2px 6px", cursor: "pointer", fontSize: 9, fontWeight: 700
                }}>+ Key</button>
              <button onClick={resetAllShapeKeys}
                style={{
                  background: "#333333", border: "1px solid #3a3a3a", color: "#888", borderRadius: 3,
                  padding: "2px 6px", cursor: "pointer", fontSize: 9
                }}>Reset</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {shapeKeys.map((key, idx) => (
              <div key={key.id} style={{ padding: "6px 10px", borderBottom: "1px solid #3a3a3a" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: idx === 0 ? "#888" : "#dde6ef", fontSize: 10, fontWeight: 700 }}>
                    {key.name}
                  </span>
                  {idx > 0 && (
                    <button onClick={() => removeShapeKey(key.id)}
                      style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 11 }}>✕</button>
                  )}
                </div>
                {idx > 0 && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input type="range" min={0} max={1} step={0.01} value={key.value}
                      onChange={e => setShapeKeyValue(key.id, Number(e.target.value))}
                      style={{ flex: 1 }} />
                    <span style={{ color: "#00ffc8", fontSize: 9, width: 28, textAlign: "right" }}>
                      {key.value.toFixed(2)}
                    </span>
                  </div>
                )}
                {idx === 0 && (
                  <div style={{ color: "#444", fontSize: 9 }}>Rest pose</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Right panel — MeshEditorPanel */}
      <MeshEditorPanel
        stats={stats}
        history={history.length}
        selectedFaces={selectedFaces.size}
        selectedVerts={selectedVerts.size}
        selectedEdges={Math.floor(selectedEdges.size / 2)}
        loopCutT={loopCutT}
        setLoopCutT={(t) => { setLoopCutT(t); buildLoopCutPreview(t); }}
        wireframe={wireframe}
        knifePoints={knifePoints.length}
        slideAmount={slideAmount}
        onAddPrimitive={addPrimitive}
        onLoopCut={() => { setActiveTool("loop_cut"); applyLoopCut(); }}
        onKnife={() => { setActiveTool("knife"); setEditMode("edit"); }}
        onEdgeSlide={startEdgeSlide}
        onSubdivide={applySubdivide}
        onExtrude={applyExtrude}
        onMerge={applyMerge}
        onUndo={undo}
        onExportGLB={exportGLB}
        onImportGLB={() => fileInputRef.current?.click()}
        onSendToStreamPireX={sendToStreamPireX}
        onMirror={applyMirror}
        onOpenMatEditor={() => setShowMatEditor(true)}
        onRenderToImage={renderToImage}
        onPushToStreamPireX={pushToStreamPireX}
        propEdit={propEdit}
        setPropEdit={setPropEdit}
        propRadius={propRadius}
        setPropRadius={setPropRadius}
        propFalloff={propFalloff}
        setPropFalloff={setPropFalloff}
        snapEnabled={snapEnabled}
        setSnapEnabled={setSnapEnabled}
        snapSize={snapSize}
        setSnapSize={setSnapSize}
        onBoolean={applyBoolean}
        booleanMode={booleanMode}
        setBooleanMode={setBooleanMode}
        onUVUnwrap={applyUVUnwrap}
        onOpenUVEditor={openUVEditor}
        uvProjection={uvProjection}
        setUVProjection={setUVProjection}
        onBevel={applyBevel}
        onInset={applyInset}
        bevelAmt={bevelAmt}
        setBevelAmt={setBevelAmt}
        insetAmt={insetAmt}
        setInsetAmt={setInsetAmt}
        mirrorAxis={mirrorAxis}
        setMirrorAxis={setMirrorAxis}
        shapeKeyCount={shapeKeys.length}
        onAddBasis={addBasisKey}
        onAddShapeKey={addShapeKey}
      />

      {/* ── Session E: Geometry Nodes Panel ── */}
      {showGeoNodesPanel && (
        <div style={{position:'fixed',top:40,right:260,width:340,background:'#0d1117',
          border:'1px solid #3a3a3a',borderRadius:4,padding:10,zIndex:105,overflowY:'auto',maxHeight:'80vh'}}>
          <div style={{color:'#00ffc8',fontSize:10,fontWeight:700,marginBottom:8}}>GEOMETRY NODES</div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:6}}>
            {['transform','array','noise','subdivide','decimate','boolean','merge'].map(t=>(
              <button key={t} onClick={()=>setGeoNodeType(t)}
                style={{padding:'2px 6px',fontSize:8,borderRadius:3,cursor:'pointer',
                  background:geoNodeType===t?NODE_TYPES[t]?.color||'#4488ff':'#1a1f2e',
                  border:'1px solid #3a3a3a',color:geoNodeType===t?'#06060f':'#aaa',fontWeight:700}}>
                {t}
              </button>
            ))}
          </div>
          <div style={{display:'flex',gap:4,marginBottom:6}}>
            <button onClick={handleGeoAddInput} style={{flex:1,padding:'3px',fontSize:8,background:'#003322',
              border:'1px solid #00ffc8',color:'#00ffc8',borderRadius:3,cursor:'pointer'}}>+ Input</button>
            <button onClick={handleGeoAddNode} style={{flex:1,padding:'3px',fontSize:8,background:'#1a1f2e',
              border:'1px solid #3a3a3a',color:'#aaa',borderRadius:3,cursor:'pointer'}}>+ Node</button>
            <button onClick={handleGeoAddOutput} style={{flex:1,padding:'3px',fontSize:8,background:'#2a0a00',
              border:'1px solid #FF6600',color:'#FF6600',borderRadius:3,cursor:'pointer'}}>+ Output</button>
            <button onClick={handleGeoConnect} style={{flex:1,padding:'3px',fontSize:8,background:'#1a1f2e',
              border:'1px solid #8844ff',color:'#8844ff',borderRadius:3,cursor:'pointer'}}>Connect</button>
          </div>
          {/* Node list */}
          <div style={{marginBottom:6}}>
            {geoGraph.nodes.map((node,i) => (
              <div key={node.id} onClick={()=>setGeoSelectedNode(node.id)}
                style={{padding:'4px 6px',marginBottom:3,borderRadius:3,cursor:'pointer',
                  background:geoSelectedNode===node.id?'#1a2a3a':'#0d1117',
                  border:'1px solid '+(geoSelectedNode===node.id?NODE_TYPES[node.type]?.color||'#4488ff':'#21262d')}}>
                <span style={{color:NODE_TYPES[node.type]?.color||'#dde6ef',fontSize:8,fontWeight:700}}>
                  {i+1}. {NODE_TYPES[node.type]?.label||node.type}
                </span>
                {/* Params */}
                {geoSelectedNode===node.id && Object.entries(node.params).map(([k,v])=>(
                  <div key={k} style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}>
                    <span style={{color:'#555',fontSize:7,width:50}}>{k}</span>
                    <input type={typeof v==='number'?'number':'text'} value={v}
                      onChange={e=>handleGeoUpdateParam(node.id,k,e.target.value)}
                      style={{flex:1,background:'#06060f',border:'1px solid #3a3a3a',color:'#dde6ef',
                        fontSize:8,padding:'1px 3px',borderRadius:2}} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          {/* Connections */}
          {geoGraph.connections.length>0 && (
            <div style={{marginBottom:6}}>
              <div style={{color:'#555',fontSize:7,marginBottom:2}}>Connections ({geoGraph.connections.length})</div>
              {geoGraph.connections.map((c,i)=>(
                <div key={i} style={{color:'#8fa8bf',fontSize:7,marginBottom:1}}>
                  {geoGraph.nodes.find(n=>n.id===c.fromId)?.type||'?'} → {geoGraph.nodes.find(n=>n.id===c.toId)?.type||'?'}
                </div>
              ))}
            </div>
          )}
          <div style={{display:'flex',gap:4}}>
            <button onClick={handleGeoEvaluate} style={{flex:2,padding:'4px',fontSize:8,
              background:geoApplied?'#003322':'#1a2a1a',border:'1px solid '+(geoApplied?'#00ffc8':'#44ff88'),
              color:geoApplied?'#00ffc8':'#44ff88',borderRadius:3,cursor:'pointer',fontWeight:700}}>
              {geoApplied?'Re-Evaluate':'Evaluate Graph'}
            </button>
            <button onClick={handleGeoClear} style={{flex:1,padding:'4px',fontSize:8,background:'#1a1f2e',
              border:'1px solid #ff4444',color:'#ff4444',borderRadius:3,cursor:'pointer'}}>Clear</button>
          </div>
          <div style={{color:'#555',fontSize:7,marginTop:4}}>
            Nodes: {geoGraph.nodes.length} | Connections: {geoGraph.connections.length}
          </div>
        </div>
      )}

      {/* ── Session E: Mesh Tools Panel ── */}
      {showMeshToolsPanel && (
        <div style={{position:'fixed',top:40,right:260,width:200,background:'#0d1117',
          border:'1px solid #3a3a3a',borderRadius:4,padding:8,zIndex:105,overflowY:'auto',maxHeight:'80vh'}}>
          <div style={{color:'#FF6600',fontSize:9,fontWeight:700,marginBottom:6}}>MESH TOOLS</div>

          <div style={{color:'#555',fontSize:7,marginBottom:3}}>REPAIR</div>
          <button onClick={handleFullRepair} style={{width:'100%',padding:'4px',fontSize:8,background:'#1a2a1a',
            border:'1px solid #00ffc8',color:'#00ffc8',borderRadius:3,cursor:'pointer',marginBottom:3,fontWeight:700}}>
            Full Auto Repair
          </button>
          {[
            ['Fill Holes', handleFillHoles],
            ['Fix Normals', handleFixNormals],
            ['Remove Doubles', handleRemoveDoubles],
            ['Remove Degenerates', handleRemoveDegenerates],
            ['Smooth Topology', handleSmoothTopology],
            ['Symmetrize X', handleSymmetrize],
          ].map(([label,fn])=>(
            <button key={label} onClick={fn} style={{width:'100%',padding:'3px',fontSize:8,background:'#1a1f2e',
              border:'1px solid #3a3a3a',color:'#aaa',borderRadius:3,cursor:'pointer',marginBottom:2}}>
              {label}
            </button>
          ))}

          <div style={{color:'#555',fontSize:7,marginBottom:3,marginTop:6}}>UV PROJECTION</div>
          <select value={uvAxis} onChange={e=>setUvAxis(e.target.value)}
            style={{width:'100%',background:'#0d1117',border:'1px solid #3a3a3a',color:'#dde6ef',fontSize:8,padding:2,marginBottom:3}}>
            <option value='x'>X Axis</option><option value='y'>Y Axis</option><option value='z'>Z Axis</option>
          </select>
          {[
            ['UV Planar', handleUVPlanar],
            ['UV Box', handleUVBox],
            ['UV Sphere', handleUVSphere],
          ].map(([label,fn])=>(
            <button key={label} onClick={fn} style={{width:'100%',padding:'3px',fontSize:8,background:'#1a1f2e',
              border:'1px solid #3a3a3a',color:'#aaa',borderRadius:3,cursor:'pointer',marginBottom:2}}>
              {label}
            </button>
          ))}

          <div style={{color:'#555',fontSize:7,marginBottom:3,marginTop:6}}>BOOLEAN</div>
          <select value={boolOp} onChange={e=>setBoolOp(e.target.value)}
            style={{width:'100%',background:'#0d1117',border:'1px solid #3a3a3a',color:'#dde6ef',fontSize:8,padding:2,marginBottom:3}}>
            <option value='union'>Union</option><option value='subtract'>Subtract</option><option value='intersect'>Intersect</option>
          </select>
          <button onClick={handleBooleanOp} style={{width:'100%',padding:'4px',fontSize:8,background:'#1a1f2e',
            border:'1px solid #ffff44',color:'#ffff44',borderRadius:3,cursor:'pointer',marginBottom:3}}>Apply Boolean</button>

          <div style={{color:'#555',fontSize:7,marginBottom:3,marginTop:6}}>REMESH / LOD</div>
          {[
            ['Voxel Remesh', handleVoxelRemesh],
            ['Quad Remesh 2k', handleQuadRemesh],
            ['Generate LOD', handleGenerateLOD],
            ['Optimize Scene', handleOptimizeScene],
          ].map(([label,fn])=>(
            <button key={label} onClick={fn} style={{width:'100%',padding:'3px',fontSize:8,background:'#1a1f2e',
              border:'1px solid #3a3a3a',color:'#aaa',borderRadius:3,cursor:'pointer',marginBottom:2}}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Graph Editor — Session 62 */}
      {showGraphEditor && (
        <div style={{ position: "fixed", bottom: showTimeline ? 180 : 0, left: 0, right: 0, zIndex: 99 }}>
          <GraphEditor
            objects={sceneObjects}
            activeObjId={activeObjId}
            animKeys={animKeys}
            fps={24}
          />
        </div>
      )}

      {/* Animation Timeline — Sessions 17-19 */}
      {showTimeline && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100 }}>
          <AnimationTimeline
            objects={sceneObjects}
            activeObjId={activeObjId}
            shapeKeys={shapeKeys}
            onSeek={handleSeek}
            onPlay={() => setStatus("Playing...")}
            onStop={() => setStatus("Stopped")}
            fps={24}
          />
        </div>
      )}


      {/* Keyboard shortcut overlay — Session 167 */}
      {showShortcutOverlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setShowShortcutOverlay(false)}
        >
          <div
            style={{
              background: "#0d1117",
              border: "1px solid #3a3a3a",
              borderRadius: 8,
              padding: 24,
              maxWidth: 700,
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              fontFamily: "JetBrains Mono,monospace"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16
              }}
            >
              <span style={{ color: "#00ffc8", fontSize: 14, fontWeight: 700 }}>
                Keyboard Shortcuts
              </span>
              <button
                onClick={() => setShowShortcutOverlay(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#aaa",
                  cursor: "pointer",
                  fontSize: 18
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {Object.entries(SHORTCUT_CATEGORIES).map(([key, cat]) => (
                <div key={key}>
                  <div
                    style={{
                      color: "#FF6600",
                      fontSize: 10,
                      fontWeight: 700,
                      marginBottom: 6,
                      textTransform: "uppercase"
                    }}
                  >
                    {cat.label}
                  </div>

                  {cat.shortcuts.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 3
                      }}
                    >
                      <span style={{ color: "#555", fontSize: 10 }}>{s.desc}</span>
                      <span style={{ display: "flex", gap: 2 }}>
                        {s.keys.map((k, ki) => (
                          <span
                            key={ki}
                            style={{
                              background: "#1a1f2e",
                              border: "1px solid #3a3a3a",
                              borderRadius: 3,
                              padding: "1px 5px",
                              color: "#00ffc8",
                              fontSize: 9,
                              fontFamily: "monospace"
                            }}
                          >
                            {k}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding tour — Session 168 */}
      {tourVisible && tourState.active && (
        <div
          style={{
            position: "fixed",
            bottom: 40,
            right: 40,
            zIndex: 999,
            background: "#0d1117",
            border: "1px solid #00ffc8",
            borderRadius: 8,
            padding: 20,
            maxWidth: 320,
            fontFamily: "JetBrains Mono,monospace",
            boxShadow: "0 0 30px rgba(0,255,200,0.15)"
          }}
        >
          <div style={{ color: "#555", fontSize: 8, marginBottom: 4 }}>
            Step {tourState.step + 1} of {TOUR_STEPS.length}
          </div>

          <div style={{ color: "#00ffc8", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            {TOUR_STEPS[tourState.step]?.title}
          </div>

          <div style={{ color: "#8fa8bf", fontSize: 10, lineHeight: 1.6, marginBottom: 12 }}>
            {TOUR_STEPS[tourState.step]?.body}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={() => setTourVisible(false)}
              style={{
                background: "none",
                border: "1px solid #3a3a3a",
                color: "#555",
                borderRadius: 3,
                padding: "4px 10px",
                cursor: "pointer",
                fontSize: 9
              }}
            >
              Skip
            </button>

            <button
              onClick={handleAdvanceTour}
              style={{
                background: "#00ffc8",
                border: "none",
                color: "#06060f",
                borderRadius: 3,
                padding: "4px 14px",
                cursor: "pointer",
                fontSize: 9,
                fontWeight: 700
              }}
            >
              {tourState.step < TOUR_STEPS.length - 1 ? "Next →" : "Finish ✓"}
            </button>
          </div>
        </div>
      )}
    {/* Publish hero button */}
      <div style={{
        position: "fixed", top: 10, right: 56, zIndex: 200,
        display: "flex", gap: 6, alignItems: "center"
      }}>
        <button
          onClick={handlePublishToSPX}
          title="Publish scene to StreamPireX"
          style={{
            background: "linear-gradient(135deg, #00ffc8, #00c8a0)",
            border: "none", borderRadius: 6, cursor: "pointer",
            color: "#06060f", fontWeight: 800, fontSize: 11,
            padding: "6px 14px", boxShadow: "0 2px 12px #00ffc840",
            letterSpacing: 0.5
          }}
        >
          ▲ Publish to SPX
        </button>
      </div>
    </div>
  );
}