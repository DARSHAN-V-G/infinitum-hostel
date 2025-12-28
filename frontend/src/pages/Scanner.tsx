import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { Html5Qrcode } from 'html5-qrcode';
import { toast, Toaster } from 'react-hot-toast';

const Scanner: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');
  
  const socketRef = useRef<Socket | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const deskId = searchParams.get('deskId');
  const signature = searchParams.get('signature');

  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Check if we're on HTTPS (required for camera access on mobile)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      addDebugLog('Warning: Camera access may not work on HTTP. Consider using HTTPS.');
      toast('⚠️ Camera access works best with HTTPS', { duration: 5000 });
    }

    if (!deskId || !signature) {
      addDebugLog('Invalid scanner link - missing deskId or signature');
      toast.error('Invalid scanner link');
      return;
    }

    addDebugLog(`Connecting to desk: ${deskId}`);
    // Connect to socket
    const socket = io(import.meta.env.VITE_API_BASE?.replace('/api/acc', '') || `${window.location.protocol}//${window.location.hostname}:3000`);
    socketRef.current = socket;

    // Join as scanner
    socket.emit('join-scanner', { deskId, signature });

    // Listen for scanner joined confirmation
    socket.on('scanner-joined', () => {
      addDebugLog('Successfully joined desk session');
      setConnected(true);
      toast.success('Connected to desk');
      startScanner();
    });

    // Listen for desk connection status
    socket.on('desk-disconnected', () => {
      addDebugLog('Desk disconnected');
      toast('Desk disconnected', { icon: '⚠️' });
    });

    // Listen for scan acknowledgment
    socket.on('scan-acknowledged', ({ uniqueId }: { uniqueId: string }) => {
      addDebugLog(`Scan acknowledged: ${uniqueId}`);
      setLastScanned(uniqueId);
      toast.success(`Scanned: ${uniqueId}`);
    });

    // Handle errors
    socket.on('error', ({ message }: { message: string }) => {
      addDebugLog(`Socket error: ${message}`);
      toast.error(message);
    });

    return () => {
      addDebugLog('Cleaning up scanner');
      stopScanner();
      socket.disconnect();
    };
  }, [deskId, signature]);

  const startScanner = async () => {
    try {
      addDebugLog('Checking camera permissions...');
      
      // Check if camera permission is granted
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        addDebugLog(`Camera permission status: ${permission.state}`);
        
        if (permission.state === 'denied') {
          toast.error('Camera permission denied. Please allow camera access.');
          return;
        }
      }

      addDebugLog('Starting scanner...');
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      addDebugLog('Requesting camera permission...');
      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          addDebugLog(`QR Code detected: ${decodedText}`);
          
          try {
            // Try to parse as JSON first (new format)
            const parsedData = JSON.parse(decodedText);
            if (parsedData.type === 'PARTICIPANT' && parsedData.uniqueId) {
              addDebugLog(`Parsed participant QR: ${parsedData.uniqueId}`);
              // Send scanned unique ID to backend
              if (socketRef.current && connected) {
                socketRef.current.emit('scan-participant', { uniqueId: parsedData.uniqueId });
              } else {
                addDebugLog('Socket not connected or not ready');
              }
            } else {
              addDebugLog('Invalid QR code format - missing type or uniqueId');
              toast.error('Invalid QR code format');
            }
          } catch (error) {
            // Fallback to plain text (old format)
            addDebugLog(`Treating as plain text: ${decodedText}`);
            if (socketRef.current && connected) {
              socketRef.current.emit('scan-participant', { uniqueId: decodedText });
            } else {
              addDebugLog('Socket not connected or not ready');
            }
          }
        },
        (errorMessage) => {
          // Log scanning errors for debugging
          addDebugLog(`QR scan error: ${errorMessage}`);
        }
      );

      addDebugLog('Scanner started successfully');
      setScanning(true);
      toast.success('Camera started successfully');
    } catch (error: any) {
      addDebugLog(`Error starting scanner: ${error.message}`);
      console.error('Error starting scanner:', error);
      toast.error(`Failed to start camera: ${error.message || 'Unknown error'}`);
      
      // Try with front camera as fallback
      if (error.message?.includes('environment')) {
        addDebugLog('Trying with front camera...');
        try {
          const html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;
          
          await html5QrCode.start(
            { facingMode: 'user' }, // Use front camera
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              addDebugLog(`QR Code detected (front camera): ${decodedText}`);
              
              try {
                // Try to parse as JSON first (new format)
                const parsedData = JSON.parse(decodedText);
                if (parsedData.type === 'PARTICIPANT' && parsedData.uniqueId) {
                  addDebugLog(`Parsed participant QR (front camera): ${parsedData.uniqueId}`);
                  if (socketRef.current && connected) {
                    socketRef.current.emit('scan-participant', { uniqueId: parsedData.uniqueId });
                  }
                } else {
                  addDebugLog('Invalid QR code format - missing type or uniqueId');
                  toast.error('Invalid QR code format');
                }
              } catch (error) {
                // Fallback to plain text (old format)
                addDebugLog(`Treating as plain text (front camera): ${decodedText}`);
                if (socketRef.current && connected) {
                  socketRef.current.emit('scan-participant', { uniqueId: decodedText });
                }
              }
            },
            (errorMessage) => {
              addDebugLog(`QR scan error (front camera): ${errorMessage}`);
            }
          );
          
          setScanning(true);
          toast.success('Camera started with front camera');
        } catch (fallbackError: any) {
          addDebugLog(`Fallback camera also failed: ${fallbackError.message}`);
          console.error('Fallback camera also failed:', fallbackError);
          toast.error('Camera access denied. Please check permissions.');
        }
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setScanning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <Toaster position="top-center" />
      
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Participant Scanner</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Connected to Desk' : 'Connecting...'}
              </span>
            </div>
            {lastScanned && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Last: {lastScanned}
              </span>
            )}
          </div>
        </div>

        {/* Scanner */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="mb-4 text-center">
            <p className="text-gray-700 font-medium">Scan Participant QR Code</p>
            <p className="text-sm text-gray-500 mt-1">Point camera at the QR code on the participant's profile</p>
          </div>
          
          <div id="qr-reader" className="rounded-lg overflow-hidden"></div>

          {!scanning && (
            <div className="mt-4 text-center space-y-2">
              <button
                onClick={async () => {
                  try {
                    addDebugLog('Requesting camera permission...');
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    stream.getTracks().forEach(track => track.stop()); // Stop immediately
                    addDebugLog('Camera permission granted');
                    toast.success('Camera permission granted');
                  } catch (error: any) {
                    addDebugLog(`Camera permission failed: ${error.message}`);
                    toast.error('Camera permission denied');
                  }
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 mr-2"
              >
                Check Camera
              </button>
              <button
                onClick={startScanner}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Start Scanning
              </button>
            </div>
          )}

          {scanning && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">Scanner active - point at QR code</p>
              <button
                onClick={stopScanner}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Stop Scanner
              </button>
            </div>
          )}

          {/* Manual Input for Testing */}
          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-sm text-gray-600 mb-2">Manual Input (for testing):</p>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter unique ID or JSON data manually"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <button
                onClick={() => {
                  if (manualInput.trim() && socketRef.current && connected) {
                    addDebugLog(`Manual input: ${manualInput}`);
                    
                    try {
                      // Try to parse as JSON first
                      const parsedData = JSON.parse(manualInput.trim());
                      if (parsedData.type === 'PARTICIPANT' && parsedData.uniqueId) {
                        socketRef.current.emit('scan-participant', { uniqueId: parsedData.uniqueId });
                      } else {
                        addDebugLog('Invalid JSON format for manual input');
                        toast.error('Invalid JSON format');
                        return;
                      }
                    } catch (error) {
                      // Fallback to plain text
                      socketRef.current.emit('scan-participant', { uniqueId: manualInput.trim() });
                    }
                    
                    setManualInput('');
                  }
                }}
                disabled={!connected || !manualInput.trim()}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-white/90 rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
            <li>Keep this page open and connected</li>
            <li>Scan each participant's QR code</li>
            <li>Wait for confirmation before next scan</li>
            <li>Details will appear on the desk display</li>
          </ol>
          <p className="text-xs text-gray-600 mt-2">
            Supports both JSON format: <code className="bg-gray-100 px-1 rounded">{"{type: \"PARTICIPANT\", uniqueId: \"...\"}"}</code> and plain text unique IDs
          </p>
          {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
            <p className="text-red-600 text-xs mt-2 font-medium">
              ⚠️ Camera access requires HTTPS. Use a secure connection for best results.
            </p>
          )}
        </div>

        {/* Debug Panel */}
        <div className="mt-4 bg-gray-900/90 rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-white">Debug Logs:</h3>
            <button
              onClick={() => setDebugLogs([])}
              className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
            >
              Clear
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {debugLogs.length === 0 ? (
              <p className="text-gray-400 text-sm">No logs yet...</p>
            ) : (
              debugLogs.map((log, index) => (
                <p key={index} className="text-green-400 text-xs font-mono break-all">
                  {log}
                </p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
