import { useRouter } from 'next/router';
import { Wifi } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import UserStatusBadge from '@/components/UserStatusBadge';
import { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

// Page configurations
const pageConfigs: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'תורים לרם-אל',
    subtitle: 'בדיקת תורים וקבלת התראות'
  },
  '/notifications': {
    title: 'התראות',
    subtitle: 'קבלת התראות לתורים פנויים'
  },
  '/manual-search': {
    title: 'חיפוש ידני',
    subtitle: 'חפש תורים פנויים בתאריכים הקרובים'
  }
};

export default function Header() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  
  // Get page config based on current route
  const currentConfig = pageConfigs[router.pathname] || {
    title: 'תורים לרם-אל',
    subtitle: ''
  };

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src="/icons/icon-72x72.png" 
              alt="תור רם-אל"
              className="w-11 h-11 rounded-xl shadow-sm"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/20 to-transparent dark:from-black/20"></div>
          </div>
          
          <div>
            <h1 className="text-lg font-bold mb-0.5 leading-none">
              {currentConfig.title}
            </h1>
            <p className="text-xs text-muted-foreground">{currentConfig.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <UserStatusBadge />
          <ThemeToggle className="w-7 h-7" />
          {!isOnline && (
            <div className="text-muted-foreground" title="אופליין">
              <Wifi className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>
      
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
    </header>
  );
} 