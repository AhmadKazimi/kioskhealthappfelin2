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
  private captureTimeout: NodeJS.Timeout | null = null;
  private isCapturing: boolean = false;
  private frameCount: number = 0; // Track total frames sent

  async initialize(
    videoElement: HTMLVideoElement | null,
    options: FrameCaptureOptions = { width: 640, height: 480, fps: 30 }
  ): Promise<void> {
    // Validate video element
    if (!videoElement) {
      throw new Error('Video element is null. Ensure the video element is rendered before initializing camera.');
    }

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

      if (!this.videoElement) {
        throw new Error('Video element became null during initialization');
      }

      this.videoElement.srcObject = this.stream;

      // Wait for video metadata to load before playing
      // This prevents AbortError: "play() interrupted by new load request"
      await new Promise<void>((resolve, reject) => {
        if (!this.videoElement) {
          reject(new Error('Video element is null'));
          return;
        }

        const handleLoadedMetadata = () => {
          console.log('✅ Video metadata loaded');
          resolve();
        };

        const handleError = (err: Event) => {
          console.error('❌ Video loading error:', err);
          reject(new Error('Failed to load video'));
        };

        this.videoElement.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        this.videoElement.addEventListener('error', handleError, { once: true });

        // Timeout after 5 seconds
        setTimeout(() => {
          this.videoElement?.removeEventListener('loadedmetadata', handleLoadedMetadata);
          this.videoElement?.removeEventListener('error', handleError);
          reject(new Error('Video metadata loading timeout'));
        }, 5000);
      });

      // Now play the video
      console.log('▶️ Starting video playback...');
      await this.videoElement.play();
      console.log('✅ Video playback started successfully');
      console.log('📹 Video dimensions:', this.videoElement.videoWidth, 'x', this.videoElement.videoHeight);
      console.log('📹 Video readyState:', this.videoElement.readyState);
      console.log('📹 Video paused:', this.videoElement.paused);

      // Setup canvas for frame capture
      this.canvas = document.createElement('canvas');
      this.canvas.width = options.width;
      this.canvas.height = options.height;
      this.context = this.canvas.getContext('2d');
      console.log('🎨 Canvas created:', options.width, 'x', options.height);

    } catch (error) {
      throw new Error(`Failed to access camera: ${error}`);
    }
  }

  startCapture(
    onFrame: (base64Image: string, timeStamp: number) => number,
    fps: number = 30
  ): void {
    if (!this.videoElement || !this.canvas || !this.context) {
      throw new Error('Frame capture not initialized');
    }

    this.isCapturing = true;
    this.frameCount = 0; // Reset frame counter
    const FPS = fps;
    const targetInterval = 1000 / FPS; // Target milliseconds between frames
    let lastFrameTime = performance.now();
    
    console.log(`📹 Starting frame capture at ${FPS} FPS (${targetInterval.toFixed(2)}ms interval)`);

    const captureFrame = () => {
      if (!this.isCapturing || !this.videoElement || !this.canvas || !this.context) {
        return;
      }

      const now = performance.now();
      const elapsed = now - lastFrameTime;

      // Only capture if enough time has elapsed (maintain target FPS)
      if (elapsed >= targetInterval) {
        // Capture timestamp BEFORE processing
        const timeStamp = Date.now();

        // Flip the image horizontally (mirror)
        this.context.save();
        this.context.scale(-1, 1); // Flip horizontally
        this.context.drawImage(
          this.videoElement,
          -this.canvas.width, // Compensate for flip
          0,
          this.canvas.width,
          this.canvas.height
        );
        this.context.restore();

        // Convert canvas to base64 WITH data URI prefix
        // Use JPEG quality 0.7 for faster encoding (balance quality vs speed)
        const base64Image = this.canvas.toDataURL('image/jpeg', 0.7);

        // Send frame and get processing time
        const processingTime = onFrame(base64Image, timeStamp) ?? 0;
        this.frameCount++;

        // Track actual FPS every 30 frames
        if (this.frameCount % 30 === 0) {
          const actualFPS = 1000 / elapsed;
          console.log(`📊 Frame #${this.frameCount} | Target: ${FPS} FPS | Actual: ${actualFPS.toFixed(1)} FPS | Processing: ${processingTime.toFixed(1)}ms`);
        }

        // Update last frame time (account for any overshoot)
        lastFrameTime = now - (elapsed % targetInterval);
      }

      // Use setTimeout with 0 delay for maximum frame rate
      // The elapsed time check above controls actual FPS
      this.captureTimeout = setTimeout(captureFrame, 0);
    };

    // Start capturing immediately
    setTimeout(captureFrame, 0);
  }

  stopCapture(): void {
    if (this.isCapturing || this.captureTimeout) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🛑 STOPPING FRAME CAPTURE');
      console.log(`📊 Total frames sent: ${this.frameCount}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      this.isCapturing = false;
      
      if (this.captureTimeout) {
        clearTimeout(this.captureTimeout);
        this.captureTimeout = null;
      }

      console.log('✅ Frame capture stopped');
      console.log('✅ No more frames will be sent');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
