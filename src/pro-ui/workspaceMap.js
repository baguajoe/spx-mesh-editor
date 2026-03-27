const WORKSPACE_FEATURES = {
  Modeling: [
    { id: 'retopo', label: 'Retopology', icon: '🕸️' },
    { id: 'dyntopo', label: 'Dynamic Topology', icon: '🌋' },
    { id: 'boolean', label: 'Boolean Ops', icon: '🧩' },
    { id: 'repair', label: 'Mesh Repair', icon: '🛠️' }
  ],
  Sculpting: [
    { id: 'clay', label: 'Clay Strips', icon: '🖌️' },
    { id: 'dyntopo_sculpt', label: 'Live Subdivide', icon: '📈' },
    { id: 'mask', label: 'Masking', icon: '🎭' }
  ],
  Rendering: [
    { id: 'path_tracer', label: 'Path Tracer', icon: '🔦' },
    { id: 'volumetrics', label: 'Volumetric Fog', icon: '🌫️' },
    { id: 'post_stack', label: 'FX Stack', icon: '🎞️' }
  ],
  Animation: [
    { id: 'mocap', label: 'Mocap Retarget', icon: '🏃' },
    { id: 'ik_system', label: 'IK Solver', icon: '⛓️' },
    { id: 'nla', label: 'NLA Editor', icon: '📑' }
  ]
};
export default WORKSPACE_FEATURES;
