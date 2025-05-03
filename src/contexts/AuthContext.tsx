
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isRecoveryMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Auth provider initializing");
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        
        // Check if this is a recovery session (password reset flow)
        if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery session detected');
          setIsRecoveryMode(true);
          // Navigate to the reset password page
          navigate('/reset-password');
        } else if (event === 'SIGNED_IN') {
          // Reset recovery mode when user signs in
          setIsRecoveryMode(false);
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("Initial session check:", currentSession ? "logged in" : "not logged in");
      
      // Check if the session is a recovery session
      const isRecovery = currentSession?.user?.aud === 'recovery';
      if (isRecovery) {
        console.log('Recovery session detected during initial check');
        setIsRecoveryMode(true);
        // Navigate to reset password page
        navigate('/reset-password');
      }
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      console.log("Auth provider cleanup");
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    navigate('/dashboard');
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    toast.success('Account created successfully! Please check your email for verification.');
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate('/login');
  };

  const changePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    // Determine the correct redirect URL based on environment
    const isLocalhost = window.location.hostname === 'localhost';
    const redirectUrl = isLocalhost
      ? `${window.location.origin}/reset-password`
      : `https://vault.futeursecure.com/reset-password`;
      
    console.log(`Setting password reset redirect to: ${redirectUrl}`);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    if (error) throw error;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading auth...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      isRecoveryMode,
      signIn, 
      signUp, 
      signOut, 
      changePassword,
      resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
