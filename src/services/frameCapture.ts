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

  async initialize(
    videoElement: HTMLVideoElement | null,
    options: FrameCaptureOptions = { width: 640, height: 480, fps: 15 }
  ): Promise<void> {
    if (!videoElement) {
      throw new Error('Video element is null');
    }

    this.videoElement = videoElement;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: options.width },
          height: { ideal: options.height },
        },
        audio: false,
      });

      this.videoElement.srcObject = this.stream;

      await new Promise<void>((resolve, reject) => {
        if (!this.videoElement) return reject(new Error('Video element is null'));
        this.videoElement.onloadedmetadata = () => resolve();
        this.videoElement.onerror = () => reject(new Error('Failed to load video'));
        setTimeout(() => reject(new Error('Video metadata loading timeout')), 5000);
      });

      await this.videoElement.play();

      this.canvas = document.createElement('canvas');
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;
      this.context = this.canvas.getContext('2d');

    } catch (error) {
      throw new Error(`Failed to access camera: ${error}`);
    }
  }

  captureFrame(): string | null {
    if (!this.context || !this.videoElement || !this.canvas) {
      return null;
    }
    this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
    return this.canvas.toDataURL('image/jpeg', 0.7);
  }

  cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }
}
