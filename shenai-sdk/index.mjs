import {
  initSentry,
  createPreloadDisplay,
  ensureBrowserCompatibility,
  ensureCameraAccess,
} from "./util/index.mjs";
import CreateShenaiSDK from "./shenai_sdk.mjs";

initSentry();
createPreloadDisplay("mxcanvas");

async function CheckBrowserAndCreateShenaiSDK(...args) {
  ensureBrowserCompatibility();
  await ensureCameraAccess();
  return CreateShenaiSDK(...args);
}

export { createPreloadDisplay };

export default CheckBrowserAndCreateShenaiSDK;
