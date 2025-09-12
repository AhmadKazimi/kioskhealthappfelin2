'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FaceScanScreen from '../face-scan-screen';
import { useTranslation } from "@/hooks/useTranslation";

interface Instruction {
    id: number;
    key: string;
    avatar: string;
}




export default function BeforeScanning({ onNext, onPrev }: { onNext: () => void, onPrev: () => void }) {

    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const [visibleInstructions, setVisibleInstructions] = useState<Instruction[]>([]);
    const [allInstructionsVisible, setAllInstructionsVisible] = useState(false);
    const [nextItem, setNextItem] = useState(true);
    
    useEffect(() => {
        let isCancelled = false;

        const instructionKeys = [
            'fastScan.instructions.step1',
            'fastScan.instructions.step2',
            'fastScan.instructions.step3',
            'fastScan.instructions.step4',
            'fastScan.instructions.step5',
            'fastScan.instructions.step6',
        ];

        // Reset state
        setVisibleInstructions([]);
        setAllInstructionsVisible(false);

        const run = async () => {
            for (let i = 0; i < instructionKeys.length; i++) {
                if (isCancelled) return;
                await new Promise(resolve => setTimeout(resolve, 800));
                if (isCancelled) return;
                setVisibleInstructions(prev => [
                    ...prev,
                    { id: i, key: instructionKeys[i], avatar: '👩‍⚕️' },
                ]);
                if (i === instructionKeys.length - 1) {
                    setAllInstructionsVisible(true);
                }
            }
        };
        run();

        return () => {
            isCancelled = true;
        };
    }, [i18n.language]);

    return (
        nextItem ? (
        <motion.div 
        className="flex w-full items-start p-5 sm:p-10 justify-center max-w-7xl mx-auto h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
                    <div className="mx-auto w-full flex-grow justify-between items-center h-full flex flex-col">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center flex-shrink-0"
                >
                    <h1 className="text-4xl font-bold text-blue-600 mb-1">{t('beforeScanning.title')}</h1>
                    <p className="text-gray-600 text-lg">{t('beforeScanning.subtitle')}</p>
                </motion.div>

                {/* Instructions Container */}
                <div className="flex-1 relative justify-center flex flex-col-reverse min-h-[400px]">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     
                    </div>
                    
                    {/* This is a container for messages that will stack from bottom to top */}
                    <div className="flex flex-col w-full gap-y-1">
                        <AnimatePresence>
                            {visibleInstructions.map((instruction, index) => (
                                <motion.div
                                    key={instruction.id}
                                    initial={{ 
                                        opacity: 0, 
                                        y: index === 0 ? 0 : 30,
                                        x: 0
                                    }}
                                    animate={{ 
                                        opacity: 1, 
                                        y: 0,
                                        transition: { 
                                            duration: 0.5,
                                            type: "spring",
                                            stiffness: 100,
                                            damping: 15
                                        }
                                    }}
                                    className={`flex items-start flex-grow ${isArabic ? 'space-x-reverse space-x-2 sm:space-x-3' : 'space-x-2 sm:space-x-3'} mb-2 sm:mb-3 last:mb-0`}
                                >
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <motion.div 
                                            className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg"
                                            initial={{ scale: 0.8 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                        <img src='/chatImage.png' alt="avatar" className='w-6 h-6 sm:w-8 sm:h-8 rounded-full' />
                                        </motion.div>
                                    </div>

                                    {/* Instruction Bubble */}
                                    <motion.div
                                        className="bg-blue-500 flex-1 text-white px-3 sm:px-4 py-2 sm:py-3 shadow-sm text-xs sm:text-sm md:text-base leading-relaxed min-w-0"
                                        style={{
                                            borderRadius: isArabic 
                                                ? '16px 0 16px 16px'  // Arabic: right side flat, left side rounded
                                                : '0 16px 16px 16px'  // English: left side flat, right side rounded
                                        }}
                                        initial={{ scale: 0.98, opacity: 0.9 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.4, type: "spring" }}
                                    >
                                        {t(instruction.key)}
                                    </motion.div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                    className="flex justify-between items-center w-full mt-4 flex-shrink-0"
                >
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className={`cursor-pointer group relative flex items-center justify-center space-x-2 px-4 md:px-6 py-2 md:py-3
                            text-sm md:text-base font-medium text-white bg-gradient-to-r from-[#407EFF] to-[#1E40AF]
                            rounded-xl shadow-lg
                            transition-all duration-300 ease-out
                            hover:shadow-xl hover:scale-[1.02] hover:from-[#1E40AF] hover:to-[#407EFF]
                            focus:outline-none focus:ring-4 focus:ring-[#407EFF]/30
                            active:scale-[0.98]
                            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg`}
                        onClick={onPrev}
                    >
                        {t('beforeScanning.backButton')}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.08, y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ scale: 0.9, opacity: 0.7 }}
                        animate={{ 
                            scale: allInstructionsVisible ? 1 : 0.9, 
                            opacity: allInstructionsVisible ? 1 : 0.7 
                        }}
                        className="bg-gradient-to-r from-emerald-500 to-green-600  text-white font-bold py-3 px-5 rounded-full text-sm md:text-lg shadow-2xl transition-all duration-300 border border-emerald-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setNextItem(false)}
                        disabled={!allInstructionsVisible}
                    >
                          {allInstructionsVisible ? t('beforeScanning.startButton') : t('beforeScanning.loadingButton')}
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
        ) : (
            <div>
                  <FaceScanScreen 
                  onNext={onNext}
                  onPrev={onPrev}
                />
            </div>
        )
    );
}