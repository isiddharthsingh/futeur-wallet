import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Lottie from "lottie-react";
// Use the JSON format with proper type declaration
import loginAnimation from "../../asset/Secure Login.json";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [credentials, setCredentials] = useState<{email: string, password: string, type: 'signin' | 'signup'} | null>(null);
  const {
    signIn,
    signUp,
    resetPassword,
    session
  } = useAuth();
  const navigate = useNavigate();
  // Effect to handle delayed sign in after animation
  useEffect(() => {
    let timer: number;
    
    if (showAnimation && credentials) {
      timer = window.setTimeout(async () => {
        try {
          if (credentials.type === 'signin') {
            await signIn(credentials.email, credentials.password);
            toast.success('Successfully signed in!');
            setShowAnimation(false);
            navigate('/dashboard');
          } else {
            await signUp(credentials.email, credentials.password);
            toast.success('Registration successful! Please check your email to confirm your account.');
            setShowAnimation(false);
          }
        } catch (error: any) {
          toast.error(error.message || 'An error occurred');
          setShowAnimation(false);
        }
        setCredentials(null);
      }, 5000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showAnimation, credentials, signIn, navigate]);
  
  // Handle initial session redirect
  useEffect(() => {
    if (session && !showAnimation) {
      navigate('/dashboard');
    }
  }, [session, showAnimation, navigate]);
  const handleAuth = async (type: 'signin' | 'signup') => {
    setIsLoading(true);
    try {
      // Store credentials and show animation for both signin and signup
      setCredentials({ email, password, type });
      setShowAnimation(true);
    } catch (error: any) {
      setShowAnimation(false);
      setCredentials(null);
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPassword(resetEmail);
      toast.success('Password reset instructions sent to your email');
      setShowResetForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset instructions');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative">
      {showAnimation && (
        <div className="fixed inset-0 bg-background/50 dark:bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center">
          <div className="w-64 h-64">
            <Lottie 
              animationData={loginAnimation} 
              loop={true} 
              autoplay={true}
              rendererSettings={{
                preserveAspectRatio: 'xMidYMid slice'
              }}
            />
          </div>
          <p className="text-primary font-bold mt-4 text-center">
            {credentials?.type === 'signup' ? 'Creating account...' : 'Signing in...'}
          </p>
        </div>
      )}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-full">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mt-4 gradient-text">Futeur Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">by Futeur Secure</p>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Sign in or create an account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showResetForm ? <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" type="email" placeholder="name@company.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                </div>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" className="w-1/2" onClick={() => setShowResetForm(false)}>
                    Back
                  </Button>
                  <Button type="submit" className="w-1/2" disabled={isLoading}>
                    {isLoading ? "Sending..." : "Send Instructions"}
                  </Button>
                </div>
              </form> : <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={e => {
                e.preventDefault();
                handleAuth('signin');
              }}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                      </div>
                      <div className="flex justify-end">
                        <Button type="button" variant="link" className="px-0 text-sm" onClick={() => {
                      setResetEmail(email);
                      setShowResetForm(true);
                    }}>
                          Forgot password?
                        </Button>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={e => {
                e.preventDefault();
                handleAuth('signup');
              }}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input id="signup-email" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>}
          </CardContent>
        </Card>
      </div>
    </div>;
}