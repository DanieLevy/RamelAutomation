import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { Button } from './ui/button'

interface PWABannerProps {
  onInstall: () => void
  onDismiss: () => void
}

export default function PWABanner({ onInstall, onDismiss }: PWABannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Show banner with animation
    setIsVisible(true)
    setTimeout(() => setIsAnimating(true), 100)
  }, [])

  const handleDismiss = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      onDismiss()
    }, 300)
  }

  const handleInstall = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      onInstall()
    }, 200)
  }

  if (!isVisible) return null

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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
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