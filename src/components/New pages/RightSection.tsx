import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

interface RightSectionProps {
  children?: React.ReactNode;
  title: string;
  description: string;
  image: string;
  className?: string;
}

const RightSection: React.FC<RightSectionProps> = ({
  title,
  description,
  image,
  className,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { i18n } = useTranslation();
  
  // Check if current language is English to mute audio
  const isEnglish = i18n.language === 'en';
  const isArabic = i18n.language === 'ar';

  // Update video mute state when language changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isEnglish;
      videoRef.current.volume = isEnglish ? 0 : 0.8;
    }
  }, [isEnglish]);

  return (
    <>
      <motion.div
        className={`rounded-3xl w-full h-full flex flex-col items-center overflow-hidden ${isArabic ? 'rtl' : 'ltr'}`}
        initial={{ opacity: 0, x: isArabic ? -100 : 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <motion.div
          className={`w-full flex-1 flex flex-col justify-center ${isArabic ? 'items-end' : 'items-start'} gap-2 md:gap-3 h-full min-h-0 py-2`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.div
            className="w-full p-3 sm:p-4 md:p-6 bg-white rounded-2xl shadow-[0px_4px_10px_0px_rgba(64,126,255,0.20)] flex flex-col justify-center items-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <motion.div
              className={`${isArabic ? 'text-center' : 'text-center'} justify-start text-blue-950 font-normal font-['Roboto'] leading-tight px-2`}
              style={{
                fontSize: "clamp(0.7rem, 2.2vw, 1.4rem)",
                lineHeight: "1.1",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
            >
              {title}
            </motion.div>
          </motion.div>

          <motion.div
            className={`w-full relative flex-1 bg-blue-500 rounded-2xl shadow-[0px_1px_8px_0px_rgba(25,33,61,0.06)] min-h-[160px] sm:min-h-[180px] lg:min-h-[200px] overflow-hidden`}
            style={{
              clipPath: isArabic ? "polygon(120% -20%, 0% 0, 0% 100%, 120% 100%)" : "polygon(-20% -20%, 100% 0, 100% 100%, -20% 100%)",
              maxHeight: "min(50vh, 400px)"
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}  
          >
            <motion.div
              className={`absolute h-full w-[100%] ${className} bottom-0`}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.6,
              }}
            >
              {image.includes(".mp4") ? (
                <div className="h-full w-full rounded-2xl overflow-hidden relative">
                  <video
                    ref={videoRef}
                    src={image}
                    autoPlay
                    muted={isEnglish}
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover rounded-2xl"
                    style={{
                      transform: isArabic ? 'scaleX(-1)' : 'none'
                    }}
                    onLoadedMetadata={() => {
                      // Set volume to 0.8 when video loads, but only if not English
                      if (videoRef.current) {
                        videoRef.current.volume = isEnglish ? 0 : 0.8;
                      }
                    }}
                  />
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/10 to-transparent rounded-2xl"></div>
                </div>
              ) : (
                <img
                  className="h-[110%] w-full object-fit object-center"
                  alt="Carevision"
                  src={image}
                />
              )}
            </motion.div>
          </motion.div>

          <motion.div
            className={`flex-shrink-0 flex items-center justify-center gap-2 bg-white rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8 w-full ${isArabic ? 'flex-row-reverse' : 'flex-row'}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <img
              className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10"
              src="/carevision.png"
              alt="Carevision logo"
            />
            <div className={`${isArabic ? 'justify-end text-right' : 'justify-start text-left'} text-blue-950 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-normal font-['Roboto'] truncate`}>
              {description}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default RightSection;
