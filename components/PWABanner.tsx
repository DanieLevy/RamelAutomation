import { useState, useEffect } from 'react'
import { X, Plus, Share } from 'lucide-react'

interface PWABannerProps {
  onInstall: () => void
  onDismiss: () => void
  ios?: boolean
}

export default function PWABanner({ onInstall, onDismiss, ios = false }: PWABannerProps) {
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
    <div className={`fixed bottom-0 left-0 right-0 z-50 transform transition-all duration-300 ease-out ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
    }`}>
      <div className="mx-4 mb-4">
        <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          
          <div className="relative p-4">
            <div className="flex items-center gap-3">
              {/* App Icon */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <img 
                    src="/icons/icon-72x72.png" 
                    alt="תור רם-אל"
                    className="w-12 h-12 rounded-xl shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/favicon-32x32.png';
                    }}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 dark:text-white text-base">
                    תור רם-אל
                  </h3>
                  <div className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-medium">
                    התקן
                  </div>
                </div>
                
                {ios ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    לחץ על <Share className="inline w-4 h-4 mx-1" /> ובחר <strong>"הוסף למסך הבית"</strong>
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    התקן לגישה מהירה ללא דפדפן
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Install Button (not for iOS) */}
                {!ios && (
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    התקן
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={handleDismiss}
                  className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 