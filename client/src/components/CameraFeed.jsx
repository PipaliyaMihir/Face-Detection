import { useRef, useEffect, useState, useCallback } from 'react';
import { HiOutlineVideoCamera, HiOutlineVideoCameraSlash } from 'react-icons/hi2';
import { recognizeFace } from '../api/api';

export default function CameraFeed({ isActive, onAttendanceMarked }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [faces, setFaces] = useState([]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setCameraError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setFaces([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Draw frame + bounding boxes
  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw video frame (mirrored)
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw face bounding boxes
    faces.forEach((face) => {
      const { box, name, matched } = face;
      if (!box) return;

      // Convert backend format {top, right, bottom, left} to {x, y, w, h}
      const x = canvas.width - box.right; // Mirror X for selfie camera
      const y = box.top;
      const w = box.right - box.left;
      const h = box.bottom - box.top;

      ctx.save();
      if (matched) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
        ctx.shadowBlur = 20;
      } else {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
        ctx.shadowBlur = 10;
      }

      // Draw rounded rect
      const r = 8;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Draw name label
      const label = matched ? name : 'Unknown';
      ctx.save();
      ctx.font = '600 14px Inter, sans-serif';
      const textWidth = ctx.measureText(label).width;
      const pillW = textWidth + 20;
      const pillH = 28;
      const pillX = x + (w - pillW) / 2;
      const pillY = y - pillH - 6;

      ctx.fillStyle = matched
        ? 'rgba(16, 185, 129, 0.9)'
        : 'rgba(239, 68, 68, 0.9)';
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 8);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, pillX + pillW / 2, pillY + pillH / 2);
      ctx.restore();
    });
  }, [faces]);

  // Capture frame and send to backend
  const captureAndRecognize = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || isLoading) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = video.videoWidth || 640;
    offscreen.height = video.videoHeight || 480;
    const offCtx = offscreen.getContext('2d');
    offCtx.drawImage(video, 0, 0, offscreen.width, offscreen.height);

    offscreen.toBlob(
      async (blob) => {
        if (!blob) return;
        setIsLoading(true);
        try {
          const response = await recognizeFace(blob);
          const data = response.data;

          if (data.faces && Array.isArray(data.faces)) {
            setFaces(data.faces);

            // Only notify when attendance is NEWLY marked (not every frame)
            if (data.attendance_marked && data.attendance_marked.length > 0) {
              data.attendance_marked.forEach((item) => {
                if (typeof item === 'object') {
                  onAttendanceMarked?.(item);
                } else {
                  // Fallback for string names
                  const matchedFace = data.faces.find((f) => f.name === item && f.matched);
                  onAttendanceMarked?.({
                    name: item,
                    person_id: matchedFace?.person_id,
                    time: new Date().toLocaleTimeString(),
                    type: 'check_in',
                    status: 'Present'
                  });
                }
              });
            }
          } else {
            setFaces(data.faces || []);
          }
        } catch (err) {
          console.log('Recognition cycle:', err?.response?.data?.detail || err.message);
        } finally {
          setIsLoading(false);
        }
      },
      'image/jpeg',
      0.8
    );
  }, [isLoading, onAttendanceMarked]);

  // Start / Stop camera based on isActive
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive, startCamera, stopCamera]);

  // Animation loop for drawing
  useEffect(() => {
    if (!isActive) return;
    let animId;
    const loop = () => {
      drawFrame();
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animId);
  }, [isActive, drawFrame]);

  // Recognition interval (every 500ms)
  useEffect(() => {
    if (!isActive) return;
    intervalRef.current = setInterval(captureAndRecognize, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, captureAndRecognize]);

  return (
    <div className="relative w-full">
      <div className="relative glass-card overflow-hidden">
        {/* Corner brackets */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-lg z-10" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-lg z-10" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-lg z-10" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-cyan-400/60 rounded-br-lg z-10" />

        <video ref={videoRef} className="hidden" autoPlay playsInline muted />

        {isActive && !cameraError ? (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full rounded-2xl"
              style={{ aspectRatio: '4/3' }}
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
              <div
                className="scan-line absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                style={{ boxShadow: '0 0 15px rgba(0, 212, 255, 0.4)' }}
              />
            </div>
            {/* Status indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-dark-900/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-10">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-300 font-medium">
                {isLoading ? 'Scanning...' : 'Live'}
              </span>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center bg-dark-800/40 rounded-2xl"
            style={{ aspectRatio: '4/3' }}
          >
            {cameraError ? (
              <>
                <HiOutlineVideoCameraSlash className="text-5xl text-red-400 mb-3" />
                <p className="text-red-400 text-sm text-center px-4">{cameraError}</p>
              </>
            ) : (
              <>
                <HiOutlineVideoCamera className="text-5xl text-gray-600 mb-3" />
                <p className="text-gray-500 text-sm">Camera is off</p>
                <p className="text-gray-600 text-xs mt-1">Click &quot;Start Camera&quot; to begin</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
