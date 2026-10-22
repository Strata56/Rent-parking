import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { bookingService } from '../../services/bookingService';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Car, CheckCircle2, XCircle, ArrowLeft, Camera, 
  CameraOff, RefreshCw, MapPin, User, Clock, AlertCircle
} from 'lucide-react';

export default function ScanQR() {
  const [action, setAction] = useState('ENTRY');
  const [barrierState, setBarrierState] = useState('CLOSED');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Camera state
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [permissionDenied, setPermissionDenied] = useState(false);

  const html5QrCodeRef = useRef(null);
  const actionRef = useRef(action);
  actionRef.current = action;

  // Sound feedback using Web Audio API
  const playBeep = (isSuccess = true) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = isSuccess ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 220, audioCtx.currentTime);
      if (isSuccess) {
        osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15);
      }

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (isSuccess ? 0.2 : 0.4));

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + (isSuccess ? 0.2 : 0.4));
    } catch {
      // AudioContext not supported or restricted; safely ignore
    }
  };

  // Discover available camera devices
  const discoverCameras = async () => {
    try {
      setCameraError('');
      setPermissionDenied(false);

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
        } catch (permErr) {
          console.warn('getUserMedia error:', permErr);
          if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
            setPermissionDenied(true);
            setCameraError('Camera permission was blocked by your browser.');
            return;
          }
        }
      }

      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        setSelectedCameraId(devices[0].id);
      } else {
        setCameraError('No video camera detected on this system.');
      }
    } catch (err) {
      console.warn('Camera discovery error:', err);
      if (err.name === 'NotAllowedError' || (err.message && err.message.includes('Permission'))) {
        setPermissionDenied(true);
        setCameraError('Camera access denied by browser.');
      } else {
        setCameraError('Camera initialization failed.');
      }
    }
  };

  useEffect(() => {
    discoverCameras();
    return () => {
      stopCameraScanner();
    };
  }, []);

  // Core API scanner validation
  const executeScan = async (codeToVerify, currentAction) => {
    const cleaned = (codeToVerify || '').trim();
    if (!cleaned) return;

    try {
      setLoading(true);
      setResult(null);

      const res = await bookingService.scanQRBarrier(cleaned, currentAction);
      setResult(res);

      if (res.success) {
        playBeep(true);
        setBarrierState('OPEN');
        // Reset barrier back to closed after 5 seconds
        setTimeout(() => setBarrierState('CLOSED'), 5000);
      } else {
        playBeep(false);
      }
    } catch (err) {
      playBeep(false);
      setResult({
        success: false,
        message: err.response?.data?.detail || err.message || 'Access Denied: Invalid or expired QR pass'
      });
    } finally {
      setLoading(false);
    }
  };

  // Start live optical camera feed
  const startCameraScanner = async (cameraIdToUse) => {
    setCameraError('');
    setPermissionDenied(false);

    try {
      if (html5QrCodeRef.current) {
        await stopCameraScanner();
      }

      const html5QrCode = new Html5Qrcode("qr-camera-feed");
      html5QrCodeRef.current = html5QrCode;

      let targetCamera = cameraIdToUse || selectedCameraId;
      if (!targetCamera) {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
            targetCamera = devices[0].id;
            setSelectedCameraId(targetCamera);
          }
        } catch {
          // Fall through
        }
      }

      const cameraConfig = targetCamera 
        ? { deviceId: { exact: targetCamera } }
        : { facingMode: "user" };

      const qrConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      const onScanSuccess = async (decodedText) => {
        if (decodedText) {
          await stopCameraScanner();
          executeScan(decodedText, actionRef.current);
        }
      };

      try {
        await html5QrCode.start(cameraConfig, qrConfig, onScanSuccess, () => {});
      } catch (firstErr) {
        console.warn('Initial camera start failed, trying facingMode user fallback...', firstErr);
        await html5QrCode.start({ facingMode: "user" }, qrConfig, onScanSuccess, () => {});
      }

      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start camera:', err);
      const isPerm = err.name === 'NotAllowedError' || (err.message && err.message.toLowerCase().includes('permission'));
      if (isPerm) {
        setPermissionDenied(true);
        setCameraError('Camera access was blocked by the browser. Please allow camera permissions.');
      } else {
        setCameraError(`Camera error: ${err.message || 'Unable to open camera'}`);
      }
      setIsScanning(false);
    }
  };

  // Stop camera feed safely
  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      } finally {
        html5QrCodeRef.current = null;
        setIsScanning(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/operator/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-600">Gate Terminal Live</span>
          </div>
        </div>

        {/* Visual Barrier Gate Animation */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
          <div className="absolute top-4 left-6 flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${barrierState === 'OPEN' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-rose-500 shadow-lg shadow-rose-500/50'}`}></span>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
              Barrier Status: {barrierState}
            </span>
          </div>

          <div className="w-full max-w-sm my-6 relative flex items-center justify-center">
            {/* Barrier motor pillar */}
            <div className="w-10 h-28 bg-slate-700 rounded-t-lg border-2 border-slate-600 flex flex-col items-center justify-between p-2 shadow-lg">
              <div className={`w-3.5 h-3.5 rounded-full ${barrierState === 'OPEN' ? 'bg-emerald-500' : 'bg-red-600'}`}></div>
              <span className="text-[8px] font-black text-slate-300">GATE</span>
            </div>

            {/* Barrier arm */}
            <div 
              className={`h-4 rounded-r-lg border-2 border-slate-400 shadow-md origin-left transition-transform duration-700 ${
                barrierState === 'OPEN' ? '-rotate-75 -translate-y-4' : 'rotate-0'
              }`}
              style={{
                width: '220px',
                backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 15px, #ffffff 15px, #ffffff 30px)'
              }}
            ></div>
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            {barrierState === 'OPEN' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ACCESS GRANTED — BARRIER RAISED
              </span>
            ) : (
              <span>HOLD PASS TOWARDS CAMERA</span>
            )}
          </div>
        </div>

        {/* Direction Switcher (Inbound Entry vs Outbound Exit) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Select Barrier Mode:</span>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setAction('ENTRY')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                action === 'ENTRY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-4 h-4" />
              ENTRY (Arrival Check-in)
            </button>
            <button
              onClick={() => setAction('EXIT')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                action === 'EXIT'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-4 h-4 rotate-180" />
              EXIT (Departure Check-out)
            </button>
          </div>
        </div>

        {/* Dedicated Live Optical Camera Scanner */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Camera Pass Scanner</h3>
                <p className="text-slate-500 text-[11px]">Aim phone QR code screen at camera for automatic validation</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cameras.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => {
                    setSelectedCameraId(e.target.value);
                    if (isScanning) startCameraScanner(e.target.value);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Camera (${c.id.substring(0, 8)})`}
                    </option>
                  ))}
                </select>
              )}

              {isScanning ? (
                <button
                  onClick={stopCameraScanner}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <CameraOff className="w-4 h-4" /> Stop Camera
                </button>
              ) : (
                <button
                  onClick={() => startCameraScanner()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Camera className="w-4 h-4" /> Start Camera
                </button>
              )}
            </div>
          </div>

          {/* Browser Camera Permission Alert */}
          {permissionDenied && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Browser Camera Permission Required
              </div>
              <p className="text-amber-800 leading-relaxed">
                To allow your camera:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-amber-900 pl-1">
                <li>Click the <strong>tune / padlock icon</strong> on the left side of your browser address bar (next to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">http://localhost:5173</code>).</li>
                <li>Toggle <strong>Camera</strong> to <strong>Allow</strong>.</li>
                <li>Click <strong>Retry Camera</strong> below.</li>
              </ol>
              <div className="pt-1">
                <button
                  onClick={() => discoverCameras().then(() => startCameraScanner())}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          )}

          {cameraError && !permissionDenied && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Live Camera Viewfinder */}
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-[4/3] max-w-md mx-auto flex items-center justify-center border border-slate-800">
            <div id="qr-camera-feed" className="w-full h-full object-cover"></div>

            {!isScanning && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Camera Offline</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Click "Activate Camera" to start optical scanning of driver tickets.
                  </p>
                </div>
                <button
                  onClick={() => startCameraScanner()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Activate Camera
                </button>
              </div>
            )}

            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Aim Target Box */}
                <div className="w-56 h-56 border-2 border-blue-400 rounded-2xl relative shadow-2xl animate-pulse">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                </div>
                <span className="text-[11px] font-semibold text-white/90 bg-black/60 px-3 py-1 rounded-full mt-3 backdrop-blur-xs">
                  Hold phone QR code inside frame
                </span>
              </div>
            )}
          </div>

          {/* Validation Feedback Card */}
          {result && (
            <div className={`mt-6 p-5 rounded-2xl border text-xs animate-fadeIn ${
              result.success ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-rose-50/80 border-rose-200 text-rose-950'
            }`}>
              <div className="flex items-start gap-3.5">
                {result.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm tracking-tight">
                      {result.success ? `${result.action} APPROVED` : 'SCAN REJECTED'}
                    </h4>
                    {result.success && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase">
                        Gate Unlocked
                      </span>
                    )}
                  </div>
                  
                  <p className="font-medium text-slate-700">{result.message}</p>

                  {result.success && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/70 text-slate-700">
                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-blue-600" /> Bay
                        </span>
                        <span className="font-black text-sm text-blue-700">
                          {result.slot_number || 'A-01'}
                        </span>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block flex items-center gap-1">
                          <Car className="w-3 h-3 text-slate-600" /> Plate
                        </span>
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {result.license_plate || 'MH-03-FH-6926'}
                        </span>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-600" /> Driver
                        </span>
                        <span className="font-bold text-xs text-slate-900 truncate block">
                          {result.driver_name || 'Driver'}
                        </span>
                      </div>

                      <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-600" /> Time Log
                        </span>
                        <span className="font-bold text-[11px] text-slate-900">
                          {new Date(result.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Scan Next Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setResult(null);
                        startCameraScanner();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Scan Next Vehicle
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
