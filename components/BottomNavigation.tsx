import { useRouter } from 'next/router';
import { Home, Bell, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function BottomNavigation() {
  const router = useRouter();
  const currentPath = router.pathname;
  const navRef = useRef<HTMLDivElement>(null);
  const [bubbleStyle, setBubbleStyle] = useState<React.CSSProperties>({
    opacity: 0, // Start hidden until positioned
  });
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const navItems = [
    { 
      href: '/manual-search', 
      icon: Search, 
      label: 'חיפוש',
      active: currentPath === '/manual-search'
    },
    { 
      href: '/notifications', 
      icon: Bell, 
      label: 'התראות',
      active: currentPath === '/notifications'
    },
    { 
      href: '/', 
      icon: Home, 
      label: 'בית',
      active: currentPath === '/'
    }
  ];

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    
    const updateBubblePosition = () => {
      const activeIndex = navItems.findIndex(item => item.active);
      
      if (activeIndex >= 0 && buttonRefs.current[activeIndex] && navRef.current) {
        const button = buttonRefs.current[activeIndex];
        const nav = navRef.current;
        
        if (button && nav) {
          const buttonRect = button.getBoundingClientRect();
          const navRect = nav.getBoundingClientRect();
          
          // Calculate position relative to nav container
          const left = buttonRect.left - navRect.left;
          const top = buttonRect.top - navRect.top;
          
          // Verify the position makes sense (not negative or too large)
          if (left >= 0 && left < navRect.width && top >= 0 && top < navRect.height) {
            setBubbleStyle({
              left: `${left}px`,
              top: `${top}px`,
              width: `${buttonRect.width}px`,
              height: `${buttonRect.height}px`,
              opacity: 1, // Show once positioned
            });
            retryCount = maxRetries; // Stop retrying
          } else if (retryCount < maxRetries) {
            // Retry if position seems wrong
            retryCount++;
            setTimeout(updateBubblePosition, 50 * retryCount);
          }
        }
      }
    };

    // Initial positioning attempts with increasing delays
    updateBubblePosition();
    
    // Try multiple times to ensure DOM is ready
    const timers = [
      setTimeout(updateBubblePosition, 0),
      setTimeout(updateBubblePosition, 50),
      setTimeout(updateBubblePosition, 150),
      setTimeout(updateBubblePosition, 300),
    ];

    // Update on window resize
    const handleResize = () => {
      retryCount = 0;
      updateBubblePosition();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [currentPath]); // Re-run when path changes

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <nav 
        ref={navRef}
        className="relative bg-background/95 backdrop-blur-md border border-border/20 rounded-full px-1.5 py-1.5 shadow-lg overflow-hidden"
        dir="ltr" // Force LTR for the nav container to ensure consistent positioning
      >
        {/* Moving bubble background - position absolute to the nav container */}
        <div 
          className="absolute bg-primary rounded-full shadow-sm transition-all duration-300 ease-out pointer-events-none"
          style={{
            ...bubbleStyle,
            transform: 'translateZ(0)', // Hardware acceleration
          }}
        />
        
        <div className="relative flex items-center gap-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                ref={el => buttonRefs.current[index] = el}
                onClick={() => router.push(item.href)}
                className={`
                  relative flex flex-col items-center justify-center rounded-full w-[44px] h-[44px] 
                  transition-all duration-200 ease-out z-10
                  ${item.active 
                    ? 'text-primary-foreground scale-100' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:scale-95'
                  }
                `}
                aria-label={item.label}
                dir="rtl" // Ensure button content (Hebrew text) is RTL
              >
                <Icon className={`transition-all duration-200 ${
                  item.active ? 'w-5 h-5' : 'w-4 h-4'
                }`} />
                <span className={`text-[8px] font-medium leading-none mt-0.5 transition-all duration-200 ${
                  item.active ? 'opacity-100' : 'opacity-80'
                }`}>
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