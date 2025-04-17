
import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PasswordCardProps {
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  lastUpdated: string;
  onEdit: () => void;
}

export function PasswordCard({ 
  title, 
  username, 
  password, 
  url, 
  category, 
  lastUpdated, 
  onEdit 
}: PasswordCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Format date to a more readable format
  const formattedDate = new Date(lastUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {url && (
                <a 
                  href={url.startsWith('http') ? url : `https://${url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {url}
                </a>
              )}
              {!url && "No URL provided"}
            </CardDescription>
          </div>
          <Badge className="bg-accent text-accent-foreground hover:bg-accent/80">
            {category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Username</div>
          <div className="flex items-center justify-between">
            <div className="font-medium">{username}</div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                navigator.clipboard.writeText(username);
              }}
              className="h-7 w-7 p-0"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="sr-only">Copy username</span>
            </Button>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Password</div>
          <div className="flex items-center justify-between">
            <div className="font-medium tracking-wider">
              {showPassword ? password : '•'.repeat(8)}
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={togglePasswordVisibility}
                className="h-7 w-7 p-0"
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                <span className="sr-only">
                  {showPassword ? "Hide password" : "Show password"}
                </span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyPassword}
                className="h-7 w-7 p-0"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span className="sr-only">Copy password</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          Updated {formattedDate}
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}
