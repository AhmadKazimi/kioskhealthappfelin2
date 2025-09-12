"use client";

import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { ArrowRightIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useEffect, useRef, useState } from "react";

interface WelcomeScreenProps {
  onNext: () => void;
}

export default function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  const { t, i18n } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get partner logo URL from environment variable
  const partnerLogoUrl = process.env.NEXT_PUBLIC_PARTNER_LOGO_URL;
  
  // Check if current language is Arabic (RTL)
  const isArabic = i18n.language === 'ar';

  // Play audio when component mounts, but only if Arabic (mute for English)
  useEffect(() => {
    const playAudio = async () => {
      try {
        if (audioRef.current && isArabic) {
          // For Arabic, play audio normally
          audioRef.current.volume = 0.7;
          await audioRef.current.play();
          setAudioPlaying(true);
          setAudioReady(false);
        } else if (audioRef.current && !isArabic) {
          // For English, don't play audio (muted)
          setAudioReady(false);
        }
      } catch (error) {
        console.log('Audio autoplay was prevented:', error);
        setAudioReady(true);
        // Fallback: try to play on user interaction
        const handleUserInteraction = async () => {
          try {
            if (audioRef.current) {
              await audioRef.current.play();
              setAudioPlaying(true);
              setAudioReady(false);
            }
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
          } catch (error) {
            console.log('Audio playback failed:', error);
          }
        };
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);
      }
    };
    
    // Try to play audio after a short delay
    const timer = setTimeout(playAudio, 1000);
    
    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isArabic]);

  const handleStartAudio = async () => {
    try {
      if (audioRef.current && isArabic) {
        // Reset audio to beginning
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.7;
        
        // Try to play
        await audioRef.current.play();
        setAudioPlaying(true);
        setAudioReady(false);
        console.log('Audio started successfully');
      } else if (audioRef.current && !isArabic) {
        // For English, don't play audio
        console.log('Audio muted for English language');
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
      setError(`Audio error: ${error}`);
    }
  };

  return (
    <>
      <audio 
        ref={audioRef}
        src="/hello.mp3" 
        preload="auto"
        onError={(e) => {
          console.error('Audio loading error:', e);
          setAudioReady(false);
        }}
        onCanPlayThrough={() => {
          console.log('Audio ready to play');
        }}
      />
      

      
      {/* Audio Start Indicator */}
      {audioReady && !audioPlaying && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-3 border border-gray-200"
        >
          <button
            onClick={handleStartAudio}
            className="flex items-center space-x-2 text-sm text-gray-700 hover:text-blue-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.793a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>{isArabic ? 'تشغيل الصوت' : 'Start Audio'}</span>
          </button>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed top-4 left-4 z-50 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 max-w-sm"
        >
          <div className="text-sm text-red-700">
            <strong>Audio Error:</strong> {error}
          </div>
        </motion.div>
      )}
        {/* Mobile Layout */}
        <div className="md:hidden h-full flex flex-col bg-[#407EFF] relative overflow-hidden">
          {/* Animated Gradient Layer */}
            <motion.div
                        className="absolute top-[33%] right-[15%] z-100"
                   
            initial={{ y: 10, opacity: 0, scale: 0.95 }}
            animate={{ y: -100, opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1.4, ease: "easeOut" }}
                >
                  <Card className="w-20 h-20 overflow-hidden border-0 shadow-none">
                    <CardContent className="p-0">
                      <AspectRatio ratio={1} className="w-full h-full">
                        <img
                          className="h-full w-full object-cover"
                          alt="carevision"
                          src="/Frame.png"
                        />
                      </AspectRatio>
                    </CardContent>
                  </Card>
                </motion.div>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent"
          />
        {/* Top Section with Doctor Image */}
        <div className="flex-1 relative flex items-center justify-center px-4 pt-8">
                    {/* Partnership Logo - Top Left Prominent */}
                    {partnerLogoUrl && (
                    <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    >
          <div className="absolute -bottom-0 left-1 z-10">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-1 border border-white/25 shadow-lg overflow-hidden">
              <div className="relative">
                <img 
                  src={partnerLogoUrl} 
                  alt="Partnership Logo" 
                  className="w-[8rem] h-[4rem] object-cover rounded-xl filter drop-shadow-lg transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-xl pointer-events-none"></div>
              </div>
            </div>
          </div>
          </motion.div>
                    )}
          {/* Carevision Logo */}
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span className="text-white text-sm font-medium">carevision</span>
            </div>
          </div>

          {/* Doctor Image */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="relative z-0"
          >
            <img 
               src="/homepage1.png" 
              alt="Healthcare Professional" 
              className="w-90 h-100 object-cover " 
            />
          </motion.div>
        </div>

                  {/* Bottom White Card */}
          <div className={`relative z-10 ${isArabic ? 'text-right' : 'text-left'}`}>
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white rounded-t-3xl p-6 shadow-xl"
            >
            <h3 className={`text-[#407EFF] text-xl font-medium mb-1 ${isArabic ? 'text-right' : 'text-left'}`}>
              {t('welcome.title1')}
            </h3>
            <h1 className={`text-[#407EFF] text-xl font-bold mb-4 ${isArabic ? 'text-right' : 'text-left'}`}>
              {t('welcome.title2')}
            </h1>
            <p className={`text-gray-600 text-sm mb-8  ${isArabic ? 'text-right' : 'text-left'}`}>
            {t('welcome.subtitle1')}
                  <br />

                <span className={`text-gray-600 text-sm mb-8  ${isArabic ? 'text-right' : 'text-left'}`}>  {t('welcome.subtitle2')}</span>
            </p>
            
            <motion.button 
              className="bg-[#407EFF] hover:bg-[#3366CC] group flex items-center justify-center cursor-pointer text-white py-4 px-8 rounded-2xl text-lg font-semibold w-full transition-colors duration-300 shadow-lg"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
            >
              {t('welcome.button')}
              <ArrowRightIcon className={`w-6 h-6 ${isArabic ? 'mr-2' : 'ml-2'} group-hover:translate-x-1 transform opacity-100 transition-all duration-300 ${isArabic ? 'rotate-180' : ''}`} />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block relative h-full w-full ">


        {/* Top Right Vector - Shows first */}
     
        <motion.div
                    className={`absolute top-[30%] ${isArabic ? 'left-[80%]' : 'right-[61%]'} z-100`}
                   
            initial={{ y: 10, opacity: 0, scale: 0.95 }}
            animate={{ y: -100, opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 1.4, ease: "easeOut" }}
                >
                  <Card className="w-40 h-40 overflow-hidden border-0 shadow-none">
                    <CardContent className="p-0">
                      <AspectRatio ratio={1} className="w-full h-full">
                        <img
                          className="h-full w-full object-cover"
                          alt="carevision"
                          src="/Frame.svg"
                        />
                      </AspectRatio>
                    </CardContent>
                  </Card>
                </motion.div>
        {/* Main Content Container */}
        <div className="relative z-20 flex flex-col justify-between ">
          
          {/* Hero Section */}
          <div className="flex-1 flex items-center  h-[50vh] justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2   items-center w-full mx-auto">
              
              {/* Main Image - Shows after vectors */}
              <motion.div 
                className="relative flex justify-center  items-center order-2 md:order-1 h-[53vh]"
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 1, 
                  ease: [0.25, 0.46, 0.45, 0.94],
                  delay: 1.4
                }}
              >
                
                <Card className="w-full max-w-[46%]  h-full overflow-hidden border-0 shadow-none">
                  <CardContent className="p-0">
                    <AspectRatio ratio={550 / 682} className="w-full">
                      <img
                        className="h-full w-full object-cover"
                        alt="carevision"
                        src="/homepage1.png"
                      />
                    </AspectRatio>
                  </CardContent>
                </Card>
                
              </motion.div>
             
              {/* Text Content */}
              <div className={`px-10 order-1 md:order-2 w-[100%] flex flex-col items-start  justify-center`}>
              <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    >
              {partnerLogoUrl && (
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-1 border border-white/25 shadow-lg overflow-hidden">
                    <div className="relative">
                      <img 
                        src={partnerLogoUrl} 
                        alt="Partnership Logo" 
                        className="w-56 h-20 object-cover rounded-xl filter drop-shadow-lg transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-xl pointer-events-none"></div>
                    </div>
                  </div>
              )}
                  </motion.div>

                                {/* Title 1 */}
                <motion.h3 
                  className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white mb-2"
                  initial={{ opacity: 0, y: 40, x: -20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 1.8
                  }}
                >
                  {t('welcome.title1')}
                </motion.h3>
        
                {/* Title 2 */}
      
                {/* Subtitle */}
                <motion.p 
                  className="text-base md:text-lg lg:text-xl xl:text-2xl text-[#002268] mb-6"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 2.2
                  }}
                >
                  {t('welcome.subtitle1')}
                  <br />
                  {t('welcome.subtitle2')}
                </motion.p>
      
                {/* Button */}
                <motion.button 
                  className="bg-[#407EFF] shrink-0 hover:bg-[#3366CC] group flex items-center justify-center cursor-pointer text-white py-3 px-8 my-4 rounded-3xl text-lg md:text-xl lg:text-2xl xl:text-3xl transition-colors duration-300 shadow-lg"
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 2.4
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ 
                    scale: 0.95,
                    transition: { duration: 0.1 }
                  }}
                  onClick={onNext}
                >
                  {t('welcome.button')}
                  {/* {
                    isArabic ? (
                      <ArrowRightIcon className={`w-6 h-6 mr-2 group-hover:translate-x-1 transform duration-300 opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                    ) : (
                      <ArrowRightIcon className={`w-6 h-6 ml-2 group-hover:translate-x-1 transform duration-300 opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                    )
                  } */}
                </motion.button>
                     {/* Partnership Logo - Prominent placement */}
                <motion.div 
                  className="mb-6 flex flex-row items-center justify-center gap-4"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 1.6
                  }}
                >
              
                </motion.div>
              </div>
            </div>
            
          </div>
                  
          {/* Bottom Features Card - Shows last */}
          <div className="w-[90%] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 1, 
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 1.4
              }}  
              className="mx-auto"
            >  
              <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 lg:p-6">
                <div className="flex flex-row items-center justify-between gap-6 md:gap-8">
                  
                  {/* Get health insights */}
                  <motion.div 
                    className="flex flex-col items-center text-center flex-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.6,    
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: 1.6
                    }}
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        duration: 0.5, 
                        ease: "backOut",
                        delay: 1.8
                      }}
                    >
                    
                        <img src="/homeIcon1.svg" alt="health-insights" className="w-12 h-12 bg-blue-200 rounded-full p-2 md:w-16 md:h-16" />
                    </motion.div>
                    <h3 className="text-sm md:text-lg font-semibold text-gray-800">
                      {t('welcome.getHealthInsights1')} <br /> {t('welcome.getHealthInsights2')}
                    </h3>
                  </motion.div>
                  
                  {/* Divider */}
                  <motion.div 
                    className="w-full h-px md:w-px md:h-16 bg-[#407EFF]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: 2.0
                    }}
                  />
                  
                  {/* AI analyzes symptoms */}
                  <motion.div 
                    className="flex flex-col items-center text-center flex-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: 2.2
                    }}
                  >
                    <motion.div 
                      className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        duration: 0.5, 
                        ease: "backOut",
                        delay: 2.4
                      }}
                    >
                                              <img src="/homeIcon2.svg" alt="health-insights" className="w-12 h-12 bg-blue-200 rounded-full p-2 md:w-16 md:h-16" />

                    </motion.div>
                    <h3 className="text-sm md:text-lg font-semibold text-gray-800">
                      {t('welcome.aiAnalyzes')} <br /> {t('welcome.aiAnalyzesSymptoms')}
                    </h3>
                  </motion.div>
                  
                  {/* Divider */}
                  <motion.div 
                    className="w-full h-px md:w-px md:h-16 bg-[#407EFF]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      duration: 0.8, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: 2.6
                    }}
                  />
                  
                  {/* Answer simple questions */}
                  <motion.div 
                    className="flex flex-col items-center text-center flex-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: 2.8
                    }}
                  >
                    <motion.div 
                      className="w-12 h-12 md:w-16 md:h-16  rounded-full bg-blue-100 flex items-center justify-center mb-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        duration: 0.5, 
                        ease: "backOut",
                        delay: 3.0
                      }}
                      style={{
                        borderRadius: '50%',
                      }}
                    >
                      <img  style={{
                        borderRadius: '50%',
                      }} src="/homeIcon3.svg" alt="health-insights" className="w-12 h-12 bg-blue-200  p-2 md:w-16 md:h-16" />
                    </motion.div>
                    <h3 className="text-sm md:text-lg font-semibold text-gray-800">
                      {t('welcome.answerSimpleQuestions1')} <br /> {t('welcome.answerSimpleQuestions2')}
                    </h3>
                  </motion.div>
                </div>
                

              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
