import { type ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

import AdminPanel from "@/components/admin-panel"
import { useTranslation } from "@/hooks/useTranslation"
import LanguageSwitcher from "@/components/language-switcher"
import { motion } from "framer-motion"
  
interface KioskLayoutProps {
  children: ReactNode
  currentStep: number
  totalSteps: number
}

export default function KioskLayout({ children }: KioskLayoutProps) {
  const { t } = useTranslation()
  const [showAdmin, setShowAdmin] = useState(false)

  
  if (showAdmin) {
    return <AdminPanel onExit={() => setShowAdmin(false)} />
  }

  return (
    <div className="h-full overflow-hidden relative bg-gradient-to-b from-[#407EFF] to-white ">
        
      <motion.div 
          className="absolute top-20
           right-0  decorative-vector-top hidden sm:block"
          initial={{ height: '0%', x: 150, y: -150, scale: 0.8 }}
          animate={{ height: '100%', x: 0, y: 0, scale: 1 }}
          transition={{ 
            duration: 1.2, 
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.2
          }}
        >
          <img src="/Vector.svg" alt="carevision" className="victor " />
        </motion.div>
      
        {/* Bottom Left Vector - Shows second */}
        <motion.div 
          className=" absolute -bottom-20 left-0   decorative-vector-bottom hidden sm:block"
          initial={{ opacity: 0, x: -130, y: 130, scale: 0.8 }}
          animate={{ opacity: 1, x: -20, y: 100, scale: 1 }}
          transition={{ 
            duration: 1.2, 
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.6
          }}
        >
          <img src="/Vector2.svg" alt="carevision" className="victor " />
        </motion.div>
      
      {/* Responsive Header */}
      <header className="bg-transparent py-2 sm:py-3 z-50 md:py-4 lg:py-6 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 h-[10%] ">
        <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          {/* Left: Language Switcher */}
          <div className="flex items-center">
            <LanguageSwitcher />
          </div>
          
          {/* Center: Header Title */}
          <div className="flex-1 flex justify-center sm:justify-start px-2 sm:px-4">
            <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-700 truncate">
              {t('layout.healthCheckKiosk')}
            </h1>
          </div>
          
          {/* Right: Admin Button */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAdmin(true)}
              className="rounded-full text-white hover:bg-white/10 transition-colors w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
              title={t('layout.adminPanel')}
            >
              <Settings className="w-30 h-30 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-20 lg:h-20 z-50" />
              <span className="sr-only">{t('layout.adminPanel')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Responsive Main content */}
      <main className="flex-1 relative z-50 flex flex-col items-center justify-center h-[80%]  sm:px-10 ">
        <div className="w-full mx-auto">{children}</div>
      </main>

      {/* Responsive Footer */}
      <footer className="bg-transparent z-50 py-2 sm:py-3 md:py-4 lg:py-6 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12  h-[10%]  text-center text-gray-500">
        <div className="space-y-1 sm:space-y-2">
          <p className="text-xs sm:text-sm md:text-base lg:text-lg leading-tight">
            {t('layout.footerCopyright')}
          </p>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg leading-tight">
            {t('layout.footerDisclaimer')}
          </p>
        </div>
      </footer>
    </div>
  )
}

