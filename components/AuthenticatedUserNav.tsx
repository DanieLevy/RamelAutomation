import { useState } from 'react';
import { Button } from './ui/button';
import { User, LogOut, Settings } from 'lucide-react';

interface AuthenticatedUserNavProps {
  email: string;
  subscriptionCount: number;
  onDisconnect: () => void;
  className?: string;
}

export default function AuthenticatedUserNav({ 
  email, 
  subscriptionCount, 
  onDisconnect, 
  className = '' 
}: AuthenticatedUserNavProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getEmailInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
      >
        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
          {getEmailInitials(email)}
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-foreground leading-tight">
            {email.split('@')[0]}
          </div>
          <div className="text-[10px] text-muted-foreground leading-tight">
            {subscriptionCount} התראות
          </div>
        </div>
      </button>
      
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 min-w-[180px]">
          <div className="p-2 border-b border-border">
            <div className="text-xs text-muted-foreground">מחובר כ:</div>
            <div className="text-sm font-medium text-foreground truncate">{email}</div>
          </div>
          <div className="p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowMenu(false);
                onDisconnect();
              }}
              className="w-full justify-start text-xs h-8"
            >
              <LogOut className="w-3 h-3 ml-2" />
              התנתק
            </Button>
          </div>
        </div>
      )}
      
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
} 