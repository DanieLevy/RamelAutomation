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
      try {
        const savedEmail = localStorage.getItem('ramel_user_email');
        const savedToken = localStorage.getItem('ramel_auth_token');
        
        if (savedEmail && savedToken) {
          // Verify token is still valid
          const response = await fetch('/api/verify-auth-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: savedToken })
          });
          
          if (response.ok) {
            setUserEmail(savedEmail);
            setAuthToken(savedToken);
          } else {
            // Token invalid, clear localStorage
            localStorage.removeItem('ramel_user_email');
            localStorage.removeItem('ramel_auth_token');
          }
        }
      } catch (error) {
        console.error('Failed to verify token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const setAuth = (email: string, token: string) => {
    localStorage.setItem('ramel_user_email', email);
    localStorage.setItem('ramel_auth_token', token);
    setUserEmail(email);
    setAuthToken(token);
  };

  const clearAuth = () => {
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