import { FingerprintSocketService } from './fingerprintSocketService';

/**
 * Global singleton manager for fingerprint socket connections.
 * Ensures only one socket connection exists at a time across all component instances.
 */
class FingerprintSocketManager {
  private static instance: FingerprintSocketManager;
  private socketService: FingerprintSocketService | null = null;
  private connectionPromise: Promise<FingerprintSocketService> | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private cleanupTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): FingerprintSocketManager {
    if (!FingerprintSocketManager.instance) {
      FingerprintSocketManager.instance = new FingerprintSocketManager();
    }
    return FingerprintSocketManager.instance;
  }

  /**
   * Get or create a socket service instance.
   * CRITICAL: This prevents race conditions by tracking connection state.
   */
  async getOrCreateSocket(initId: string): Promise<FingerprintSocketService> {
    console.log(`[SocketManager] getOrCreateSocket called with ID: ${initId}`);
    console.log(`[SocketManager] Current state: ${this.connectionState}`);
    
    this.clearCleanupTimer();

    // If we're already connected, return immediately
    if (this.connectionState === 'connected' && this.socketService?.isConnected()) {
      console.log(`[SocketManager] ✅ Returning existing connected socket for ID: ${initId}`);
      return this.socketService;
    }

    // If we're currently connecting, wait for that connection to complete
    if (this.connectionState === 'connecting' && this.connectionPromise) {
      console.log(`[SocketManager] ⏳ Already connecting, waiting for existing connection attempt...`);
      return this.connectionPromise;
    }

    // We need to create a new connection
    console.log(`[SocketManager] 🔄 Starting new connection for ID: ${initId}`);
    this.connectionState = 'connecting';
    
    // Create the connection promise that all concurrent calls will share
    this.connectionPromise = this.createSocketConnection()
      .then((service) => {
        this.connectionState = 'connected';
        console.log(`[SocketManager] ✅ Connection established`);
        return service;
      })
      .catch((error) => {
        this.connectionState = 'disconnected';
        this.connectionPromise = null;
        console.error(`[SocketManager] ❌ Connection failed:`, error);
        throw error;
      });

    return this.connectionPromise;
  }

  private async createSocketConnection(): Promise<FingerprintSocketService> {
    // Clean up any existing socket first
    if (this.socketService) {
      console.log(`[SocketManager] Cleaning up existing socket before creating new one`);
      this.socketService.disconnect();
      this.socketService = null;
    }

    this.socketService = new FingerprintSocketService();
    console.log(`[SocketManager] Created new FingerprintSocketService instance`);
    return this.socketService;
  }


  /**
   * Schedule cleanup of the socket connection after a delay.
   * This prevents immediate cleanup when components unmount/remount quickly.
   */
  scheduleCleanup(delay: number = 500): void {
    console.log(`[SocketManager] Scheduling cleanup in ${delay}ms`);
    
    this.clearCleanupTimer();
    
    this.cleanupTimer = setTimeout(() => {
      console.log(`[SocketManager] Executing scheduled cleanup`);
      this.forceCleanup();
    }, delay);
  }

  /**
   * Clear any pending cleanup timer.
   */
  clearCleanupTimer(): void {
    if (this.cleanupTimer) {
      console.log(`[SocketManager] Clearing cleanup timer`);
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Force immediate cleanup of the socket connection.
   */
  forceCleanup(): void {
    console.log(`[SocketManager] Force cleanup called`);
    
    this.clearCleanupTimer();
    
    if (this.socketService) {
      console.log(`[SocketManager] Disconnecting socket service`);
      this.socketService.disconnect();
      this.socketService = null;
    }
    
    this.connectionPromise = null;
    this.connectionState = 'disconnected';
  }

  /**
   * Check if a socket is currently connected.
   */
  isConnected(): boolean {
    return this.socketService?.isConnected() ?? false;
  }

  /**
   * Get the current socket service if it exists and is connected.
   */
  getCurrentSocket(): FingerprintSocketService | null {
    if (this.socketService?.isConnected()) {
      return this.socketService;
    }
    return null;
  }
}

export const fingerprintSocketManager = FingerprintSocketManager.getInstance();
