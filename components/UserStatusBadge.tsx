import { useState } from 'react';
import { User, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function UserStatusBadge() {
  const { userEmail, clearAuth } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!userEmail) return null;

  // Smart email truncation
  const truncateEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    
    // If email is short enough, show it all
    if (email.length <= 20) return email;
    
    // If local part is too long, truncate it
    if (localPart.length > 12) {
      return `${localPart.substring(0, 6)}...@${domain}`;
    }
    
    // Otherwise show full local part with truncated domain if needed
    if (domain.length > 10) {
      return `${localPart}@${domain.substring(0, 10)}...`;
    }
    
    return email;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-950/30 
                         text-green-700 dark:text-green-400 rounded-full text-xs font-medium
                         hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors
                         border border-green-200 dark:border-green-800/30">
          <User className="w-3 h-3" />
          <span className="max-w-[120px] truncate">{truncateEmail(userEmail)}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="end" dir="rtl">
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">מחובר כ:</div>
            <div className="font-medium text-sm break-all">{userEmail}</div>
          </div>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              clearAuth();
              setIsOpen(false);
            }}
          >
            <LogOut className="w-4 h-4 ml-2" />
            התנתק
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
} 