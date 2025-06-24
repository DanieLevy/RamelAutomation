import { useState, useEffect } from 'react'
import { X, Plus, Share } from 'lucide-react'

interface PWABannerProps {
  onInstall: () => void
  onDismiss: () => void
  ios?: boolean
  canInstall?: boolean
  isIOS?: boolean
}

export default function PWABanner({ onInstall, onDismiss, ios = false, canInstall = true, isIOS = false }: PWABannerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Smooth entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    // Wait for exit animation before calling onDismiss
    setTimeout(onDismiss, 300)
  }

  const handleInstall = () => {
    setIsVisible(false)
    setTimeout(onInstall, 300)
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-sm border-t border-primary/20 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className="max-w-sm mx-auto bg-card/95 backdrop-blur-md rounded-2xl shadow-2xl border border-primary/20 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
        
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-shrink-0">
              <img 
                src="/icons/icon-72x72.png" 
                alt="תור רם-אל"
                className="w-12 h-12 rounded-xl shadow-md"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-foreground leading-tight">
                תור רם-אל
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                התקן את האפליקציה לחוויה מהירה יותר
              </p>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="סגור"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted/50"
            >
              לא תודה
            </button>
            <button
              onClick={handleInstall}
              disabled={!canInstall}
              className="flex-1 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              התקן
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 