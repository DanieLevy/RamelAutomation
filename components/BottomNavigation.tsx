import { useRouter } from 'next/router';
import { Home, Bell, Search } from 'lucide-react';
import { useMemo } from 'react';

export default function BottomNavigation() {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = useMemo(() => [
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
  ], [currentPath]);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[400px] px-4">
      <nav 
        className="bg-white dark:bg-gray-900 rounded-[32px] shadow-[0_14px_28px_rgba(143,156,212,0.25),0_10px_10px_rgba(143,156,212,0.22)] dark:shadow-[0_14px_28px_rgba(0,0,0,0.25),0_10px_10px_rgba(0,0,0,0.22)] max-[350px]:max-w-[120px] max-[350px]:pb-5"
        dir="ltr"
      >
        <div className="flex items-center justify-between w-full max-[350px]:flex-col max-[350px]:items-center">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`
                  group relative flex flex-col items-center justify-center 
                  flex-1 min-h-[80px] py-3 max-[350px]:flex-initial max-[350px]:w-full
                  cursor-pointer transition-all duration-500 ease-out
                  ${item.active 
                    ? 'text-[var(--highlight)] transform -translate-y-[6px]' 
                    : 'text-[#555] dark:text-gray-400 hover:text-[var(--highlight)] hover:transform hover:-translate-y-[6px]'
                  }
                `}
                aria-label={item.label}
                dir="rtl"
              >
                <Icon className={`
                  w-5 h-5 transition-all duration-300 
                  ${item.active ? '' : 'group-hover:scale-110'}
                `} />
                
                {/* Text appears only for active item or on hover */}
                <span className={`
                  absolute text-[13px] font-medium leading-none
                  transition-all duration-500 ease-out
                  ${item.active 
                    ? 'opacity-100 transform translate-y-[20px] max-[350px]:translate-y-[25px]' 
                    : 'opacity-0 transform translate-y-[50px] group-hover:opacity-100 group-hover:translate-y-[20px] max-[350px]:group-hover:translate-y-[25px]'
                  }
                `}>
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