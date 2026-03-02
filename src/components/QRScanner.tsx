"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState, CameraDevice } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QRScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function QRScanner({ onScan, onError, className = "" }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras()
      .then((devices: CameraDevice[]) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back camera on mobile
          const backCamera = devices.find(
            (d: CameraDevice) =>
              d.label.toLowerCase().includes("back") ||
              d.label.toLowerCase().includes("rear")
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
          setHasPermission(true);
        } else {
          setHasPermission(false);
        }
      })
      .catch((err: Error) => {
        console.error("Camera access error:", err);
        setHasPermission(false);
        onError?.("Camera access denied");
      });

    return () => {
      stopScanning();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanning = async () => {
    if (!selectedCamera || !containerRef.current) return;

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText: string) => {
          // Successfully scanned
          onScan(decodedText);
          // Optionally stop after successful scan
          // stopScanning();
        },
        (_errorMessage: string) => {
          // Ignore continuous scanning errors
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Scanner start error:", err);
      onError?.("Failed to start camera");
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current = null;
      } catch (err) {
        console.error("Scanner stop error:", err);
      }
    }
    setIsScanning(false);
  };

  const toggleScanning = () => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  };

  const switchCamera = () => {
    const currentIndex = cameras.findIndex((c) => c.id === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCamera(cameras[nextIndex].id);

    if (isScanning) {
      stopScanning().then(() => {
        setTimeout(() => startScanning(), 100);
      });
    }
  };

  if (hasPermission === false) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <CameraOff className="w-16 h-16 text-slate-500 mx-auto mb-4" />
        <p className="text-slate-400 mb-4">
          Camera access is required for QR scanning.
        </p>
        <p className="text-slate-500 text-sm">
          Please allow camera access in your browser settings.
        </p>
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Checking camera access...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Scanner viewport */}
      <div
        ref={containerRef}
        className="relative aspect-square max-w-md mx-auto bg-slate-900 rounded-lg overflow-hidden"
      >
        <div id="qr-reader" className="w-full h-full" />

        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">Camera is paused</p>
              <Button onClick={startScanning}>
                <Camera className="w-4 h-4 mr-2" />
                Start Scanning
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mt-4">
        <Button
          variant={isScanning ? "destructive" : "default"}
          onClick={toggleScanning}
        >
          {isScanning ? (
            <>
              <CameraOff className="w-4 h-4 mr-2" />
              Stop Camera
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 mr-2" />
              Start Camera
            </>
          )}
        </Button>

        {cameras.length > 1 && (
          <Button variant="outline" onClick={switchCamera} disabled={!isScanning}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Switch Camera
          </Button>
        )}
      </div>

      {/* Scanning indicator */}
      {isScanning && (
        <p className="text-center text-green-400 text-sm mt-4 animate-pulse">
          Point camera at QR code to scan...
        </p>
      )}
    </div>
  );
}
