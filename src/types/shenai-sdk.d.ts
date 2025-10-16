// Type declarations for ShenAI SDK dynamic imports
/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'shenai-sdk' {
  // Minimal ambient typings to satisfy imports; runtime is provided via /public/shenai-sdk
  export type ShenaiSDK = any;
  export type InitializationSettings = any;
  export type CustomMeasurementConfig = any;
  export type CustomColorTheme = any;
  export type CameraMode = any;
  export type OperatingMode = any;
  export type PrecisionMode = any;
  export type MeasurementPreset = any;
  export type FaceState = any;
  export type NormalizedFaceBbox = any;
  export type MeasurementState = any;
  export type MeasurementResults = any;
  export type Heartbeat = any;
  export type Screen = any;

  const _default: any;
  export default _default;
}

declare module '/shenai-sdk/*' {
  const content: any;
  export default content;
}

declare module '/shenai-sdk/index.mjs' {
  const CreateShenaiSDK: any;
  export default CreateShenaiSDK;
}
