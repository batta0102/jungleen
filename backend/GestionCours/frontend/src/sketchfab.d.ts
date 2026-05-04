/**
 * Minimal typings for Sketchfab Viewer API (global script).
 * @see https://sketchfab.com/developers/viewer
 */
export {};

declare global {
  interface Window {
    Sketchfab?: new (iframeWindow: Window) => SketchfabViewerClient;
  }

  interface SketchfabViewerClient {
    init(
      modelUid: string,
      options: {
        success?: (api: SketchfabViewerApi) => void;
        error?: (error?: unknown) => void;
        [key: string]: unknown;
      }
    ): void;
  }

  interface SketchfabViewerApi {
    start(): void;
    stop(): void;
    addEventListener(event: string, callback: () => void): void;
  }
}
