// useMultiCameraMocap.js
// Multi-camera mocap hook — manages multiple camera streams
import { useState, useRef, useCallback, useEffect } from 'react';\n\nconst useMultiCameraMocap = () => {\n  const [cameras, setCameras]           = useState([]);\n  const [streams, setStreams]           = useState({});\n  const [isReady, setIsReady]           = useState(false);\n  const [error, setError]               = useState(null);\n  const streamRefs = useRef({});\n\n  // Enumerate available cameras\n  const enumerateCameras = useCallback(async () => {\n    try {\n      const devices = await navigator.mediaDevices.enumerateDevices();\n      const videoDevices = devices.filter(d => d.kind === 'videoinput');\n      setCameras(videoDevices);\n      return videoDevices;\n    } catch (err) {\n      setError(err.message);\n      return [];\n    }\n  }, []);\n\n  // Start a specific camera stream\n  const startCamera = useCallback(async (deviceId, role = 'body') => {\n    try {\n      const stream = await navigator.mediaDevices.getUserMedia({\n        video: { deviceId: deviceId ? { exact: deviceId } : undefined, width: 640, height: 480 },\n      });\n      streamRefs.current[role] = stream;\n      setStreams(prev => ({ ...prev, [role]: stream }));\n      setIsReady(true);\n      return stream;\n    } catch (err) {\n      setError(err.message);\n      return null;\n    }\n  }, []);\n\n  // Stop a specific camera stream\n  const stopCamera = useCallback((role = 'body') => {
    const stream = streamRefs.current[role];
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      delete streamRefs.current[role];
      setStreams(prev => { const s = { ...prev }; delete s[role]; return s; });
    }
  }, []);

  // Stop all streams on unmount
  useEffect(() => {
    return () => {
      Object.values(streamRefs.current).forEach(stream => {
        stream.getTracks().forEach(t => t.stop());
      });
    };
  }, []);

  // Combine landmarks from multiple cameras (simple average for now)
  const combineLandmarks = useCallback((landmarksA, landmarksB) => {
    if (!landmarksA) return landmarksB;
    if (!landmarksB) return landmarksA;
    return landmarksA.map((lm, i) => ({
      x: (lm.x + (landmarksB[i]?.x || lm.x)) / 2,
      y: (lm.y + (landmarksB[i]?.y || lm.y)) / 2,
      z: (lm.z + (landmarksB[i]?.z || lm.z)) / 2,
      visibility: Math.max(lm.visibility || 0, landmarksB[i]?.visibility || 0),
    }));
  }, []);

  return {
    cameras,
    streams,
    isReady,
    error,
    enumerateCameras,
    startCamera,
    stopCamera,
    combineLandmarks,
  };
};

export default useMultiCameraMocap;
