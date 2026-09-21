/**
 * Camera Utility Services for robust MediaStream acquisition,
 * fallback constraint handling, clear error categorization,
 * and virtual demo camera stream generation.
 */

export interface CameraAcquisitionResult {
  stream: MediaStream;
  isSimulated?: boolean;
}

/**
 * Attempts to acquire camera stream using progressive constraint fallbacks.
 */
export async function getResilientCameraStream(): Promise<MediaStream> {
  // Check browser support for mediaDevices
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const isHttps = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isHttps) {
      throw new Error('Camera access requires a secure connection (HTTPS or localhost). Please reload using HTTPS.');
    }
    throw new Error('Your browser does not support media device camera capture.');
  }

  // Fallback constraint configurations from strictest to most lenient
  const constraintTiers: MediaStreamConstraints[] = [
    {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      },
      audio: false
    },
    {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    },
    {
      video: true,
      audio: false
    }
  ];

  let lastError: any = null;

  for (const constraints of constraintTiers) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (err: any) {
      lastError = err;
      // Do not attempt lower tiers if user explicitly denied permission
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        break;
      }
    }
  }

  throw lastError || new Error('Failed to access camera device');
}

/**
 * Parses camera acquisition errors into user-friendly messages.
 */
export function parseCameraError(err: any): string {
  if (!err) return 'Unable to access camera device. Please check your camera hardware.';

  const errName = err.name || '';
  const message = err.message || '';

  if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
    return 'Camera access was denied. Please allow camera permissions in your browser settings (click lock icon in address bar).';
  }

  if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
    return 'No camera hardware found on this device. Please connect a USB webcam or enable Demo Mode below.';
  }

  if (errName === 'NotReadableError' || errName === 'TrackStartError') {
    return 'Camera is in use by another application (Zoom, Teams, etc.). Please close other applications and try again.';
  }

  if (errName === 'OverconstrainedError' || errName === 'ConstraintNotSatisfiedError') {
    return 'Your camera does not meet requested resolution/settings. Trying basic mode...';
  }

  if (errName === 'SecurityError' || message.includes('secure connection')) {
    return 'Camera access requires HTTPS or localhost context.';
  }

  return message || 'Unable to access camera device. Please check your camera hardware.';
}

/**
 * Creates a simulated canvas-based video stream for testing environments without webcam hardware.
 */
export function createSimulatedCameraStream(width = 640, height = 480): { stream: MediaStream; stop: () => void } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  let frameCount = 0;
  let intervalId: any = null;

  const drawFrame = () => {
    frameCount++;
    // Dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Subtle background grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    const centerX = width / 2;
    const centerY = height / 2 - 10;
    const pulse = Math.sin(frameCount * 0.1) * 3;

    // Face Silhouette - Head
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 70 + pulse, 90 + pulse, 0, 0, Math.PI * 2);
    ctx.fill();

    // Face Silhouette - Shoulders
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 160, 140, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(centerX - 25, centerY - 20, 7, 0, Math.PI * 2);
    ctx.arc(centerX + 25, centerY - 20, 7, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY + 15, 25, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // Simulated camera text badge
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(10, 10, 160, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('VIRTUAL CAMERA FEED', 18, 26);
  };

  intervalId = setInterval(drawFrame, 50);

  // Capture stream from canvas
  let stream: MediaStream;
  if (typeof (canvas as any).captureStream === 'function') {
    stream = (canvas as any).captureStream(30);
  } else {
    // Fallback stub MediaStream
    stream = new MediaStream();
  }

  return {
    stream,
    stop: () => {
      if (intervalId) clearInterval(intervalId);
      stream.getTracks().forEach(t => t.stop());
    }
  };
}
