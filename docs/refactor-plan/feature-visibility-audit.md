# Feature Visibility Audit

## ClothCollision
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## ClothPinning
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## DoppelflexRig
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## ElectronBridge
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## FBXPipeline
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## GLTFAdvanced
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## HairCards
- Status: **PARTIAL_UI_WIRING**
- Import hits: 1
- Non-import hits: 5
- Sample references:
  - Line 2558: `const handleGenerateHairCards = useCallback(() => {`
  - Line 2561: `const cards = generateHairCards(strands);`
  - Line 2565: `setHairCards(cards);`
  - Line 3563: `const [hairCards, setHairCards] = useState([]);`
  - Line 6664: `<button onClick={handleGenerateHairCards}`

## HairGrooming
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## HairShader
- Status: **PARTIAL_UI_WIRING**
- Import hits: 2
- Non-import hits: 3
- Sample references:
  - Line 1001: `const [hairShaderPreset, setHairShaderPreset] = useState("natural");`
  - Line 1575: `if (obj.isMesh) obj.material = createHairShaderMaterial({`
  - Line 6654: `<button key={k} onClick={() => setHairShaderPreset(k)}`

## HalfEdgeMesh
- Status: **PARTIAL_UI_WIRING**
- Import hits: 1
- Non-import hits: 4
- Sample references:
  - Line 459: `heMeshRef.current = HalfEdgeMesh.fromBufferGeometry(geo);`
  - Line 495: `const heMesh = HalfEdgeMesh.fromBufferGeometry(geo);`
  - Line 846: `heMeshRef.current = HalfEdgeMesh.fromBufferGeometry(child.geometry);`
  - Line 1387: `heMeshRef.current = HalfEdgeMesh.fromBufferGeometry(result.geometry);`

## MocapRetarget
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## NgonSupport
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## NodeCompositor
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## PhysicsBake
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## PostPassShaders
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## ProceduralMesh
- Status: **PARTIAL_UI_WIRING**
- Import hits: 1
- Non-import hits: 4
- Sample references:
  - Line 3783: `const addProceduralMesh = useCallback(() => {`
  - Line 3795: `const mesh = buildProceduralMesh(geo);`
  - Line 7874: `<button onClick={addProceduralMesh}`
  - Line 8082: `<button onClick={addProceduralMesh} style={{width:"100%",padding:"4px",background:"#3d5a80",border:"none",color:"#fff",borderRadius:2,cursor:"pointer",fontSize:9,fontWeight:700}}>+ Generate {procType}</button>`

## SculptEngine
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## SculptLayers
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## ShapeKeys
- Status: **PARTIAL_UI_WIRING**
- Import hits: 2
- Non-import hits: 11
- Sample references:
  - Line 333: `const [shapeKeys, setShapeKeys] = useState([]);`
  - Line 3852: `setShapeKeys([...next]);`
  - Line 3862: `setShapeKeys([...next]);`
  - Line 3870: `setShapeKeys([...next]);`
  - Line 3871: `const mesh = meshRef.current; if (mesh) applyShapeKeys(mesh, next);`

## ShapeKeysAdvanced
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## SkeletalBinding
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## SmartMaterials
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## UVUnwrap
- Status: **PARTIAL_UI_WIRING**
- Import hits: 1
- Non-import hits: 4
- Sample references:
  - Line 1394: `const applyUVUnwrap = useCallback((projection) => {`
  - Line 1416: `applyUVUnwrap("box");`
  - Line 1421: `}, [applyUVUnwrap]);`
  - Line 8192: `onUVUnwrap={applyUVUnwrap}`

## VertexColorPainter
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## WalkCycleGenerator
- Status: **IMPORT_ONLY**
- Import hits: 1
- Non-import hits: 0

## WeightPainting
- Status: **PARTIAL_UI_WIRING**
- Import hits: 1
- Non-import hits: 3
- Sample references:
  - Line 3266: `setWeightPainting(true);`
  - Line 3490: `const [weightPainting, setWeightPainting] = useState(false);`
  - Line 4263: `<button title="Weight Paint" onClick={() => { handleEnterWeightPaint(); setWeightPainting(w => !w); }}`
