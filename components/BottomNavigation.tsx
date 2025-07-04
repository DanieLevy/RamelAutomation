import { useRouter } from 'next/router';
import { Home, Bell, Search } from 'lucide-react';
import { useMemo } from 'react';

export default function BottomNavigation() {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = useMemo(() => [
    { 
      href: '/', 
      icon: Home, 
      label: 'בית',
      active: currentPath === '/'
    },
    { 
      href: '/notifications', 
      icon: Bell, 
      label: 'התראות',
      active: currentPath === '/notifications'
    },
    { 
      href: '/manual-search', 
      icon: Search, 
      label: 'חיפוש',
      active: currentPath === '/manual-search'
    }
  ], [currentPath]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      {/* Background blur effect for iOS-style appearance */}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl" />
      
      {/* Navigation container */}
      <nav 
        className="relative mx-auto max-w-lg px-4 sm:px-6"
        dir="rtl"
      >
        {/* Top border for visual separation */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
        
        {/* Navigation items container */}
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`
                  relative flex flex-col items-center justify-center 
                  min-w-[64px] py-2 px-3 rounded-xl
                  transition-all duration-200 ease-out
                  ${item.active 
                    ? 'text-[var(--highlight)]' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }
                  group
                `}
                aria-label={item.label}
                aria-current={item.active ? 'page' : undefined}
              >
                {/* Active indicator background */}
                {item.active && (
                  <div className="absolute inset-0 bg-[var(--highlight)]/10 rounded-xl scale-110 animate-fade-in" />
                )}
                
                {/* Icon */}
                <Icon className={`
                  relative w-6 h-6 mb-1
                  transition-all duration-200
                  ${item.active 
                    ? 'scale-110' 
                    : 'group-hover:scale-105 group-active:scale-95'
                  }
                `} />
                
                {/* Label */}
                <span className={`
                  relative text-xs font-medium
                  transition-all duration-200
                  ${item.active 
                    ? 'opacity-100' 
                    : 'opacity-70 group-hover:opacity-100'
                  }
                `}>
                  {item.label}
                </span>
                
                {/* Active dot indicator */}
                {item.active && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[var(--highlight)] rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
} 