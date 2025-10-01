export interface FrameCaptureOptions {
  width: number;
  height: number;
  fps: number;
}

export class FrameCaptureService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private captureInterval: NodeJS.Timeout | null = null;

  async initialize(
    videoElement: HTMLVideoElement,
    options: FrameCaptureOptions = { width: 640, height: 480, fps: 6 }
  ): Promise<void> {
    this.videoElement = videoElement;

    // Get camera stream
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: options.width },
          height: { ideal: options.height },
          facingMode: 'user'
        },
        audio: false
      });

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      // Setup canvas for frame capture
      this.canvas = document.createElement('canvas');
      this.canvas.width = options.width;
      this.canvas.height = options.height;
      this.context = this.canvas.getContext('2d');

    } catch (error) {
      throw new Error(`Failed to access camera: ${error}`);
    }
  }

  startCapture(
    onFrame: (base64Image: string) => void,
    fps: number = 6
  ): void {
    if (!this.videoElement || !this.canvas || !this.context) {
      throw new Error('Frame capture not initialized');
    }

    const interval = 1000 / fps; // milliseconds between frames

    this.captureInterval = setInterval(() => {
      if (!this.videoElement || !this.canvas || !this.context) return;

      // Draw current video frame to canvas
      this.context.drawImage(
        this.videoElement,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );

      // Convert canvas to base64
      const base64Image = this.canvas.toDataURL('image/jpeg', 0.8);

      // Remove data URL prefix to get pure base64
      const base64Data = base64Image.split(',')[1];

      onFrame(base64Data);
    }, interval);
  }

  stopCapture(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }

  cleanup(): void {
    this.stopCapture();

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.canvas = null;
    this.context = null;
  }
}
