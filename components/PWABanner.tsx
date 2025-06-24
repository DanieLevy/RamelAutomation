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

  // Show different content for iOS
  const isIOSDevice = ios || isIOS || (typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background via-background/95 to-transparent border-t border-primary/20 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className="max-w-sm mx-auto bg-card rounded-2xl shadow-2xl border border-primary/20 overflow-hidden">
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
          
          {isIOSDevice ? (
            <div className="mb-3 text-xs text-muted-foreground">
              <ol className="list-decimal list-inside space-y-1 rtl">
                <li>לחץ על <span className="inline-flex items-center bg-muted/40 px-1.5 py-0.5 rounded text-[10px]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="8 17 12 21 16 17"></polyline>
                    <line x1="12" y1="12" x2="12" y2="21"></line>
                    <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path>
                  </svg>
                  <span className="mr-1">שתף</span></span>
                </li>
                <li>גלול ולחץ על <span className="inline-flex items-center bg-muted/40 px-1.5 py-0.5 rounded text-[10px]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  <span className="mr-1">הוסף למסך הבית</span></span>
                </li>
              </ol>
            </div>
          ) : null}
          
          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted/50"
            >
              לא תודה
            </button>
            {!isIOSDevice ? (
              <button
                onClick={handleInstall}
                disabled={!canInstall}
                className="flex-1 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                התקן
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="flex-1 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors shadow-lg"
              >
                הבנתי
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 