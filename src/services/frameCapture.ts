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

  /**
   * Universal camera detection for all devices
   * Finds the primary/main back camera on any phone/tablet (iPhone, Android, etc.)
   * Avoids ultra-wide, telephoto, and other specialized cameras
   */
  private async findPrimaryBackCamera(): Promise<string | null> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('📷 Available cameras:', videoDevices.map((d, i) => ({
        index: i,
        label: d.label,
        id: d.deviceId.substring(0, 20) + '...'
      })));
      
      // If only one camera, use it
      if (videoDevices.length === 1) {
        console.log('✅ Only one camera available, using it');
        return videoDevices[0].deviceId;
      }
      
      // Score each camera based on how likely it is to be the primary back camera
      const scoredCameras = videoDevices.map(device => {
        const label = device.label.toLowerCase();
        let score = 0;
        
        // Positive indicators (higher score = more likely to be primary)
        if (label.includes('back')) score += 100;
        if (label.includes('rear')) score += 100;
        if (label.includes('environment')) score += 100;
        
        if (label.includes('main')) score += 50;
        if (label.includes('primary')) score += 50;
        if (label.includes('wide') && !label.includes('ultra')) score += 40;
        if (label.includes('standard')) score += 30;
        if (label.includes('normal')) score += 30;
        
        // Common patterns for first/default camera
        if (label.includes('camera 0')) score += 40;
        if (label.includes('camera0')) score += 40;
        if (label.includes('facing back') && !label.includes('ultra')) score += 40;
        
        // Number patterns (camera 0, camera 1, etc.)
        // Usually camera 0 is primary
        const cameraNumberMatch = label.match(/camera\s*(\d+)/i);
        if (cameraNumberMatch) {
          const cameraNum = parseInt(cameraNumberMatch[1]);
          if (cameraNum === 0) score += 30;
          else if (cameraNum === 1) score += 10; // Could be primary on some devices
        }
        
        // Negative indicators (lower score = less likely to be primary)
        if (label.includes('ultra')) score -= 200; // Ultra-wide is NOT primary
        if (label.includes('telephoto')) score -= 200; // Telephoto is NOT primary
        if (label.includes('tele')) score -= 200;
        if (label.includes('zoom')) score -= 150;
        if (label.includes('macro')) score -= 100;
        if (label.includes('depth')) score -= 100;
        if (label.includes('front')) score -= 300; // Front camera is NOT back
        if (label.includes('selfie')) score -= 300;
        if (label.includes('user')) score -= 300;
        
        // Special handling for specific devices
        // Samsung often uses "camera2 0" for main back camera
        if (label.includes('camera2 0')) score += 60;
        
        return { device, score, label };
      });
      
      // Sort by score (highest first)
      scoredCameras.sort((a, b) => b.score - a.score);
      
      console.log('📊 Camera scores:', scoredCameras.map(c => ({
        label: c.label,
        score: c.score
      })));
      
      // Select the highest scoring camera that has a positive score
      const bestCamera = scoredCameras.find(c => c.score > 0);
      
      if (bestCamera) {
        console.log('✅ Selected primary camera:', bestCamera.device.label, '(score:', bestCamera.score + ')');
        return bestCamera.device.deviceId;
      }
      
      // Fallback: Just find any back-facing camera
      const backCamera = videoDevices.find(device => {
        const label = device.label.toLowerCase();
        return (
          label.includes('back') || 
          label.includes('rear') || 
          label.includes('environment')
        ) && !label.includes('front');
      });
      
      if (backCamera) {
        console.log('✅ Fallback: Selected back camera:', backCamera.label);
        return backCamera.deviceId;
      }
      
      console.log('⚠️ No specific camera found, using browser default');
      return null;
    } catch (error) {
      console.warn('⚠️ Could not enumerate cameras:', error);
      return null;
    }
  }

  async initialize(
    videoElement: HTMLVideoElement | null,
    options: FrameCaptureOptions = { width: 640, height: 480, fps: 30 }
  ): Promise<void> {
    // Validate video element
    if (!videoElement) {
      throw new Error('Video element is null. Ensure the video element is rendered before initializing camera.');
    }

    this.videoElement = videoElement;

    // Get camera stream - prioritize main/primary back camera
    try {
      console.log('🎥 Initializing camera for fingerprint scanning...');
      
      // First, try to find the primary back camera on multi-camera devices
      const primaryCameraId = await this.findPrimaryBackCamera();
      
      // Build video constraints
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: options.width },
        height: { ideal: options.height }
      };
      
      if (primaryCameraId) {
        // Use the specific primary camera we found
        videoConstraints.deviceId = { exact: primaryCameraId };
        console.log('🎯 Using specific primary camera');
      } else {
        // Fallback to facingMode if we couldn't identify a specific camera
        videoConstraints.facingMode = { ideal: 'environment' };
        console.log('🎯 Using facingMode: environment (back camera preferred)');
      }
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
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
      
      // Log which camera is actually being used
      const videoTrack = this.stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        console.log('📷 Camera in use:', {
          label: videoTrack.label,
          facingMode: settings.facingMode || 'unknown',
          resolution: `${settings.width}x${settings.height}`,
          deviceId: settings.deviceId?.substring(0, 20) + '...'
        });
      }

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

        // Draw the frame directly (no flip needed for back camera)
        this.context.drawImage(
          this.videoElement,
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );

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
