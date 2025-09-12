
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Dispatch, SetStateAction } from "react";
import { Button, Collapse, Input } from "antd";
import { ShenaiSdkState } from "./ShenAiComponent";
import styles from "../styles/Home.module.css";
import {
  InitializationSettingsComponent,
  getInitializationSettingsSnippetCode,
} from "./InitializationSettings";
import { CodeSnippet } from "./CodeSnippet";
import { LoadingOutlined } from "@ant-design/icons";
import {
  CustomColorTheme,
  CustomMeasurementConfig,
  InitializationSettings,
  ShenaiSDK,
} from "shenai-sdk";
const { Panel } = Collapse;

export const InitializationView: React.FC<{
  shenaiSDK: ShenaiSDK | undefined;
  pendingInitialization: boolean;
  initializationSettings: InitializationSettings | undefined;
  setInitializationSettings: Dispatch<
    SetStateAction<InitializationSettings | undefined>
  >;
  initializeSdk: (
    apiKey: string,
    settings: InitializationSettings,
    onSuccess?: () => void
  ) => void;
  colorTheme: CustomColorTheme;
  customConfig: CustomMeasurementConfig | undefined;
  sdkState?: ShenaiSdkState;
  apiKey: string;
  setApiKey: (key: string) => void;
}> = ({
  shenaiSDK,
  pendingInitialization,
  initializationSettings,
  setInitializationSettings,
  initializeSdk,
  colorTheme,
  customConfig,
  sdkState,
  apiKey,
  setApiKey,
}) => {
  const initialize = () => {
    initializeSdk(apiKey, initializationSettings ?? {}, () => {
      if (!shenaiSDK) return;
      shenaiSDK.setCustomColorTheme(colorTheme);
      if (
        initializationSettings?.measurementPreset ==
          shenaiSDK.MeasurementPreset.CUSTOM &&
        customConfig
      ) {
        shenaiSDK.setCustomMeasurementConfig(customConfig);
      }
    });
  };
  initialize()
  const initializationDisabled =
    !shenaiSDK || sdkState?.isInitialized === true || pendingInitialization;

  return (
    <>
     
    </>
  );
};
