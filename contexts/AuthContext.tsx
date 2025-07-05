import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  userEmail: string | null;
  authToken: string | null;
  isLoading: boolean;
  setAuth: (email: string, token: string) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication on mount
    const checkAuth = async () => {
      console.log('[AuthContext] Checking authentication...');
      try {
        const savedEmail = localStorage.getItem('ramel_user_email');
        const savedToken = localStorage.getItem('ramel_auth_token');
        
        console.log('[AuthContext] Saved auth:', { 
          email: savedEmail, 
          hasToken: !!savedToken,
          tokenLength: savedToken?.length 
        });
        
        if (savedEmail && savedToken) {
          // Verify token is still valid
          console.log('[AuthContext] Verifying saved token...');
          const response = await fetch('/api/verify-auth-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: savedToken })
          });
          
          console.log('[AuthContext] Token verification response:', response.status);
          
          if (response.ok) {
            console.log('[AuthContext] Token valid, setting auth state');
            setUserEmail(savedEmail);
            setAuthToken(savedToken);
          } else {
            // Token invalid, clear localStorage
            console.log('[AuthContext] Token invalid, clearing localStorage');
            localStorage.removeItem('ramel_user_email');
            localStorage.removeItem('ramel_auth_token');
          }
        } else {
          console.log('[AuthContext] No saved auth found');
        }
      } catch (error) {
        console.error('[AuthContext] Failed to verify token:', error);
        // Clear localStorage on error
        localStorage.removeItem('ramel_user_email');
        localStorage.removeItem('ramel_auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const setAuth = (email: string, token: string) => {
    console.log('[AuthContext] Setting auth:', { email, tokenLength: token.length });
    
    try {
      localStorage.setItem('ramel_user_email', email);
      localStorage.setItem('ramel_auth_token', token);
      
      // Verify localStorage was actually written
      const savedEmail = localStorage.getItem('ramel_user_email');
      const savedToken = localStorage.getItem('ramel_auth_token');
      
      if (savedEmail === email && savedToken === token) {
        console.log('[AuthContext] Auth saved successfully to localStorage');
      } else {
        console.error('[AuthContext] Failed to save auth to localStorage!');
      }
      
      setUserEmail(email);
      setAuthToken(token);
    } catch (error) {
      console.error('[AuthContext] Error saving auth to localStorage:', error);
    }
  };

  const clearAuth = () => {
    console.log('[AuthContext] Clearing auth');
    localStorage.removeItem('ramel_user_email');
    localStorage.removeItem('ramel_auth_token');
    setUserEmail(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ userEmail, authToken, isLoading, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 