import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";
import { deskAPI } from "../api";

type DeskSession = { deskId: string; signature: string } | null;

interface ScannerContextType {
  scannerMode: boolean;
  deskSession: DeskSession;
  scannerConnected: boolean;
  socket: Socket | null;
  enableScannerMode: () => Promise<void>;
  disableScannerMode: () => void;
}

const ScannerContext = createContext<ScannerContextType | null>(null);

export const ScannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scannerMode, setScannerMode] = useState(false);
  const [deskSession, setDeskSession] = useState<DeskSession>(null);
  const [scannerConnected, setScannerConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  

  const connectSocket = (session: { deskId: string; signature: string }) => {
    const socket = io( import.meta.env.VITE_API_BASE?.replace("inf/api/acc", "") || `${window.location.protocol}//${window.location.hostname}:3000`, { path: "/api/accommodationsocket" } );
    socketRef.current = socket;
    socket.emit("join-desk", session);

    socket.off("desk-joined").on("desk-joined", () => toast.success("Scanner mode enabled"));
    socket.off("scanner-connected").on("scanner-connected", () => {
      setScannerConnected(true);
      toast.success("Mobile scanner connected");
    });
    socket.off("scanner-disconnected").on("scanner-disconnected", () => {
      setScannerConnected(false);
      toast("Mobile scanner disconnected", { icon: "⚠️" });
    });
    socket.off("error").on("error", ({ message }: { message: string }) => toast.error(message));
  };

  const enableScannerMode = async () => {
    try {
      const response = await deskAPI.createSession();
      const { deskId, signature } = response.data;

      const session = { deskId, signature };
      setDeskSession(session);
      setScannerMode(true);

      //persist session in localStorage
      localStorage.setItem("scannerSession", JSON.stringify(session));

      connectSocket(session);
    } catch (error: any) {
      console.error("Error enabling scanner mode:", error);
      toast.error("Failed to enable scanner mode");
    }
  };

  const disableScannerMode = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setScannerMode(false);
    setDeskSession(null);
    setScannerConnected(false);

    // clear localStorage
    localStorage.removeItem("scannerSession");

    toast.success("Scanner mode disabled");
  };

  // restore session on refresh
  useEffect(() => {
    const saved = localStorage.getItem("scannerSession");
    if (saved) {
      const parsed = JSON.parse(saved);
      setDeskSession(parsed);
      setScannerMode(true);
      connectSocket(parsed);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <ScannerContext.Provider
      value={{
        scannerMode,
        deskSession,
        scannerConnected,
        socket: socketRef.current,
        enableScannerMode,
        disableScannerMode,
      }}
    >
      {children}
    </ScannerContext.Provider>
  );
};

export const useScanner = () => {
  const ctx = useContext(ScannerContext);
  if (!ctx) throw new Error("useScanner must be used within ScannerProvider");
  return ctx;
};

export default ScannerContext;