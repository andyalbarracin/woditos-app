/**
 * Archivo: QRScanner.tsx
 * Ruta: src/components/QRScanner.tsx
 * Última modificación: 2026-03-09
 * Descripción: Componente de escaneo QR usando la cámara del dispositivo.
 *   - Utiliza html5-qrcode para captura en tiempo real
 *   - Devuelve el valor del QR escaneado via callback
 *   - Maneja permisos de cámara automáticamente
 */

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeResult } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startScanner = async () => {
      if (!containerRef.current) return;

      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string, _decodedResult: Html5QrcodeResult) => {
            // Llamar callback con resultado
            onScan(decodedText);
            // Detener scanner
            scanner.stop().catch(console.error);
          },
          () => {
            // Error de escaneo (QR no encontrado), ignorar
          }
        );
        setIsStarting(false);
      } catch (err: any) {
        console.error('Error starting QR scanner:', err);
        if (err.name === 'NotAllowedError') {
          setError('Permiso de cámara denegado. Habilitá el acceso a la cámara en la configuración del navegador.');
        } else if (err.name === 'NotFoundError') {
          setError('No se encontró ninguna cámara en el dispositivo.');
        } else {
          setError('No se pudo iniciar el escáner. Verificá los permisos de cámara.');
        }
        setIsStarting(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Camera size={20} className="text-primary" />
          <span className="font-display font-bold text-foreground">Escanear QR</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={20} />
        </Button>
      </div>

      {/* Scanner container */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {error ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <Camera size={32} className="text-destructive" />
            </div>
            <p className="text-destructive font-medium">{error}</p>
            <Button onClick={onClose} variant="outline">
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-4">
            {isStarting && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Iniciando cámara...</p>
              </div>
            )}
            <div
              id="qr-reader"
              ref={containerRef}
              className="rounded-xl overflow-hidden bg-card border border-border"
              style={{ width: '100%', minHeight: isStarting ? '0' : '300px' }}
            />
            <p className="text-center text-sm text-muted-foreground">
              Apuntá al código QR del miembro para registrar su asistencia automáticamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
