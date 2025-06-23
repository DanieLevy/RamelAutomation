import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'
import { Button } from './ui/button'

interface PWABannerProps {
  onInstall: () => void
  onDismiss: () => void
}

export default function PWABanner({ onInstall, onDismiss }: PWABannerProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Start animation immediately when component mounts
    const timer = setTimeout(() => setIsAnimating(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    console.log('PWA Banner: Dismiss clicked')
    // Immediately call onDismiss - let parent handle the state
    onDismiss()
  }

  const handleInstall = () => {
    console.log('PWA Banner: Install clicked')
    // Immediately call onInstall - let parent handle the state
    onInstall()
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transform transition-all duration-300 ease-out ${
      isAnimating ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      {/* Background with blur effect */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* App Icon */}
            <div className="flex-shrink-0">
              <img 
                src="/icons/icon-96x96.png" 
                alt="תור רם-אל"
                className="w-10 h-10 rounded-xl shadow-md"
                onError={(e) => {
                  // Fallback to smaller icon if 96x96 fails
                  const target = e.target as HTMLImageElement;
                  if (target.src.includes('96x96')) {
                    target.src = '/icons/icon-72x72.png';
                  } else if (target.src.includes('72x72')) {
                    // Final fallback to favicon
                    target.src = '/favicon-32x32.png';
                  }
                }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-normal text-gray-900 dark:text-white text-sm truncate">
                  תור רם-אל
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-light">
                  התקן
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-light leading-tight">
                התקן את האפליקציה למכשיר הביתי לגישה מהירה
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Install Button */}
              <Button
                onClick={handleInstall}
                size="sm"
                className="h-8 px-3 text-xs font-normal bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
              >
                <Download className="w-3 h-3 ml-1" />
                התקן
              </Button>

              {/* Close Button */}
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 