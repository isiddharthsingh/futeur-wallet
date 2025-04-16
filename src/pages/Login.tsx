
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Mock authentication - in a real app, this should use a proper auth system
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simple mock validation - replace with actual authentication
    if (email === "admin@company.com" && password === "admin123") {
      setTimeout(() => {
        localStorage.setItem("isAuthenticated", "true");
        navigate("/dashboard");
      }, 1000);
    } else {
      setTimeout(() => {
        setError("Invalid email or password");
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-full">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mt-4 gradient-text">Futeur Wallet</h1>
          <p className="text-sm text-muted-foreground mt-1">by Futeur Secure</p>
        </div>
        
        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Secure Access</CardTitle>
            <CardDescription>
              Enter your credentials to access the company password wallet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Authenticating..." : "Access Wallet"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
            <div>Protected company access. Unauthorized access is prohibited.</div>
            <div>© {new Date().getFullYear()} Futeur Secure</div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
