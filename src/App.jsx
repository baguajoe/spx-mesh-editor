import { WORKSPACES, DEFAULT_WORKSPACE } from "./pro-ui/workspaceMap";
import CityGeneratorPanel from './components/panels/CityGeneratorPanel';
import VRPreviewPanel from './components/panels/VRPreviewPanel';
import CrowdGeneratorPanel from './components/panels/CrowdGeneratorPanel';
import EnvironmentGeneratorPanel from './components/panels/EnvironmentGeneratorPanel';
import BuildingSimulatorPanel from './components/panels/BuildingSimulatorPanel';
import PhysicsSimulationPanel from './components/panels/PhysicsSimulationPanel';
import TerrainSculptingPanel from './components/panels/TerrainSculptingPanel';
import LightingStudioPanel from './components/panels/LightingStudioPanel';
import MaterialTexturePanel from './components/panels/MaterialTexturePanel';
import { ViewportHeader } from "./components/ViewportHeader";
import { PropertyInspector } from "./components/PropertyInspector";
import { Outliner } from "./components/Outliner";
import React, { useRef, useEffect, useState, useCallback } from "react";

import SPXPerformancePanel from "./components/SPXPerformancePanel.jsx";import * as THREE from "three";
import { initFilmComposer, createProceduralHDRI, upgradeMaterialsToPhysical } from "./mesh/FilmRenderer.js";
import FilmPostPanel from "./components/panels/FilmPostPanel.jsx";
import FilmAssetLibrary from "./components/panels/FilmAssetLibrary.jsx";
import FilmMaterialPanel from "./components/panels/FilmMaterialPanel.jsx";
import FilmSculptPanel from "./components/panels/FilmSculptPanel.jsx";
import FilmCameraPanel from "./components/panels/FilmCameraPanel.jsx";
import NodeMaterialEditor from "./components/panels/NodeMaterialEditor.jsx";
import ClothSimPanel from "./components/panels/ClothSimPanel.jsx";
import DisplacementPanel from "./components/panels/DisplacementPanel.jsx";
import MocapRetargetPanel from "./components/panels/MocapRetargetPanel.jsx";
import CinematicLightingPanel from "./components/panels/CinematicLightingPanel.jsx";
import FilmVolumetricsPanel from "./components/panels/FilmVolumetricsPanel.jsx";
import FilmPathTracerPanel from "./components/panels/FilmPathTracerPanel.jsx";
import RotoscopePanel from "./components/panels/RotoscopePanel.jsx";
import FilmSubdivPanel from "./components/panels/FilmSubdivPanel.jsx";
import FilmRenderPipeline from "./components/panels/FilmRenderPipeline.jsx";
import ProfessionalShell from "./pro-ui/ProfessionalShell";
import FeatureIndexPanel from "./pro-ui/FeatureIndexPanel";
import WORKSPACE_FEATURES from "./pro-ui/workspaceMap";

import { HalfEdgeMesh } from "./mesh/HalfEdgeMesh.js";
import { booleanUnion, booleanSubtract, booleanIntersect } from "./mesh/BooleanOps.js";
import { uvBoxProject, uvSphereProject, uvPlanarProject } from "./mesh/UVUnwrap.js";
import { applySculptStroke, getSculptHit } from "./mesh/SculptEngine.js";
import { createShapeKey, applyShapeKeys } from "./mesh/ShapeKeys.js";
import { createPipe, createGear, buildProceduralMesh, createAssetLibrary, createTourState } from "./mesh/ProceduralMesh.js";
import { generateLOD } from "./mesh/LODSystem.js";
import { createArmature } from "./mesh/ArmatureSystem.js";
import { enterPoseMode, capturePose, applyPose, resetToRestPose, savePoseToLibrary, loadPoseFromLibrary } from "./mesh/PoseMode.js";
import { initWeights } from "./mesh/WeightPainting.js";
import { applyDyntopo, createDynaMeshSettings } from "./mesh/DynamicTopology.js";
import { createAction, createTrack, createStrip, evaluateNLA, pushDownAction, bakeNLA } from "./mesh/NLASystem.js";
import { createStroke, createLayer } from "./mesh/GreasePencil.js";
import { NODE_TYPES, createNode, createGraph, addNode, connectNodes, evaluateGraph } from "./mesh/GeometryNodes.js";
import { createSpline } from "./mesh/CurveSystem.js";
import { applyPreset, applyEdgeWear, applyCavityDirt, MATERIAL_PRESETS } from "./mesh/SmartMaterials.js";
import { createPaintTexture, createPaintCanvas, applyPaintTexture, paintAtUV, fillCanvas, createLayerStack, addLayer, flattenLayers } from "./mesh/TexturePainter.js";
import { bakeAO, bakeNormalMap, bakeCurvature, bakeAllMaps, downloadBakedMap } from "./mesh/TextureBaker.js";
import { createLight, createThreePointLighting, applyTemperature, createVolumericFog, removeFog, applyHDRI, addLightHelper, HDRI_PRESETS } from "./mesh/LightSystem.js";
import { createCamera, saveBookmark, restoreBookmark, setDOF, applyCameraShake, rackFocus, dollyZoom } from "./mesh/CameraSystem.js";
import { applyColorGrade, createPassStack } from "./mesh/PostProcessing.js";
import { DEFAULT_BONE_MAP, retargetFrame, bakeRetargetedAnimation, fixFootSliding, autoDetectBoneMap, getRetargetStats } from "./mesh/MocapRetarget.js";
import { parseBVH, applyBVHFrame, buildAnimationClip, buildSkeletonFromBVH } from "./mesh/BVHImporter.js";
import { stepClothUpgraded, buildFullConstraints, applyWindTurbulence, addSewingConstraint, createSpatialHash } from "./mesh/ClothUpgrade.js";
import { buildGLTFMorphTargets, applyGLTFMorphWeights, extractGLTFAnimations, mergeGLTFScenes, getGLTFStats } from "./mesh/GLTFAdvanced.js";
import { applyGroomBrush, combGroom, cutGroom, curlGroom, smoothGroom, puffGroom } from "./mesh/HairGrooming.js";
import { createHairMaterial, createAnisotropicHairMaterial, applyHairPresetToMesh, HAIR_SHADER_PRESETS } from "./mesh/HairShader.js";
import { addPointLight, addSpotLight, createTightLightingRig } from "./mesh/LightingRuntime.js";
import { createCompositorGraph, createCompositorNode, COMPOSITOR_NODE_TYPES } from "./mesh/NodeCompositor.js";
import { createScene, createSceneObject as createSceneCreatorObject, addObjectToScene, applyEnvironment, SCENE_PRESETS, ENVIRONMENT_PRESETS } from "./mesh/SceneCreator.js";
import { applyBrush, BRUSHES } from "./mesh/SculptBrushes.js";
import { addSculptLayer, createSculptLayer, evaluateSculptLayers, applyClayBrush, applyFlattenBrush, ADVANCED_BRUSHES } from "./mesh/SculptLayers.js";
import { createIKChain } from "./mesh/IKSystem.js";
import { createPathTracerSettings, createVolumetricSettings } from "./mesh/PathTracer.js";
import { generateFibermesh } from "./mesh/FibermeshSystem.js";
import { createInstances } from "./mesh/Instancing.js";
import { fixNormals, createRetopoSettings, removeDoubles, removeDegenerates, fillHoles, fullRepair } from "./mesh/MeshRepair.js";
import { createPBRMaterial, applyPBRMaps, createSSSMaterial, createTransmissionMaterial, createDisplacementTexture, denoiseCanvas, createRenderQueue, addRenderJob, runRenderQueue, applyRenderPreset, applyToneMappingMode, captureFrame, downloadFrame, getRenderStats, RENDER_PRESETS, TONE_MAP_MODES, SSS_PRESETS, TRANSMISSION_PRESETS } from "./mesh/RenderSystem.js";
import { initVCAdvanced, addVCLayer, removeVCLayer, setVCLayerBlendMode, paintVCAdvanced, fillVCLayer, flattenVCLayers, smearVC, blurVCLayer, getVCStats } from "./mesh/VertexColorAdvanced.js";
import { buildRigFromDoppelflex, applyDoppelflexFrame, retargetDoppelflexToSPX, buildThreeSkeletonFromRig, serializeRig, getRigStats, DOPPELFLEX_LANDMARK_MAP } from "./mesh/DoppelflexRig.js";
import { createSSAOPass, createBloomPass, createDOFPass, createChromaticAberrationPass, createPostPassManager } from "./mesh/PostPassShaders.js";
import { applyStrandCollision, createDensityMap, generateBraidPreset, generateBunPreset, generatePonytailPreset, emitHairFromUV, getHairUpgradeStats } from "./mesh/HairUpgrade.js";
import { createParticle, createEmitter, emitParticles, stepEmitter, buildParticleSystem, updateParticleSystem, createDestructionEffect, stepDestructionFrags, getEmitterStats, VFX_PRESETS, EMITTER_TYPES } from "./mesh/VFXSystem.js";
import { createConstraint, applyLookAt, applyFloor, applyStretchTo, applyCopyLocation, applyCopyRotation, applyCopyScale, applyLimitLocation, applyDampedTrack, applyAllConstraints, CONSTRAINT_TYPES } from "./mesh/ConstraintSystem.js";
import { voxelRemesh, quadRemesh, symmetrizeMesh, getRemeshStats } from "./mesh/RemeshSystem.js";
import { createRenderFarm, addRenderFarmJob, cancelRenderJob, runNextRenderJob, getRenderFarmStats, detectWebGPU, getWebGLInfo, applyIBLToScene, setupCascadedShadows, enableShadowsOnScene, createNPROutlinePass } from "./mesh/RenderFarm.js";
import { createAdvancedShapeKey, addAdvancedShapeKey, removeShapeKey, evaluateShapeKeysAdvanced, mirrorShapeKey, blendShapeKeys, driverShapeKey, buildMorphTargetsFromKeys, getShapeKeyStats } from "./mesh/ShapeKeysAdvanced.js";
import { exportOBJ, parseOBJ, importFBXFromBackend, exportFBXToBackend, exportAlembic, exportUSD } from "./mesh/FBXPipeline.js";
import { sendMeshToStreamPireX } from "./mesh/StreamPireXBridge.js";
import { heatMapWeights, bindSkeletonAdvanced, normalizeAllWeights, paintBoneWeight, getBindingStats } from "./mesh/SkeletalBinding.js";
import { initVertexColors, paintVertexColor, fillVertexColor, gradientFillVertexColor } from "./mesh/VertexColorPainter.js";
import { createUDIMLayout, createUDIMTileCanvas, paintUDIM, fillUDIMTile, exportUDIMTile, exportAllUDIMTiles, buildUDIMAtlas, getUDIMStats } from "./mesh/UDIMSystem.js";
import { generateWalkCycle, applyWalkCycleFrame, generateIdleCycle, generateBreathingCycle, WALK_STYLES } from "./mesh/WalkCycleGenerator.js";
import { createVolumetricSettings as createVolSettings, applyVolumetricFog, applyHeightFog, createGodRayEffect, applyAtmospherePreset, ATMOSPHERE_PRESETS } from "./mesh/VolumetricSystem.js";
import { renderBeauty, renderNormalPass, renderDepthPass, renderWireframePass, renderCryptomatte, renderEmissionPass, renderAllPasses, downloadPass, compositePasses } from "./mesh/RenderPasses.js";
import { createMultiresStack, subdivideLevel, setMultiresLevel, bakeDownLevel, applyMultires, getMultiresStats } from "./mesh/MultiresSystem.js";
import { createSplineIK, solveSplineIK, createIKFKBlend, updateIKFKBlend, evaluateNLAAdvanced, buildGLTFAnimationClip, updateShapeKeyDrivers } from "./mesh/AnimationUpgrade.js";
import { createUser, createCommentPin, createVersionSnapshot, restoreVersion, createCollabSession, connectSession, broadcastOperation, disconnectSession, getCollabStats } from "./mesh/CollaborationSystem.js";
import { createBakeBuffer, bakeFrame, restoreFrame, createRigidBody, stepRigidBody, bakeRigidBodies, applyBakedFrame, fractureMesh } from "./mesh/PhysicsBake.js";
import { createSPHParticle, createFluidSettings, stepSPH, emitFluid, buildFluidMesh, createPyroEmitter, stepPyro, getFluidStats, FLUID_PRESETS } from "./mesh/FluidSystem.js";
import { loadAlpha, sampleAlpha, applyAlphaBrush, generateProceduralAlpha } from "./mesh/AlphaBrush.js";
import { createHairShaderMaterial, createToonMaterial, createPBRShaderMaterial, createOutlineMaterial, addOutlineToMesh, createHolographicMaterial, updateHolographicTime, createDissolveMaterial, setDissolveAmount, applyShaderPreset, SHADER_PRESETS } from "./mesh/GLSLShaders.js";
import { quadDominantRetopo, detectHardEdges, applySymmetryRetopo, getRetopoStats } from "./mesh/AutoRetopo.js";
import { createClothWorker, runClothWorker, createSPHWorker, runSPHWorker, createWorkerPool, getWorkerSupport } from "./mesh/WorkerBridge.js";
import { createDynaMeshSettings as createDynaSettings, dynaMeshRemesh, getDynaMeshStats } from "./mesh/DynaMeshSystem.js";
import { createDriver, evaluateDriver, applyAllDrivers, DRIVER_TYPES, DRIVER_PRESETS } from "./mesh/DriverSystem.js";
import { createSphereCollider, createBoxCollider, createPlaneCollider, applyCollisions, applySelfCollision, createCollidersFromMesh } from "./mesh/ClothCollision.js";
import { triangulateNgon, buildNgonGeometry, dissolveEdge, bridgeFaces, gridFill, pokeFace, insetFace, convertNgonsToTris } from "./mesh/NgonSupport.js";
import { createReflectionProbe, updateReflectionProbe, applyProbeToScene, createIrradianceProbe, applySSR, bakeEnvironment, createProbeManager } from "./mesh/EnvironmentProbes.js";
import { registerPlugin, getAllPlugins, initPluginAPI, loadPluginFromURL, createPresetMarketplace, searchPresets, installPreset } from "./mesh/PluginSystem.js";
import { applyTheme, createTourState as createTour, TOUR_STEPS, buildSPXExportPayload, exportToStreamPireX, downloadSPXFile, SHORTCUT_CATEGORIES } from "./mesh/UISystem.js";
import { createHairStrand, emitHair, buildHairLines, buildHairTubes, clumpHair, applyHairPreset, getHairStats, HAIR_PRESETS } from "./mesh/HairSystem.js";
import { exportHairCardsGLB, getHairCardStats } from "./mesh/HairCards.js";
import { createGPUParticleSystem, emitGPUParticles, stepGPUParticles, createForceField, burstEmit, continuousEmit, getGPUParticleStats, FORCE_FIELD_TYPES } from "./mesh/GPUParticles.js";
import { createClothParticle, createCloth, stepCloth, applyClothPreset, resetCloth, getClothStats, CLOTH_PRESETS } from "./mesh/ClothSystem.js";
import { pinVertex, unpinVertex, pinVerticesInRadius, pinTopRow, pinToBone, softPin, getPinnedVertices } from "./mesh/ClothPinning.js";
import { marchingCubes, marchingCubesRemesh, fluidSurfaceMesh, getMarchingCubesStats } from "./mesh/MarchingCubes.js";
import { createSkinnedMesh, bindMeshToArmature, createMixer, playClip } from "./mesh/SkinningSystem.js";
import { createHairPhysicsSettings, stepHairPhysics, addWindForce, addCollider, resetHairToRest, bakeHairPhysics } from "./mesh/HairPhysics.js";
import { optimizeScene, applyProceduralAnimation, createAudioAnalyzer, getSceneStats as getLibStats, PROCEDURAL_ANIMATIONS } from "./mesh/AssetLibrary.js";

import { MaterialEditor } from "./components/MaterialEditor.jsx";
import { UVEditor } from "./components/UVEditor.jsx";
import { TransformGizmo } from "./components/TransformGizmo.js";
import { createSceneObject, buildPrimitiveMesh } from "./components/SceneManager.js";
import { MeshEditorPanel, PropertiesPanel } from "./components/MeshEditorPanel.jsx";
import { SceneOutliner } from "./components/SceneOutliner.jsx";
import { SculptPanel } from "./components/SculptPanel.jsx";
import { ShadingPanel } from "./components/ShadingPanel.jsx";
import { AnimationPanel } from "./components/AnimationPanel.jsx";
import { AnimationTimeline } from "./components/AnimationTimeline.jsx";

import "./App.css";
import "./styles/pro-dark.css";
import UVEditorPanel from "./components/uv/UVEditorPanel.jsx";
import "./styles/uv-editor.css";
import MaterialPanel from "./components/materials/MaterialPanel.jsx";
import "./styles/material-editor.css";
import TexturePaintPanel from "./components/materials/TexturePaintPanel.jsx";
import "./styles/texture-paint.css";
import ClothingPanel from "./components/clothing/ClothingPanel.jsx";
import FabricPanel from "./components/clothing/FabricPanel.jsx";
import "./styles/clothing-editor.css";
import PatternEditorPanel from "./components/clothing/PatternEditorPanel.jsx";
import "./styles/pattern-editor.css";
import HairPanel from "./components/hair/HairPanel.jsx";
import "./styles/hair-editor.css";
import HairAdvancedPanel from "./components/hair/HairAdvancedPanel.jsx";
import "./styles/hair-advanced.css";
import HairFXPanel from "./components/hair/HairFXPanel.jsx";
import CollaboratePanel from "./components/collaboration/CollaboratePanel.jsx";
import LightingCameraPanel from "./components/scene/LightingCameraPanel.jsx";
// ── Gamepad + Pro Mesh ──
import GamepadAnimator from "./components/animation/GamepadAnimator.jsx";
import MotionLibraryPanel from "./components/animation/MotionLibraryPanel";
import ProMeshPanel   from "./components/mesh/ProMeshPanel.jsx";

// ── VFX Panels ──
import FluidPanel            from "./components/vfx/FluidPanel.jsx";
import WeatherPanel          from "./components/vfx/WeatherPanel.jsx";
import DestructionPanel      from "./components/vfx/DestructionPanel.jsx";

// ── World / Generator Panels ──
import EnvironmentGenerator    from "./components/generators/EnvironmentGenerator.jsx";
import CityGenerator          from "./components/generators/CityGenerator.jsx";
import BuildingSimulator      from "./components/generators/BuildingSimulator.jsx";
import PhysicsSimulation      from "./components/generators/PhysicsSimulation.jsx";
import AssetLibraryPanel      from "./components/generators/AssetLibrary.jsx";
import NodeModifierSystem     from "./components/generators/NodeModifierSystem.jsx";
import VRPreviewMode          from "./components/generators/VRPreviewMode.jsx";
import ProceduralCrowdGenerator from "./components/generators/ProceduralCrowdGenerator.jsx";
import TerrainSculpting       from "./components/generators/TerrainSculpting.jsx";
import GreasePencilPanel from "./components/greasepencil/GreasePencilPanel.jsx";
import "./styles/hair-fx.css";
import "./styles/workspace-tools.css";
import AutoRigPanel from "./components/rig/AutoRigPanel.jsx";
import "./styles/autorig.css";
import AdvancedRigPanel from "./components/rig/AdvancedRigPanel.jsx";
import "./styles/advanced-rig.css";
import "./styles/native-workspace-tabs.css";
import RenderWorkspacePanel from "./components/workspace/RenderWorkspacePanel.jsx";

import FaceGeneratorPanel from "./panels/generators/FaceGeneratorPanel.jsx";
import FoliageGeneratorPanel from "./panels/generators/FoliageGeneratorPanel.jsx";
import VehicleGeneratorPanel from "./panels/generators/VehicleGeneratorPanel.jsx";
import CreatureGeneratorPanel from "./panels/generators/CreatureGeneratorPanel.jsx";
import PropGeneratorPanel from "./panels/generators/PropGeneratorPanel.jsx";

import "./styles/render-workspace.css";
import { createDefaultRigGuides, mirrorGuidePoint, guidesToRigSettings } from "./mesh/rig/AutoRigGuides.js";
import MocapWorkspace from "./workspaces/mocap/MocapWorkspace.jsx";
import "./styles/mocap-workspace.css";
import {
  applyCheckerToMesh,
  unwrapBoxProjection,
  exportUVLayoutGLB
} from "./mesh/uv/UVUnwrap.js";
import {

  createQuadCameraSet,
  resizeQuadCameraSet,
  renderViewportSet,
  detectViewportFromPointer,
  getActiveViewportCamera,
  snapCameraToAxis
} from "./mesh/MultiViewportSystem.js";

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
  { id: "icosphere", label: "Icosphere" },
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

function SpxTabGroup({ label, color, tabs }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} style={{position:'relative',flexShrink:0}}>
      <button className="spx-native-workspace-tab" onClick={() => setOpen(v => !v)}
        style={{borderBottom:open?`2px solid ${color}`:'2px solid transparent',color:open?color:undefined}}>
        <span className="spx-native-workspace-tab-label" style={{color:open?color:undefined}}>{label}</span>
        <span style={{fontSize:7,marginLeft:3,color:open?color:'#8b949e'}}>{open?'▲':'▼'}</span>
      </button>
      {open && (
        <div style={{position:'absolute',top:'100%',left:0,zIndex:2000,background:'#0d1117',border:'1px solid #21262d',borderTop:`2px solid ${color}`,borderRadius:'0 0 6px 6px',minWidth:150,boxShadow:'0 8px 24px rgba(0,0,0,0.8)',padding:'4px 0'}}>
          {tabs.map(t => (
            <div key={t.label} onClick={() => { t.fn(); setOpen(false); }}
              style={{padding:'6px 14px',cursor:'pointer',fontSize:10,color:'#8b949e',fontFamily:'JetBrains Mono,monospace',fontWeight:600,letterSpacing:0.3,whiteSpace:'nowrap'}}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color=color;}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#8b949e';}}
            >{t.label}</div>
          ))}
        </div>


            <AutoRigPanel
        open={autoRigOpen}
        onClose={() => setAutoRigOpen(false)}
        sceneRef={sceneRef}
        setStatus={setStatus}
      />

      <AdvancedRigPanel
        open={advancedRigOpen}
        onClose={() => setAdvancedRigOpen(false)}
        sceneRef={sceneRef}
        setStatus={setStatus}
      />


      {/* ── Model Picker ── */}
      {showModelPicker && (
        <div style={{
          position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)",
          zIndex:200, background:"#0a0a14", border:"1px solid #1a2a3a",
          borderRadius:8, padding:"12px 16px", display:"flex", gap:10,
          alignItems:"center", boxShadow:"0 8px 32px rgba(0,0,0,0.8)",
          fontFamily:"JetBrains Mono,monospace",
        }}>
          <span style={{fontSize:10,color:"#5a7088",marginRight:4}}>MODEL</span>
          {[
            { url:"/models/michelle.glb", label:"Michelle", thumb:"👩", desc:"Female character" },
            { url:"/models/xbot.glb",     label:"X Bot",    thumb:"🤖", desc:"Male Mixamo rig" },
            { url:"/models/ybot.glb",     label:"Y Bot",    thumb:"🦾", desc:"Female Mixamo rig" },
          ].map(m => (
            <button key={m.url} onClick={() => loadModelToScene(m.url, m.label)}
              style={{
                display:"flex", flexDirection:"column", alignItems:"center", gap:3,
                padding:"8px 12px", borderRadius:6, cursor:"pointer",
                border:`1px solid ${activeModelUrl===m.url?"#00ffc8":"#1a2a3a"}`,
                background:activeModelUrl===m.url?"#00ffc822":"#070f1a",
                color:activeModelUrl===m.url?"#00ffc8":"#ccc",
                fontFamily:"inherit",
              }}>
              <span style={{fontSize:22}}>{m.thumb}</span>
              <span style={{fontSize:10,fontWeight:700}}>{m.label}</span>
              <span style={{fontSize:8,color:"#5a7088"}}>{m.desc}</span>
            </button>
          ))}
          {/* Upload custom GLB */}
          <label style={{
            display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            padding:"8px 12px", borderRadius:6, cursor:"pointer",
            border:"1px solid #1a2a3a", background:"#070f1a", color:"#ccc",
            fontFamily:"inherit",
          }}>
            <span style={{fontSize:22}}>📂</span>
            <span style={{fontSize:10,fontWeight:700}}>Upload</span>
            <span style={{fontSize:8,color:"#5a7088"}}>Custom GLB</span>
            <input type="file" accept=".glb,.gltf" style={{display:"none"}}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const url = URL.createObjectURL(file);
                loadModelToScene(url, file.name.replace(/\.[^.]+$/,""));
              }} />
          </label>
          {/* Use scene mesh if available */}
          {sceneObjects.length > 0 && (
            <button onClick={() => {
              const first = sceneObjects.find(o => o.mesh);
              if (first) { setActiveObjId(first.id); meshRef.current=first.mesh; setActiveModelUrl(null); setShowModelPicker(false); setStatus("Using scene mesh: "+first.name); }
            }} style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:3,
              padding:"8px 12px", borderRadius:6, cursor:"pointer",
              border:"1px solid #FF6600", background:"#FF660011", color:"#FF6600", fontFamily:"inherit",
            }}>
              <span style={{fontSize:22}}>🎯</span>
              <span style={{fontSize:10,fontWeight:700}}>Use Mine</span>
              <span style={{fontSize:8,color:"#5a7088"}}>Scene mesh</span>
            </button>
          )}
          <button onClick={() => setShowModelPicker(false)}
            style={{alignSelf:"flex-start",background:"none",border:"none",color:"#5a7088",cursor:"pointer",fontSize:16,padding:"2px 6px"}}>✕</button>
        </div>
      )}

      {/* Lighting & Camera Panel */}
      {lightingCameraPanelOpen && (
        <div style={{position:"fixed",top:0,right:0,width:380,height:"100vh",zIndex:60,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <LightingCameraPanel
            sceneRef={sceneRef}
            cameraRef={cameraRef}
            cameras={cameras}
            onApplyFunction={applyFunction}
            onClose={() => setLightingCameraPanelOpen(false)}
          />
        </div>
      )}

      {/* Collaborate Panel */}
      {collaboratePanelOpen && (
        <div style={{position:"fixed",top:60,right:0,width:360,height:"calc(100vh - 60px)",zIndex:50,background:"#0d1117",borderLeft:"1px solid #21262d",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <CollaboratePanel
            sceneObjects={sceneObjects}
            onClose={() => setCollaboratePanelOpen(false)}
          />
        </div>
      )}

      {/* Grease Pencil Panel */}
      {greasePencilPanelOpen && (
        <div style={{position:"fixed",top:148,right:0,width:320,height:"calc(100vh - 148px)",zIndex:55,background:"#0d1117",borderLeft:"1px solid #21262d",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <GreasePencilPanel
            onApplyFunction={applyFunction}
            onClose={() => setGreasePencilPanelOpen(false)}
          />
        </div>
      )}

      
      {/* ══ VFX PANELS ══ */}
      {fluidPanelOpen && (
        <div style={{position:"fixed",top:0,right:0,width:340,height:"100vh",zIndex:60,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <FluidPanel open={fluidPanelOpen} onClose={() => setFluidPanelOpen(false)} sceneRef={sceneRef} setStatus={setStatus} />
        </div>
      )}
      {weatherPanelOpen && (
        <div style={{position:"fixed",top:0,right:0,width:340,height:"100vh",zIndex:60,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <WeatherPanel open={weatherPanelOpen} onClose={() => setWeatherPanelOpen(false)} sceneRef={sceneRef} setStatus={setStatus} />
        </div>
      )}
      {destructionPanelOpen && (
        <div style={{position:"fixed",top:0,right:0,width:360,height:"100vh",zIndex:60,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <DestructionPanel open={destructionPanelOpen} onClose={() => setDestructionPanelOpen(false)} sceneRef={sceneRef} meshRef={meshRef} setStatus={setStatus} onApplyFunction={handleApplyFunction} />
        </div>
      )}

      {/* ══ WORLD / GENERATOR PANELS (full-screen overlays with own viewport) ══ */}
      {envGenOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>🌲 ENVIRONMENT GENERATOR</span>
            <button onClick={() => setEnvGenOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><EnvironmentGenerator /></div>
        </div>
      )}
      {cityGenOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>🏙️ CITY GENERATOR</span>
            <button onClick={() => setCityGenOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><CityGenerator /></div>
        </div>
      )}
      {buildingOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>🏗️ BUILDING SIMULATOR</span>
            <button onClick={() => setBuildingOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><BuildingSimulator /></div>
        </div>
      )}
      {physicsOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#FF6600",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>⚙️ PHYSICS SIMULATION</span>
            <button onClick={() => setPhysicsOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><PhysicsSimulation /></div>
        </div>
      )}
      {assetLibOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>📦 ASSET LIBRARY</span>
            <button onClick={() => setAssetLibOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><AssetLibraryPanel /></div>
        </div>
      )}
      {nodeModOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>🔗 NODE MODIFIER SYSTEM</span>
            <button onClick={() => setNodeModOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><NodeModifierSystem /></div>
        </div>
      )}
      {vrPreviewOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#aa44ff",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>🥽 VR PREVIEW</span>
            <button onClick={() => setVrPreviewOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><VRPreviewMode /></div>
        </div>
      )}
      {crowdGenOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>👥 CROWD GENERATOR</span>
            <button onClick={() => setCrowdGenOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><ProceduralCrowdGenerator /></div>
        </div>
      )}
      {terrainOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8}}>
            <span style={{color:"#44bb77",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>🏔️ TERRAIN SCULPTING</span>
            <button onClick={() => setTerrainOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}><TerrainSculpting /></div>
        </div>
      )}

      

      {/* ── Motion Library BVH + GamepadAnimator event bridge ── */}
      {/* spx:applyBVH is dispatched by MotionLibraryPanel when no bvhImporter prop is passed */}
      {/* spx:openGamepadAnimator is dispatched by MotionLibraryPanel Record New button */}

      {/* ── Gamepad Animator ── */}
      {gamepadOpen && (
        <div style={{position:"fixed",top:0,right:0,width:360,height:"100vh",zIndex:65,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <GamepadAnimator
            open={gamepadOpen}
            onClose={() => setGamepadOpen(false)}
            sceneRef={sceneRef}
            meshRef={meshRef}
            setStatus={setStatus}
            onApplyFunction={handleApplyFunction}
            currentFrame={currentFrame}
            setCurrentFrame={setCurrentFrame}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        </div>
      )}

      {/* ── Pro Mesh Panel (full-screen) ── */}
      {proMeshOpen && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"#06060f",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#0a0a14",borderBottom:"1px solid #1a2a3a",gap:8,flexShrink:0}}>
            <span style={{color:"#00ffc8",fontFamily:"JetBrains Mono,monospace",fontSize:11,fontWeight:700}}>✂ PRO MESH EDITOR</span>
            <span style={{fontSize:9,color:"#5a7088"}}>Best-in-class mesh tools</span>
            <button onClick={() => setProMeshOpen(false)} style={{marginLeft:"auto",background:"none",border:"1px solid #1a2a3a",borderRadius:3,color:"#5a7088",cursor:"pointer",padding:"3px 10px",fontFamily:"JetBrains Mono,monospace",fontSize:10}}>✕ CLOSE</button>
          </div>
          <div style={{flex:1,overflow:"hidden"}}>
            <ProMeshPanel
              open={proMeshOpen}
              onClose={() => setProMeshOpen(false)}
              meshRef={meshRef}
              sceneRef={sceneRef}
              setStatus={setStatus}
              onApplyFunction={handleApplyFunction}
            />
          </div>
        </div>
      )}

      <MocapWorkspace
        open={mocapWorkspaceOpen}
        onClose={() => setMocapWorkspaceOpen(false)}
        onExportGlb={() => window.dispatchEvent(new CustomEvent("spx:mocap-export-glb"))}
      />

      {(faceGenOpen || foliageGenOpen || vehicleGenOpen || creatureGenOpen || propGenOpen) && (
        <div style={{position:"fixed",top:148,right:0,width:320,height:"calc(100vh - 148px)",zIndex:55,background:"#0d1117",borderLeft:"1px solid #21262d",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderBottom:"1px solid #21262d",background:"#161b22"}}>
            <span style={{color:"#00ffc8",fontWeight:700,fontSize:12,fontFamily:"JetBrains Mono,monospace"}}>
              {faceGenOpen?"Face Generator":foliageGenOpen?"Foliage Generator":vehicleGenOpen?"Vehicle Generator":creatureGenOpen?"Creature Generator":"Prop Generator"}
            </span>
            <button onClick={()=>{setFaceGenOpen(false);setFoliageGenOpen(false);setVehicleGenOpen(false);setCreatureGenOpen(false);setPropGenOpen(false);}} style={{background:"none",border:"none",color:"#8b949e",cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:8}}>
            {faceGenOpen && <FaceGeneratorPanel sceneRef={sceneRef} setStatus={setStatus} />}
            {foliageGenOpen && <FoliageGeneratorPanel sceneRef={sceneRef} setStatus={setStatus} />}
            {vehicleGenOpen && <VehicleGeneratorPanel sceneRef={sceneRef} setStatus={setStatus} />}
            {creatureGenOpen && <CreatureGeneratorPanel sceneRef={sceneRef} setStatus={setStatus} />}
            {propGenOpen && <PropGeneratorPanel sceneRef={sceneRef} setStatus={setStatus} />}
          </div>
        </div>
      )}

      <RenderWorkspacePanel
        open={renderWorkspaceOpen}
        onClose={() => setRenderWorkspaceOpen(false)}
        sceneRef={sceneRef}
        canvasRef={canvasRef}
        setStatus={setStatus}
      />

        </div>
      }
      bottomPanel={
        <AnimationTimeline
          currentFrame={currentFrame}
          setCurrentFrame={setCurrentFrame}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          isAutoKey={isAutoKey}
          setAutoKey={setAutoKey}
          videoStartFrame={videoStartFrame}
          videoEndFrame={videoEndFrame}
          setVideoStartFrame={setVideoStartFrame}
          setVideoEndFrame={setVideoEndFrame}
          videoFps={videoFps}
          setVideoFps={setVideoFps}
          sceneObjects={sceneObjects}
          animKeys={animKeys}
          onAddKeyframe={() => handleApplyFunction("add_keyframe")}
        />
      }
    />


  );
}
