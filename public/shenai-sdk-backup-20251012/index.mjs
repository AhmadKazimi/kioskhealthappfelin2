import {
  initSentry,
  createPreloadDisplay,
  setLoadingProgressCallback,
  ensureBrowserCompatibility,
  ensureCameraAccess,
} from "./util/index.mjs";
import CreateShenaiSDK from "./shenai_sdk.mjs";
import { _initEnums } from "./enums/init.js";

async function CheckBrowserAndCreateShenaiSDK(...args) {
  const config = args[0] && typeof args[0] === "object" ? args[0] : {};
  if (config.enableErrorReporting !== false) {
    initSentry();
  }
  if (
    config.onWasmLoadingProgress &&
    typeof config.onWasmLoadingProgress === "function"
  ) {
    setLoadingProgressCallback(config.onWasmLoadingProgress);
  }
  if (config.enablePreloadDisplay !== false) {
    if (
      config.preloadDisplayCanvasId &&
      typeof config.preloadDisplayCanvasId === "string"
    ) {
      createPreloadDisplay(config.preloadDisplayCanvasId);
    } else {
      createPreloadDisplay("mxcanvas");
    }
  }
  ensureBrowserCompatibility();
  await ensureCameraAccess();
  const sdk = await CreateShenaiSDK(...args);
  _initEnums(sdk);
  return sdk;
}

export { createPreloadDisplay };
export * from "./enums/index.js";

export default CheckBrowserAndCreateShenaiSDK;
