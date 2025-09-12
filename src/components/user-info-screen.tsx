/* eslint-disable @typescript-eslint/no-unused-vars */ 
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { UserData } from "./home-screen";
import Swal from "sweetalert2";
import Cookies from 'js-cookie';
import { useTranslation } from "@/hooks/useTranslation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";


interface UserInfoScreenProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function UserInfoScreen({
  userData,
  updateUserData,
  onNext,
  onPrev,
}: UserInfoScreenProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [isLoading, setIsLoading] = useState(false);

  const [age, setAge] = useState<number | ''>(
    userData.age ? Number.parseInt(userData.age) : 22
  );
  
  const [screenWidth, setScreenWidth] = useState(0);
  
  // Effect to handle window resize and update screen width
  useEffect(() => {
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth);
    };
    
    // Set initial width
    updateScreenWidth();
    
    // Add event listener for window resize
    window.addEventListener('resize', updateScreenWidth);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateScreenWidth);
  }, []);
  

  
  // Define gender options with consistent API values
  const genderOptions = [
    { value: 'Male', label: t('userInfo.male') },
    { value: 'Female', label: t('userInfo.female') }
  ];
  
  // Initialize selectedGender and ensure it's always an English API value
  const getInitialGender = () => {
    const currentGender = userData.gender || "";
    // If the stored gender is in Arabic, map it to English
    if (currentGender === "ذكر") return "Male";
    if (currentGender === "أنثى") return "Female";
    // If it's already English or empty, keep it
    return currentGender;
  };
  
  const [selectedGender, setSelectedGender] = useState(getInitialGender());
  

  
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const handleNext = async () => {
    const userId = Cookies.get('userId');

    try {
      setIsLoading(true); 

      const response = await fetch(`${apiUrl}/client/EditClient`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          fullName: userData.personalInfo?.fullName,
          username: userData.personalInfo?.fullName?.replaceAll(" ", "")?.toLocaleLowerCase(),
          email: userData.personalInfo?.email,
          phone: userData.personalInfo?.phone,
          nationalityId: userData.personalInfo?.nationalityId,
          age: age === '' ? '0' : age.toString(),
          gender: selectedGender,
        }),
      }); 

      const responseJson = await response.json();
      if (!responseJson.IsSuccess) {
        await Swal.fire({
          icon: "error",
          title: t('common.error'),
          text: t('common.somethingWentWrong'),
          confirmButtonColor: "#dc2626",
        });
        return;
      }
  
      updateUserData({ age: age === '' ? '0' : age.toString(), gender: selectedGender });
      onNext(); 
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgeClick = (newAge: number) => {
    setAge(newAge);
  };

  const renderSurroundingAges = () => {
    const surroundingAges = [];
    
    // Calculate how many numbers to show based on screen width
    // For larger screens, show more numbers to fill the width
    let range = 3; // Default range
    
    if (screenWidth >= 1920) { // 4K and larger screens
      range = 5;
    } else if (screenWidth >= 1440) { // Large screens
      range = 4;
    } else if (screenWidth >= 1024) { // Medium screens
      range = 3;
    } else if (screenWidth >= 768) { // Small screens
      range = 1;
    } else if (screenWidth >= 640) { // Extra small screens
      range = 1;
    }
    
    // Fallback to default if screenWidth is not yet initialized
    if (screenWidth === 0) {
      range =2;
    }
    
    // Generate numbers from age-range to age+range
    const currentAge = typeof age === 'number' ? age : 0;
    for (let i = currentAge - range; i <= currentAge + range; i++) {
      if (i >= 1 && i <= 100) {
        if (i === currentAge) {
          // Center number - not clickable, just displayed
          surroundingAges.push(
            <span key={i} className="text-[70px] sm:text-[96px]  font-bold text-black">
              {currentAge}
            </span>
          );
        } else {
          // Surrounding numbers - clickable
          const textSizeClass = screenWidth >= 1440 ? "text-[36px]" : 
                               screenWidth >= 1024 ? "text-[24px]" : 
                               screenWidth >= 768 ? "text-[24px]" : "text-[24px]";
          
          surroundingAges.push(
            <span 
              key={i} 
              className={`${textSizeClass} text-gray-400 font-normal cursor-pointer hover:text-blue-500 transition-colors`}
              onClick={() => handleAgeClick(i)}
            >
              {i}
            </span>
          );
        }
      }
    }
    return surroundingAges;
  };

  return (
    <motion.div 
      className="flex w-full items-start justify-center h-full mx-auto px-2 lg:px-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.1 }}
    >
      <div className="flex  flex-col items-center justify-around space-y-4 gap-3 w-full mb-10 lg:mb-0 h-full lg:h-[80vh]">
        {/* Title */}
        <div className="text-center pt-8">
          <h1 className="text-3xl lg:text-5xl font-bold text-blue-500">
            {t('userInfo.ageAndGender')}
          </h1>
          <p className="text-sm text-gray-500 lg:hidden">
            {t('userInfo.subtitle')}
          </p>
        </div>

        {/* Age Section */}
        <div className="w-full ">
          <h2 className="text-xl lg:text-2xl font-semibold ">  {t('userInfo.selectAge')}</h2>
          
          {/* Age Display with surrounding numbers */}
          {/* <div className="flex items-center justify-between w-full  px-4">
            {renderSurroundingAges()}
          </div> */}

          {/* Age Input Box */}
          <div className="relative w-full">
            <input
              type="number"
              min="0"
              max="100"
              value={age || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setAge('');
                } else {
                  const parsedValue = Number.parseInt(value);
                  if (!isNaN(parsedValue)) {
                    setAge(parsedValue);
                  }
                }
              }}
              className="w-full px-4 py-3 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder={t('userInfo.enterAge')}
              autoComplete="off"
            />
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>{t('userInfo.minAge')}</span>
              <span>{t('userInfo.maxAge')}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
                {t('userInfo.tapToEnterAge')}
            </p>
          </div>

          {/* Age Slider - Commented Out */}
          {/*
          <div className="relative w-full">
            <input
              type="range"
              min="1"
              max="100"
              value={age}
              onChange={(e) => setAge(Number.parseInt(e.target.value))}
              className="w-full h-6 appearance-none cursor-pointer bg-gray-200 rounded-full slider"
              style={{
                background: isArabic 
                  ? `linear-gradient(to left, #3b82f6 0%, #3b82f6 ${age}%, #e5e7eb ${age}%, #e5e7eb 100%)`
                  : `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${age}%, #e5e7eb ${age}%, #e5e7eb 100%)`,
              }}
            />
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
          */}
        </div>

        {/* Gender Section */}
        <div className="w-full space-y-2">
          <h2 className="text-lg lg:text-xl font-medium ">{t('userInfo.selectGender')}</h2>
          <div className="grid grid-cols-2 gap-6 lg:gap-8">
            {genderOptions.map((option) => (
              <div
                key={option.value}
                className={`flex flex-col items-center cursor-pointer transition-all p-4  rounded-lg ${
                  selectedGender === option.value
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "hover:bg-gray-50 border-2 border-gray-200"
                }`}
                onClick={() => setSelectedGender(option.value)}
              >
                <div className="text-base lg:text-lg font-medium text-center">{option.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between w-full pt-2">
          <button 
            onClick={onPrev} 
            className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3 
                       text-sm md:text-base font-medium text-gray-600 bg-white/80 backdrop-blur-sm
                       border-2 border-gray-300 rounded-xl shadow-sm
                       transition-all duration-300 ease-out
                       hover:border-[#407EFF] hover:text-[#407EFF] hover:bg-white hover:shadow-md
                       focus:outline-none focus:ring-4 focus:ring-[#407EFF]/20
                       active:scale-[0.98]`}
          >
            {isArabic ? (
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
            ) : (
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
            )}
            <span>{t('buttons.back')}</span>
          </button>

          <button 
            type="button"
            onClick={(e) => {
              console.log("Button clicked!", e);
              handleNext();
            }}
            disabled={isLoading}
            className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3
                       text-sm md:text-base font-medium text-white bg-gradient-to-r from-[#407EFF] to-[#1E40AF]
                       rounded-xl shadow-lg
                       transition-all duration-300 ease-out
                       hover:shadow-xl hover:scale-[1.02] hover:from-[#1E40AF] hover:to-[#407EFF]
                       focus:outline-none focus:ring-4 focus:ring-[#407EFF]/30
                       active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{t('buttons.loading')}</span>
              </div>
            ) : (
              <>
                <span>{t('buttons.next')}</span>
                {isArabic ? (
                  <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:-translate-x-1" />
                ) : (
                  <ArrowRight className="w-3 h-3 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
                )}
              </>
            )}
          </button>
        </div>
      </div>



      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 40px;
          height:40px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #3b82f6;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: 2px solid #3b82f6;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </motion.div>
  );
}






// import Head from "next/head";
// import styles from "../styles/Home.module.css";
// import {
//   OperatingMode,
//   MeasurementPreset,
//   CameraMode,
//   FaceState,
//   NormalizedFaceBbox,
//   MeasurementState,
//   MeasurementResults,
//   Heartbeat,
//   PrecisionMode,
//   Screen,
//   InitializationSettings,
//   CustomColorTheme,
//   CustomMeasurementConfig,
// } from "shenai-sdk";
// import { Collapse, message } from "antd";
// import { useEffect, useRef, useState } from "react";
// import { CodeSnippet } from "../../components/CodeSnippet";
// import { useRouter } from "next/router";
// import { CustomMeasurementConfigurator } from "../../components/CustomMeasurementConfigurator";
// import { UIElementsControls } from "../../components/UIElementsControls";
// import { ColorTheme } from "../../components/ColorTheme";
// import Link from "next/link";
// import { FileTextOutlined } from "@ant-design/icons";
// import { Visualizations } from "../../components/Visualizations";
// import { SignalsPreview } from "../../components/SignalsPreview";
// import { ResultsView } from "../../components/ResultsView";
// import { BasicOutputsView } from "../../components/BasicOutputsView";
// import { ControlsView } from "../../components/ControlsView";
// import { InitializationView } from "../../components/InitializationView";
// import { useShenaiSdk } from "../hooks/useShenaiSdk";
// import { getEnumName } from "../../helpers";
// import { useDarkMode } from "../hooks/useDarkMode";

// const { Panel } = Collapse;

// export interface ShenaiSdkState {
//   isInitialized: boolean;

//   operatingMode: OperatingMode;
//   precisionMode: PrecisionMode;
//   measurementPreset: MeasurementPreset;
//   cameraMode: CameraMode;
//   faceState: FaceState;
//   screen: Screen;

//   showUserInterface: boolean;
//   showFacePositioningOverlay: boolean;
//   showVisualWarnings: boolean;
//   enableCameraSwap: boolean;
//   showFaceMask: boolean;
//   showBloodFlow: boolean;
//   hideShenaiLogo: boolean;
//   enableStartAfterSuccess: boolean;
//   showOutOfRangeResultIndicators: boolean;
//   showTrialMetricLabels: boolean;

//   bbox: NormalizedFaceBbox | null;
//   measurementState: MeasurementState;
//   progress: number;

//   hr10s: number | null;
//   hr4s: number | null;
//   realtimeHr: number | null;
//   realtimeHrvSdnn: number | null;
//   realtimeCardiacStress: number | null;
//   results: MeasurementResults | null;

//   realtimeHeartbeats: Heartbeat[];

//   recordingEnabled: boolean;
//   badSignal: number | null;
//   signalQuality: number | null;

//   textureImage: number[];
//   signalImage: number[];
//   metaPredictionImage: number[];

//   rppgSignal: number[];
// }

// export default function Home() {
//   const shenaiSDK = useShenaiSdk();
//   const darkMode = useDarkMode();

//   const [apiKey, setApiKey] = useState<string>("");
//   const [sdkState, setSdkState] = useState<ShenaiSdkState>();
//   const [sdkVersion, setSdkVersion] = useState<string>("");
//   const [pendingInitialization, setPendingInitialization] = useState(false);
//   const [initializationSettings, setInitializationSettings] =
//     useState<InitializationSettings>();
//   const [colorTheme, setColorTheme] = useState<CustomColorTheme>({
//     themeColor: "#56A0A0",
//     textColor: "#000000",
//     backgroundColor: "#E6E6E6",
//     tileColor: "#FFFFFF",
//   });
//   const [customConfig, setCustomConfig] = useState<CustomMeasurementConfig>();

//   const canvasTopRef = useRef<HTMLDivElement>(null);
//   const scrollToCanvas = () => {
//     console.log("would scroll but no element");
//     if (canvasTopRef.current) {
//       console.log("should scroll to canvas now");
//       canvasTopRef.current.scrollIntoView({ behavior: "smooth" });
//     }
//   };

//   const initializeSdk = (
//     apiKey: string,
//     settings: InitializationSettings,
//     onSuccess?: () => void
//   ) => {
//     if (!shenaiSDK) return;
//     setPendingInitialization(true);
//     shenaiSDK.initialize(apiKey, "", settings, (res) => {
//       if (res === shenaiSDK.InitializationResult.OK) {
//         console.log("Shen.AI License result: ", res);
//         shenaiSDK.attachToCanvas("#mxcanvas");
//         onSuccess?.();
//         scrollToCanvas();
//       } else {
//         message.error(
//           "License initialization problem: " +
//             getEnumName(shenaiSDK.InitializationResult, res, "UNKNOWN")
//         );
//       }
//       setPendingInitialization(false);
//     });
//   };

//   useEffect(() => {
//     if (!shenaiSDK) return;
//     const settings: InitializationSettings = {
//       precisionMode: shenaiSDK.PrecisionMode.STRICT,
//       operatingMode: shenaiSDK.OperatingMode.POSITIONING,
//       measurementPreset: shenaiSDK.MeasurementPreset.ONE_MINUTE_BETA_METRICS,
//       cameraMode: shenaiSDK.CameraMode.FACING_USER,
//       onboardingMode: shenaiSDK.OnboardingMode.HIDDEN,
//       showUserInterface: true,
//       showFacePositioningOverlay: true,
//       showVisualWarnings: true,
//       enableCameraSwap: true,
//       showFaceMask: true,
//       showBloodFlow: true,
//       hideShenaiLogo: false,
//       enableStartAfterSuccess: true,
//       enableSummaryScreen: true,
//       enableHealthRisks: true,
//       showOutOfRangeResultIndicators: true,
//       showTrialMetricLabels: true,
//       enableFullFrameProcessing: false,
//     };
//     setInitializationSettings(settings);

//     const urlParams = new URLSearchParams(window?.location.search ?? "");
//     const apiKey = urlParams.get("apiKey");
//     if (apiKey && apiKey.length > 0) {
//       initializeSdk(apiKey, settings);
//     }
//   }, [shenaiSDK]);

//   const router = useRouter();
//   useEffect(() => {
//     router.query.apiKey && setApiKey(router.query.apiKey as string);
//   }, [router.query.apiKey]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (shenaiSDK) {
//         setSdkVersion(shenaiSDK.getVersion());

//         const isInitialized = shenaiSDK.isInitialized();

//         if (!isInitialized) {
//           setSdkState(undefined);
//           return;
//         }

//         const newState = {
//           isInitialized,

//           operatingMode: shenaiSDK.getOperatingMode(),
//           precisionMode: shenaiSDK.getPrecisionMode(),
//           measurementPreset: shenaiSDK.getMeasurementPreset(),
//           cameraMode: shenaiSDK.getCameraMode(),
//           faceState: shenaiSDK.getFaceState(),
//           screen: shenaiSDK.getScreen(),

//           showUserInterface: shenaiSDK.getShowUserInterface(),
//           showFacePositioningOverlay: shenaiSDK.getShowFacePositioningOverlay(),
//           showVisualWarnings: shenaiSDK.getShowVisualWarnings(),
//           enableCameraSwap: shenaiSDK.getEnableCameraSwap(),
//           showFaceMask: shenaiSDK.getShowFaceMask(),
//           showBloodFlow: shenaiSDK.getShowBloodFlow(),
//           hideShenaiLogo: shenaiSDK.getHideShenaiLogo(),
//           enableStartAfterSuccess: shenaiSDK.getEnableStartAfterSuccess(),
//           showOutOfRangeResultIndicators:
//             shenaiSDK.getShowOutOfRangeResultIndicators(),
//           showTrialMetricLabels: shenaiSDK.getShowTrialMetricLabels(),

//           bbox: shenaiSDK.getNormalizedFaceBbox(),
//           measurementState: shenaiSDK.getMeasurementState(),
//           progress: shenaiSDK.getMeasurementProgressPercentage(),

//           hr10s: shenaiSDK.getHeartRate10s(),
//           hr4s: shenaiSDK.getHeartRate4s(),
//           realtimeHr: shenaiSDK.getRealtimeHeartRate(),
//           realtimeHrvSdnn: shenaiSDK.getRealtimeHrvSdnn(),
//           realtimeCardiacStress: shenaiSDK.getRealtimeCardiacStress(),
//           results: shenaiSDK.getMeasurementResults(),

//           realtimeHeartbeats: shenaiSDK.getRealtimeHeartbeats(100),

//           recordingEnabled: shenaiSDK.getRecordingEnabled(),

//           badSignal: shenaiSDK.getTotalBadSignalSeconds(),
//           signalQuality: shenaiSDK.getCurrentSignalQualityMetric(),

//           textureImage: shenaiSDK.getFaceTexturePng(),
//           signalImage: shenaiSDK.getSignalQualityMapPng(),
//           metaPredictionImage: shenaiSDK.getMetaPredictionImagePng(),

//           rppgSignal: shenaiSDK.getFullPpgSignal(),
//         };
//         setSdkState(newState);
//         //console.log(newState);
//       }
//     }, 200);
//     return () => clearInterval(interval);
//   }, [shenaiSDK]);

//   const [colorThemeSnippetCode, setColorThemeSnippetCode] = useState("");
//   const [measConfigSnippetCode, setMeasConfigSnippetCode] = useState("");

//   return (
//     <>
//       <Head>
//         <title>Shen.AI SDK Playground</title>
//         <meta name="description" content="Shen.AI SDK Playground" />
//         <meta name="viewport" content="width=device-width, initial-scale=1" />
//         <link rel="icon" href="/favicon.ico" />
//       </Head>
//       <main className={styles.main}>
//         <div className={styles.headerRow}>
//           <div>
//             <img
//               style={{ height: 32, marginRight: 8 }}
//               src="/shen-square.png"
//             />
//             <span>Shen.AI SDK Playground</span>
//           </div>
//           <div style={{ fontSize: "90%" }}>
//             <Link href={"https://developer.shen.ai/"} target="_blank">
//               <FileTextOutlined />
//               &nbsp;SDK Documentation
//             </Link>
//           </div>
//         </div>
//         <div className={styles.contentRow}>
//           <div className={styles.controlsCol}>
//             <div className={styles.controlRow} style={{ marginBottom: 10 }}>
//               <div className={styles.controlTitle}>
//                 SDK version
//                 <CodeSnippet code={`shenaiSDK.getVersion();`} />
//               </div>{" "}
//               <div>{sdkVersion}</div>
//             </div>
//             <Collapse defaultActiveKey={[0, 1]}>
//               <Panel header="Initialization" key="0">
//                 <InitializationView
//                   shenaiSDK={shenaiSDK}
//                   pendingInitialization={pendingInitialization}
//                   initializationSettings={initializationSettings}
//                   setInitializationSettings={setInitializationSettings}
//                   initializeSdk={initializeSdk}
//                   colorTheme={colorTheme}
//                   customConfig={customConfig}
//                   sdkState={sdkState}
//                   apiKey={apiKey}
//                   setApiKey={setApiKey}
//                 />
//               </Panel>
//               <Panel header="Controls" key="1">
//                 <ControlsView
//                   shenaiSDK={shenaiSDK}
//                   sdkState={sdkState}
//                   setInitializationSettings={setInitializationSettings}
//                 />
//               </Panel>
//               <Panel
//                 header={
//                   <>
//                     Custom measurement config&nbsp;&nbsp;
//                     <CodeSnippet code={measConfigSnippetCode} />
//                   </>
//                 }
//                 key="2"
//               >
//                 <CustomMeasurementConfigurator
//                   shenaiSDK={shenaiSDK}
//                   sdkState={sdkState}
//                   customConfig={customConfig}
//                   setCustomConfig={setCustomConfig}
//                   setInitializationSettings={setInitializationSettings}
//                   setSnippetCode={setMeasConfigSnippetCode}
//                 />
//               </Panel>
//               <Panel
//                 header={
//                   <>
//                     Color Theme&nbsp;&nbsp;
//                     <CodeSnippet code={colorThemeSnippetCode} />
//                   </>
//                 }
//                 key="3"
//               >
//                 <ColorTheme
//                   shenaiSDK={shenaiSDK}
//                   sdkState={sdkState}
//                   colorTheme={colorTheme}
//                   setColorTheme={setColorTheme}
//                   setSnippetCode={setColorThemeSnippetCode}
//                 />
//               </Panel>
//               <Panel header="UI elements" key="4">
//                 <UIElementsControls
//                   shenaiSDK={shenaiSDK}
//                   sdkState={sdkState}
//                   setInitializationSettings={setInitializationSettings}
//                 />
//               </Panel>
//               <Panel header="Visualizations" key="5">
//                 <Visualizations sdkState={sdkState} />
//               </Panel>
//             </Collapse>
//           </div>
//           <div ref={canvasTopRef} className={styles.mxcanvasTopHelper} />
//           <canvas id="mxcanvas" className={styles.mxcanvas} />
//           <div className={styles.outputsCol}>
//             <div className={styles.outputSectionTitle}>Outputs:</div>
//             <BasicOutputsView shenaiSDK={shenaiSDK} sdkState={sdkState} />
//             <ResultsView sdkState={sdkState} />
//             <SignalsPreview sdkState={sdkState} darkMode={darkMode} />
//           </div>
//         </div>
//         <div className={styles.footerRow}>
//           &copy; {new Date().getFullYear()} MX Labs OÜ
//         </div>
//       </main>
//     </>
//   );
// }

