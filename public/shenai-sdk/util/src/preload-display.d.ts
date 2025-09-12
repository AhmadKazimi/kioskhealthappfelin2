declare global {
    interface Window {
        MxUpdatePreloadDisplay: (text: string, timestamp?: number) => void;
        MxClosePreloadDisplay: () => void;
    }
}
export declare function createPreloadDisplay(canvasId: string): void;
export declare function updatePreloadDisplay(text: string, timestamp?: number): void;
