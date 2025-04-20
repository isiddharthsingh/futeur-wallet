import { useState } from "react";
import { Eye, EyeOff, Copy, Check, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharePasswordDialog } from "./SharePasswordDialog";

interface PasswordCardProps {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  lastUpdated: string;
  onEdit: () => void;
}

export function PasswordCard({ 
  id,
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
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(username);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const formattedDate = new Date(lastUpdated).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <>
      <div className="bg-card rounded-lg border p-6 space-y-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">{title}</h3>
            {url ? (
              <a 
                href={url.startsWith('http') ? url : `https://${url}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {url}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">No URL provided</p>
            )}
          </div>
          <Badge variant="outline" className="capitalize">
            {category}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Username</label>
            <div className="flex items-center justify-between">
              <span className="font-medium">{username}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleCopyUsername}
                className="h-8 w-8 p-0"
              >
                {copiedUsername ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="sr-only">Copy username</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Password</label>
            <div className="flex items-center justify-between">
              <span className="font-medium tracking-wider">
                {showPassword ? password : '•'.repeat(8)}
              </span>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={togglePasswordVisibility}
                  className="h-8 w-8 p-0"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleCopyPassword}
                  className="h-8 w-8 p-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy password</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm text-muted-foreground">
            Updated {formattedDate}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          </div>
        </div>
      </div>

      <SharePasswordDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        passwordId={id}
      />
    </>
  );
}
