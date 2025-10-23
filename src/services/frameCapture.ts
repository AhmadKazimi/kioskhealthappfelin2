import { ZoomIn } from "lucide-react";

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
  private currentFacingMode: 'user' | 'environment' = 'environment';
  private options: FrameCaptureOptions = { width: 640, height: 480, fps: 15 };

  /**
   * Helper method to find the desired back camera ID.
   * It prioritizes the "wide" camera, as it's typically the main lens.
   */
  private async getEnvironmentCameraId(): Promise<string | undefined> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');

      // Find all back-facing cameras
      const backCameras = videoDevices.filter((device) =>
        device.label.toLowerCase().includes('back')
      );
      
      // If no cameras are explicitly labeled "back", we can make an educated guess.
      // On many mobile devices, the last camera in the list is a back camera.
      if (backCameras.length === 0 && videoDevices.length > 0) {
        console.warn("No camera labeled 'back' found, falling back to the last video device.");
        return videoDevices[videoDevices.length - 1].deviceId;
      }

      // Prefer the "wide" lens if available, as it's the standard non-zoomed lens
      const wideCamera = backCameras.find((device) =>
        device.label.toLowerCase().includes('wide')
      );
      if (wideCamera) {
        console.log('Using wide back camera:', wideCamera.label);
        return wideCamera.deviceId;
      }

      // If no "wide" lens is found, fall back to the first available back camera
      if (backCameras.length > 0) {
        console.log('Using first available back camera:', backCameras[0].label);
        return backCameras[0].deviceId;
      }
    } catch (error) {
      console.error('Could not enumerate devices:', error);
    }
    return undefined;
  }

  async initialize(
    videoElement: HTMLVideoElement | null,
    options: FrameCaptureOptions = { width: 640, height: 480, fps: 15 }
  ): Promise<void> {
    if (!videoElement) {
      throw new Error('Video element is null');
    }

    this.videoElement = videoElement;
    this.options = options;

    try {
      // --- START OF MODIFICATIONS ---

      // 1. Get the specific device ID for the back camera we want.
      const deviceId = await this.getEnvironmentCameraId();

      // 2. Create the video constraints object.
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: options.width },
        height: { ideal: options.height },
      };

      // 3. Add the specific deviceId if found, otherwise fall back to facingMode.
      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId };
      } else {
        videoConstraints.facingMode = { exact: 'environment' };
      }

      // 4. Request the stream with our specific constraints.
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      // --- END OF MODIFICATIONS ---

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

  async switchCamera(): Promise<void> {
    if (!this.videoElement) {
      throw new Error('Video element not initialized');
    }

    // Toggle the facing mode
    this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';

    // Stop the current stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    try {
      // Create video constraints for the new facing mode
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: this.options.width },
        height: { ideal: this.options.height },
        facingMode: { exact: this.currentFacingMode },
      };

      // Request the new stream
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      this.videoElement.srcObject = this.stream;

      // Wait for the video to be ready
      await new Promise<void>((resolve, reject) => {
        if (!this.videoElement) return reject(new Error('Video element is null'));
        this.videoElement.onloadedmetadata = () => resolve();
        this.videoElement.onerror = () => reject(new Error('Failed to load video'));
        setTimeout(() => reject(new Error('Video metadata loading timeout')), 5000);
      });

      await this.videoElement.play();

      // Update canvas dimensions if they changed
      if (this.canvas) {
        this.canvas.width = this.videoElement.videoWidth;
        this.canvas.height = this.videoElement.videoHeight;
      }

    } catch (error) {
      // If switching fails, try to revert to the previous facing mode
      this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
      throw new Error(`Failed to switch camera: ${error}`);
    }
  }

  getCurrentFacingMode(): 'user' | 'environment' {
    return this.currentFacingMode;
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