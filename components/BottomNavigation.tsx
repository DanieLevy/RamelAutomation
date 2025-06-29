import { useRouter } from 'next/router';
import { Home, Bell, Search } from 'lucide-react';

export default function BottomNavigation() {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
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
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <nav className="relative bg-background/95 backdrop-blur-md border border-border/20 rounded-full px-1.5 py-1.5 shadow-lg">
        {/* Moving bubble background */}
        <div 
          className="absolute top-1.5 bg-primary rounded-full transition-all duration-500 ease-in-out shadow-sm"
          style={{
            width: '44px',
            height: '44px',
            left: `${6 + (navItems.findIndex(item => item.active) * 48)}px`,
            transform: 'translateZ(0)', // Hardware acceleration
          }}
        />
        
        <div className="relative flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`
                  relative flex flex-col items-center justify-center p-2.5 rounded-full w-[44px] h-[44px] transition-all duration-200
                  ${item.active 
                    ? 'text-primary-foreground z-10' 
                    : 'text-foreground hover:text-foreground hover:bg-muted/30'
                  }
                `}
                aria-label={item.label}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-medium leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
} 