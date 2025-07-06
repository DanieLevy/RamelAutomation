import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import OpportunityBanner from '@/components/OpportunityBanner';
import UserOTPAuth from '@/components/UserOTPAuth';
import { Button } from '@/components/ui/button';
import { Search, Plus, Bell, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { userEmail, setAuth, clearAuth } = useAuth();

  const refreshOpportunities = async () => {
    console.log('🔄 Starting manual refresh...');
    try {
      const response = await fetch('/api/check-appointments', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          mode: 'closest',  // Find the first available appointment
          days: 365         // Check up to a year ahead
        })
      });
      
      const data = await response.json();
      console.log('📊 Manual refresh response:', data);
      console.log('📊 First appointment:', data.results?.[0] || data.summary?.earliestAvailable);
      
      // Small delay to ensure cache is written
      setTimeout(() => {
        console.log('🔄 Reloading page...');
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to refresh opportunities:', error);
    }
  };

  const handleAuthenticated = (email: string, token: string) => {
    setAuth(email, token);
  };

  return (
    <Layout title="תורים לרם-אל | בדיקת תורים פנויים" description="בדיקת תורים פנויים למספרת רם-אל">
      <div className="space-y-6">

        {/* Opportunity Banner - Only shown on home page */}
        <OpportunityBanner onRefresh={refreshOpportunities} />
          {!userEmail ? (
            // User not connected - show OTP authentication
            <div className="space-y-6">
              <UserOTPAuth onAuthenticated={handleAuthenticated} />

              {/* Info for non-connected users */}
              <div className="text-center space-y-4 mt-8">
                <div className="bg-muted/30 rounded-lg p-4 max-w-sm mx-auto">
                  <p className="text-sm text-muted-foreground">
                    כדי לרשום התראות עליך להתחבר עם המייל שלך
                  </p>
                </div>
                
                {/* Quick Actions for non-connected users */}
                <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto">
                  <Button
                    onClick={() => router.push('/manual-search')}
                    variant="outline"
                    className="h-12 border-primary/30 text-primary hover:text-primary hover:bg-primary/10"
                    size="lg"
                  >
                    <Search className="w-5 h-5 ml-2" />
                    חיפוש ידני
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // User connected - show simple interface
            <div className="space-y-6">
              {/* Quick Actions for connected users */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">פעולות מהירות</h3>
                <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto">
                  <Button
                    onClick={() => router.push('/notifications')}
                    className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground justify-start"
                    size="lg"
                  >
                    <Bell className="w-5 h-5 ml-2" />
                    הרשמה להתראות
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/manage')}
                    variant="default"
                    className="h-11 bg-primary/90 hover:bg-primary text-primary-foreground justify-start"
                  >
                    <Settings className="w-4 h-4 ml-2" />
                    ניהול ההתראות שלי
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/manual-search')}
                    variant="outline"
                    className="h-11 border-primary/30 text-primary hover:text-primary hover:bg-primary/10 justify-start"
                  >
                    <Search className="w-4 h-4 ml-2" />
                    חיפוש ידני
                  </Button>
                </div>
                
                {/* Info */}
                <div className="bg-muted/30 rounded-lg p-4 max-w-sm mx-auto mt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    המערכת תשלח לך מייל כשיימצאו תורים פנויים בתאריכים שבחרת
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </Layout>
  );
} 