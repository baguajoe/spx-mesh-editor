import { PropertyInspector } from './components/PropertyInspector';
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import ProfessionalShell from "./pro-ui/ProfessionalShell";
import FeatureIndexPanel from "./pro-ui/FeatureIndexPanel";
import WORKSPACE_FEATURES from "./pro-ui/workspaceMap";

import { HalfEdgeMesh } from "./mesh/HalfEdgeMesh.js";
import { booleanUnion, booleanSubtract, booleanIntersect } from "./mesh/BooleanOps.js";
import { uvBoxProject, uvSphereProject, uvPlanarProject } from "./mesh/UVUnwrap.js";
import { applySculptStroke } from "./mesh/SculptEngine.js";
import { createShapeKey, applyShapeKeys } from "./mesh/ShapeKeys.js";
import { createPipe, createGear, buildProceduralMesh, createAssetLibrary, createTourState } from "./mesh/ProceduralMesh.js";
import { generateLOD } from "./mesh/LODSystem.js";
import { createArmature } from "./mesh/ArmatureSystem.js";
import { enterPoseMode } from "./mesh/PoseMode.js";
import { initWeights } from "./mesh/WeightPainting.js";
import { applyDyntopo, createDynaMeshSettings } from "./mesh/DynamicTopology.js";
import { createAction, createTrack, createStrip } from "./mesh/NLASystem.js";
import { createStroke, createLayer } from "./mesh/GreasePencil.js";
import { NODE_TYPES, createNode, createGraph, addNode, connectNodes, evaluateGraph } from "./mesh/GeometryNodes.js";
import { createSpline } from "./mesh/CurveSystem.js";
import { applyPreset } from "./mesh/SmartMaterials.js";
import { createPaintTexture } from "./mesh/TexturePainter.js";
import { bakeAO } from "./mesh/TextureBaker.js";
import { createLight } from "./mesh/LightSystem.js";
import { createCamera } from "./mesh/CameraSystem.js";
import { applyColorGrade, createPassStack } from "./mesh/PostProcessing.js";
import { DEFAULT_BONE_MAP, retargetFrame, bakeRetargetedAnimation, fixFootSliding, autoDetectBoneMap, getRetargetStats } from "./mesh/MocapRetarget.js";
import { createIKChain } from "./mesh/IKSystem.js";
import { createPathTracerSettings, createVolumetricSettings } from "./mesh/PathTracer.js";
import { generateFibermesh } from "./mesh/FibermeshSystem.js";
import { createInstances } from "./mesh/Instancing.js";
import { fixNormals, createRetopoSettings } from "./mesh/MeshRepair.js";

import { MaterialEditor } from "./components/MaterialEditor.jsx";
import { UVEditor } from "./components/UVEditor.jsx";
import { TransformGizmo } from "./components/TransformGizmo.js";
import { MeshEditorPanel } from "./components/MeshEditorPanel";
import { Outliner } from "./components/Outliner.jsx";
import { AnimationTimeline } from "./components/AnimationTimeline.jsx";
import { createSceneObject, buildPrimitiveMesh } from "./components/SceneManager.js";

import "./App.css";
import "./styles/pro-dark.css";

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
  { id: "box", label: "Cube" },
  { id: "sphere", label: "Sphere" },
  { id: "cylinder", label: "Cylinder" },
  { id: "cone", label: "Cone" },
  { id: "torus", label: "Torus" },
  { id: "plane", label: "Plane" },
  { id: "circle", label: "Circle" },
  { id: "icosphere", label: "Icosphere" }
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
  const orbitState = useRef({ theta: 0.6, phi: 1.1, radius: 5 
  

});

  const fileInputRef = useRef(null);
  const gizmoRef = useRef(null);
  const [gizmoMode, setGizmoMode] = useState("move"); // move|rotate|scale
  const [gizmoActive, setGizmoActive] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState("Modeling");
  const gizmoDragging = useRef(false);
  const [bevelAmt, setBevelAmt] = useState(0.1);
  const [insetAmt, setInsetAmt] = useState(0.15);
  const [mirrorAxis, setMirrorAxis] = useState("x");
  // ── Sessions 13-15 state ──────────────────────────────────────────────────
  const [showMatEditor, setShowMatEditor] = useState(false);
  const [matProps, setMatProps] = useState({ color: "#888888", roughness: 0.5, metalness: 0.1, opacity: 1, emissive: "#000000", emissiveIntensity: 0, wireframe: false, transparent: false, side: "front" 
  

});

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
  
  useEffect(() => {
    if (scene) {
      const updateObjects = () => {
        const meshes = [];
        scene.traverse((child) => {
          if (child.isMesh) meshes.push(child);
        });
        setSceneObjects(meshes);
      };
      updateObjects();
    }
  }, [scene, objectsAddedCounter]); // objectsAddedCounter triggers refresh on add/delete

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
    sceneObjects.forEach(o => { if (o.mesh) sceneRef.current?.remove(o.mesh); 
  

});

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
  const knifeRef = useRef({ active: false, points: [], line: null 
  

});

  // Edge slide state
  const slideRef = useRef({ active: false, startX: 0, edge: null 
  

});

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
  const lazyMouseRef = useRef({ x: 0, y: 0 
  

});

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
  
  const [isAutoKey, setAutoKey] = useState(false);

  const recordKeyframe = (obj, key, val) => {
    if (!isAutoKey) return;
    if (typeof window.addKeyframe === 'function') {
      window.addKeyframe(obj.uuid, key, val, currentFrame);
      console.log(`🔑 Keyframe: ${key} set at frame ${currentFrame}`);
    }
  };

  
  const exportSpxScene = () => {
    const sceneData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      objects: sceneObjects.map(obj => ({
        name: obj.name,
        type: obj.userData.type,
        params: obj.userData.params,
        position: obj.position.toArray(),
        rotation: obj.rotation.toArray(),
        scale: obj.scale.toArray(),
        keyframes: window.animationData ? window.animationData[obj.uuid] : []
      }))
    };
    
    const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spx_project_${Date.now()}.json`;
    link.click();
    console.log("💾 Scene exported to .json");
  };

  
  // --- PRO DCC ENGINES ---
  const importSpxScene = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      sceneObjects.forEach(obj => scene.remove(obj));
      data.objects.forEach(o => addPrimitive(o.type, o.params));
      console.log("📂 Project Loaded");
    };
    reader.readAsText(file);
  };

  const takeSnapshot = () => {
    const canvas = document.querySelector('canvas');
    const link = document.createElement('a');
    link.download = `spx_render_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    console.log("📸 Render Saved");
  };

  const [stats, setStats] = useState({ vertices: 0, edges: 0, faces: 0, halfEdges: 0 
  

});

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
  const [showNPanel, setShowNPanel] = useState(false);
  const [activeMode, setActiveMode] = useState("object");
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

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true 
  

});

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

    
  const updateMeshParam = (obj, key, val) => {
    if (!obj) return;
    obj.userData.params = { ...obj.userData.params, [key]: val };
    const newGeo = buildProceduralMesh(obj.userData.type, obj.userData.params);
    obj.geometry.dispose();
    obj.geometry = newGeo;
  };


  // --- PROFESSIONAL ENGINE BRIDGE ---
  window.HalfEdgeMesh = HalfEdgeMesh;
  window.booleanUnion = booleanUnion;
  window.booleanSubtract = booleanSubtract;
  window.booleanIntersect = booleanIntersect;
  window.uvBoxProject = uvBoxProject;
  window.uvSphereProject = uvSphereProject;
  window.uvPlanarProject = uvPlanarProject;
  window.applySculptStroke = applySculptStroke;
  window.createShapeKey = createShapeKey;
  window.applyShapeKeys = applyShapeKeys;
  window.createPipe = createPipe;
  window.createGear = createGear;
  window.buildProceduralMesh = buildProceduralMesh;
  window.createAssetLibrary = createAssetLibrary;
  window.createTourState = createTourState;
  window.generateLOD = generateLOD;
  window.createArmature = createArmature;
  window.enterPoseMode = enterPoseMode;
  window.initWeights = initWeights;
  window.applyDyntopo = applyDyntopo;
  window.createDynaMeshSettings = createDynaMeshSettings;
  window.createAction = createAction;
  window.createTrack = createTrack;
  window.createStrip = createStrip;
  window.createStroke = createStroke;
  window.createLayer = createLayer;
  window.createNode = createNode;
  window.createGraph = createGraph;
  window.addNode = addNode;
  window.connectNodes = connectNodes;
  window.evaluateGraph = evaluateGraph;
  window.createSpline = createSpline;
  window.applyPreset = applyPreset;
  window.createPaintTexture = createPaintTexture;
  window.bakeAO = bakeAO;
  window.createLight = createLight;
  window.createCamera = createCamera;
  window.applyColorGrade = applyColorGrade;
  window.createPassStack = createPassStack;
  window.DEFAULT_BONE_MAP = DEFAULT_BONE_MAP;
  window.retargetFrame = retargetFrame;
  window.bakeRetargetedAnimation = bakeRetargetedAnimation;
  window.fixFootSliding = fixFootSliding;
  window.autoDetectBoneMap = autoDetectBoneMap;
  window.getRetargetStats = getRetargetStats;
  window.createIKChain = createIKChain;
  window.createPathTracerSettings = createPathTracerSettings;
  window.createVolumetricSettings = createVolumetricSettings;
  window.generateFibermesh = generateFibermesh;
  window.createInstances = createInstances;
  window.fixNormals = fixNormals;
  window.createRetopoSettings = createRetopoSettings;
  
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setFrame((prev) => (prev >= 250 ? 0 : prev + 1));
      }, 1000 / 24); // Standard 24fps Cinematic Playback
    }
    window.importSpxScene = importSpxScene;
  window.takeSnapshot = takeSnapshot;
  return () => clearInterval(interval);
  }, [isPlaying]);

  // Hook into the 700-function engine every frame
  useEffect(() => {
    if (typeof window.evaluateNLA === 'function') {
      window.evaluateNLA(currentFrame);
    }
    if (typeof window.retargetFrame === 'function') {
      sceneObjects.forEach(obj => {
        if (obj.userData.isMocap) window.retargetFrame(obj, currentFrame);
      });
    }
  }, [currentFrame]);

  return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
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
    else if (type === "gear") geo = buildProceduralMesh("gear");
    else if (type === "pipe") geo = buildProceduralMesh("pipe");
    else if (type === "helix") geo = buildProceduralMesh("helix");
    else if (type === "staircase") geo = buildProceduralMesh("staircase");
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
    const mat = new THREE.PointsMaterial({ size: 0.08, vertexColors: true, depthTest: false 
  

});

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
    const mat = new THREE.LineBasicMaterial({ vertexColors: true, depthTest: false, linewidth: 2 
  

});

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
    const mat = new THREE.LineBasicMaterial({ color: COLORS.teal, depthTest: false, linewidth: 3 
  

});

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
    knife.points.push({ x, y 
  

});

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
      const blob = new Blob([glb], { type: "model/gltf-binary" 
  

});

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
    }, (err) => console.error(err), { binary: true 
  

});

  };

  // ── Toggle wireframe ───────────────────────────────────────────────────────
  const toggleWireframe = useCallback(() => {
    const mesh = meshRef.current; if (!mesh) return;
    const newWF = !wireframe;
    setWireframe(newWF);
    mesh.traverse(m => { if (m.isMesh && m.material) m.material.wireframe = newWF; 
  

});

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
  const [animKeys, setAnimKeys] = useState({
  

});

  const [armatures, setArmatures] = useState([]);
  const [selectedBoneId, setSelectedBoneId] = useState(null);
  const [poseLibrary, setPoseLibrary] = useState({
  

});

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
  const [bakedMaps, setBakedMaps] = useState({
  

});

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
  const [boneMap, setBoneMap] = useState({ ...DEFAULT_BONE_MAP 
  

});

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
  const [passResults, setPassResults] = useState({
  

});

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
  const [shaderOptions, setShaderOptions] = useState({
  

});

  const [farmFrameEnd, setFarmFrameEnd] = useState(24);
  const [farmJobName, setFarmJobName] = useState("Render_001");
  const [exportFormat, setExportFormat] = useState("glb");
  const [pluginMarketplace, setPluginMarketplace] = useState({ presets: [] 
  

});

  useEffect(() => {
  const onKey = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'n' || e.key === 'N') setShowNPanel(v => !v);
  };

  window.addEventListener('keydown', onKey);

  
  const updateMeshParam = (obj, key, val) => {
    if (!obj) return;
    obj.userData.params = { ...obj.userData.params, [key]: val };
    const newGeo = buildProceduralMesh(obj.userData.type, obj.userData.params);
    obj.geometry.dispose();
    obj.geometry = newGeo;
  };

  
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setFrame((prev) => (prev >= 250 ? 0 : prev + 1));
      }, 1000 / 24); // Standard 24fps Cinematic Playback
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Hook into the 700-function engine every frame
  useEffect(() => {
    if (typeof window.evaluateNLA === 'function') {
      window.evaluateNLA(currentFrame);
    }
    if (typeof window.retargetFrame === 'function') {
      sceneObjects.forEach(obj => {
        if (obj.userData.isMocap) window.retargetFrame(obj, currentFrame);
      });
    }
  }, [currentFrame]);

  return () => {
    window.removeEventListener('keydown', onKey);
  };
}, []);

  
  const updateMeshParam = (obj, key, val) => {
    if (!obj) return;
    obj.userData.params = { ...obj.userData.params, [key]: val };
    const newGeo = buildProceduralMesh(obj.userData.type, obj.userData.params);
    obj.geometry.dispose();
    obj.geometry = newGeo;
  };

  
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setFrame((prev) => (prev >= 250 ? 0 : prev + 1));
      }, 1000 / 24); // Standard 24fps Cinematic Playback
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Hook into the 700-function engine every frame
  useEffect(() => {
    if (typeof window.evaluateNLA === 'function') {
      window.evaluateNLA(currentFrame);
    }
    if (typeof window.retargetFrame === 'function') {
      sceneObjects.forEach(obj => {
        if (obj.userData.isMocap) window.retargetFrame(obj, currentFrame);
      });
    }
  }, [currentFrame]);

  return (
    <ProfessionalShell
      activeWorkspace={activeWorkspace}
      setActiveWorkspace={setActiveWorkspace}
      leftPanel={
        activeWorkspace === "Modeling" ? ( <div 
          <MeshEditorPanel stats={stats} onApplyFunction={(fn) => typeof window[fn] === "function" ? window[fn]() : console.warn(fn)} onAddPrimitive={addPrimitive} />onKnife={() => {}} />
            onEdgeSlide={() => {}}
            onSubdivide={() => {}}
            onExtrude={() => {}}
            onMerge={() => {}}
            onUndo={undo}
            onExportGLB={() => {}}
            onImportGLB={() => {}}
            onMirror={() => {}}
            onBevel={() => {}}
            onInset={() => {}}
            onBoolean={() => {}}
            onUVUnwrap={() => {}}
            onOpenUVEditor={() => {}}
            onOpenMatEditor={() => {}}
          />
        ) : (
          <FeatureIndexPanel title={`${activeWorkspace} Tools`} features={WORKSPACE_FEATURES[activeWorkspace] || []} />
        )
      }
      centerPanel={
        <div className="mesh-editor-canvas">
          <canvas ref={canvasRef} />
        </div>
      }
      rightPanel={
        <FeatureIndexPanel title={`${activeWorkspace} Systems`} features={WORKSPACE_FEATURES[activeWorkspace] || []} />
      }
    />
  );
}