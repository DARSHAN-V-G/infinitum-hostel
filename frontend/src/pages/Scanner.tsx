import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Html5Qrcode } from 'html5-qrcode';
import { toast, Toaster } from 'react-hot-toast';

const Scanner: React.FC = () => {
  const [searchParams] = useSearchParams();

  // UI state (ONLY for rendering)
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');

  // IMPORTANT: refs for real-time logic
  const socketRef = useRef<Socket | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const connectedRef = useRef(false);
  const pausedRef = useRef(false);
  const lastScanTsRef = useRef(0);

  const deskId = searchParams.get('deskId');
  const signature = searchParams.get('signature');

  const addDebugLog = (msg: string) => {
    console.log(msg);
    setDebugLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  /* ================= SOCKET SETUP ================= */
  useEffect(() => {
    if (!deskId || !signature) {
      toast.error('Invalid scanner link');
      return;
    }

    const socket = io(
      import.meta.env.VITE_API_BASE?.replace('/api/acc', '') ??
        `${window.location.protocol}//${window.location.hostname}:3000`
    );

    socketRef.current = socket;

    socket.emit('join-scanner', { deskId, signature });

    socket.on('scanner-joined', () => {
      addDebugLog('Scanner joined desk');
      connectedRef.current = true;
      setConnected(true);

      // Start scanner AFTER socket is truly ready
      setTimeout(startScanner, 400);
    });

    socket.on('scan-acknowledged', ({ uniqueId }) => {
      addDebugLog(`Scan acknowledged: ${uniqueId}`);
      setLastScanned(uniqueId);

      pausedRef.current = true;
      setPaused(true);

      stopScanner();
      toast('Waiting for desk to clear…', { icon: '⏸️' });
    });

    socket.on('resume-scanning', () => {
      addDebugLog('Resume scanning received');
      pausedRef.current = false;
      setPaused(false);
      startScanner();
    });

    socket.on('desk-disconnected', () => {
      toast.error('Desk disconnected');
      connectedRef.current = false;
      setConnected(false);
    });

    socket.on('error', ({ message }) => {
      toast.error(message);
      addDebugLog(`Socket error: ${message}`);
    });

    return () => {
      stopScanner();
      socket.disconnect();
    };
  }, [deskId, signature]);

  /* ================= SCANNER ================= */
  const startScanner = async () => {
    if (scannerRef.current) return;

    try {
      const qr = new Html5Qrcode('qr-reader');
      scannerRef.current = qr;

      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        onScanSuccess,
        () => {}
      );

      setScanning(true);
      toast.success('Camera started');
    } catch (err: any) {
      toast.error(`Camera error: ${err.message}`);
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
      scannerRef.current.clear();
    } catch {}
    scannerRef.current = null;
    setScanning(false);
  };

  /* ================= SCAN HANDLER ================= */
  const onScanSuccess = (decodedText: string) => {
    // Debounce
    const now = Date.now();
    if (now - lastScanTsRef.current < 1500) return;
    lastScanTsRef.current = now;

    if (pausedRef.current) return;
    if (!connectedRef.current || !socketRef.current) return;

    addDebugLog(`QR detected: ${decodedText}`);

    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.type !== 'PARTICIPANT' || !parsed.uniqueId) {
        toast.error('Invalid participant QR');
        return;
      }
      socketRef.current.emit('scan-participant', {
        uniqueId: parsed.uniqueId,
      });
    } catch {
      // Plain text fallback
      socketRef.current.emit('scan-participant', {
        uniqueId: decodedText.trim(),
      });
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <Toaster position="top-center" />
      <div className="max-w-md mx-auto bg-white rounded-lg p-4 shadow">
        <h1 className="text-xl font-bold mb-2">Participant Scanner</h1>

        <div className="flex items-center gap-2 mb-3">
          <div
            className={`w-3 h-3 rounded-full ${
              connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-sm">
            {connected ? 'Connected to desk' : 'Connecting…'}
          </span>
        </div>

        <div id="qr-reader" className="rounded overflow-hidden" />

        {!scanning && (
          <button
            onClick={startScanner}
            className="mt-4 w-full bg-blue-600 text-white py-2 rounded"
          >
            Start Scanner
          </button>
        )}

        {paused && (
          <p className="mt-3 text-orange-600 text-sm text-center">
            Waiting for desk to clear…
          </p>
        )}

        <div className="mt-4">
          <input
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            placeholder="Manual ID (testing)"
            className="border p-2 w-full mb-2"
          />
          <button
            onClick={() => {
              if (!manualInput.trim()) return;
              socketRef.current?.emit('scan-participant', {
                uniqueId: manualInput.trim(),
              });
              setManualInput('');
            }}
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
