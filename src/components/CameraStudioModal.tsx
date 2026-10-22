import React, { useEffect, useRef, useState } from 'react';

interface CameraStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
  title?: string;
}

export function CameraStudioModal({
  isOpen,
  onClose,
  onCapture,
  title = 'Gabarito de Estúdio PereiraLabs'
}: CameraStudioModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShutterActive, setIsShutterActive] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    stopCamera();
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador ou ambiente sem HTTPS.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1440 }
        },
        audio: false
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Erro ao acessar câmera:', err);
      setHasPermission(false);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Permissão de câmera negada. Habilite o acesso nas permissões do navegador/sistema.'
          : err.message || 'Não foi possível inicializar a câmera.'
      );
    }
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Haptic feedback se suportado
    try {
      navigator.vibrate?.(60);
    } catch {}

    setIsShutterActive(true);
    setTimeout(() => setIsShutterActive(false), 200);

    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;

    // Queremos recortar a região central no padrão 4:3 do gabarito
    let cropWidth = videoWidth;
    let cropHeight = videoWidth * (3 / 4);

    if (cropHeight > videoHeight) {
      cropHeight = videoHeight;
      cropWidth = videoHeight * (4 / 3);
    }

    const startX = (videoWidth - cropWidth) / 2;
    const startY = (videoHeight - cropHeight) / 2;

    const canvas = document.createElement('canvas');
    // Resolução de saída padronizada (1200 x 900)
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Renderiza com interpolação suave
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      video,
      startX,
      startY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const cleanDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    stopCamera();
    onCapture(cleanDataUrl);
    onClose();
  };

  const handleFileInputFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || '');
      stopCamera();
      onCapture(dataUrl);
      onClose();
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="camera-studio-overlay" onClick={onClose}>
      <div className="camera-studio-container" onClick={(e) => e.stopPropagation()}>
        {/* Barra Superior */}
        <div className="camera-studio-header">
          <div className="camera-studio-title">
            <span>📐 {title}</span>
            <small>Proporção 4:3 • Alinhamento Central e Base de Rodas</small>
          </div>
          <button className="camera-studio-btn-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        {/* Viewfinder da Câmera com Gabarito Sobreposto */}
        <div className="camera-studio-viewfinder">
          {hasPermission !== false ? (
            <video
              ref={videoRef}
              className={`camera-video-feed ${isShutterActive ? 'shutter-flash' : ''}`}
              playsInline
              muted
              autoPlay
            />
          ) : (
            <div className="camera-studio-error">
              <span style={{ fontSize: '2.5rem' }}>📷</span>
              <p><strong>Câmera Indisponível</strong></p>
              <small>{errorMessage}</small>
              <div style={{ marginTop: '16px' }}>
                <label className="btn-primary" style={{ cursor: 'pointer' }}>
                  📁 Escolher Foto da Galeria
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileInputFallback}
                  />
                </label>
              </div>
            </div>
          )}

          {/* HUD / GABARITO GRÁFICO (SVG OVERLAY) */}
          <div className="camera-studio-hud">
            {/* Máscara de enquadramento 4:3 */}
            <div className="studio-frame-box">
              {/* Cantoneiras de foco e área segura */}
              <div className="corner-bracket top-left"></div>
              <div className="corner-bracket top-right"></div>
              <div className="corner-bracket bottom-left"></div>
              <div className="corner-bracket bottom-right"></div>

              {/* Linha guia de base para as 4 rodas */}
              <div className="wheel-baseline-guide">
                <div className="wheel-indicator left">⭕</div>
                <div className="wheel-baseline-line">
                  <span>LINHA DE APOIO DAS RODAS</span>
                </div>
                <div className="wheel-indicator right">⭕</div>
              </div>

              {/* Mira central */}
              <div className="center-crosshair"></div>

              {/* Dica no topo do quadro */}
              <div className="studio-hint-pill">
                🚗 Mantenha a miniatura nivelada e sem reflexos
              </div>
            </div>
          </div>
        </div>

        {/* Barra Inferior de Controles */}
        <div className="camera-studio-controls">
          <button
            type="button"
            className="btn-studio-control"
            onClick={handleFlipCamera}
            title="Alternar Câmera"
          >
            🔄 Inverter
          </button>

          <button
            type="button"
            className="btn-studio-shutter"
            onClick={handleCapture}
            disabled={hasPermission === false}
            title="Capturar Foto com Gabarito"
          >
            <div className="shutter-inner"></div>
          </button>

          <label className="btn-studio-control" title="Carregar do dispositivo" style={{ cursor: 'pointer' }}>
            📁 Galeria
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileInputFallback}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
