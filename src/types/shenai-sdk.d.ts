// Type declarations for ShenAI SDK dynamic imports
/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '/shenai-sdk/*' {
  const content: any;
  export default content;
}

declare module '/shenai-sdk/index.mjs' {
  const CreateShenaiSDK: any;
  export default CreateShenaiSDK;
}
