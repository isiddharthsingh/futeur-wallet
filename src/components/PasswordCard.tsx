import { useState } from "react";
import { Eye, EyeOff, Copy, Check, Share, Users, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SharePasswordDialog } from "./SharePasswordDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PasswordCardProps {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  lastUpdated: string;
  onEdit: () => void;
  isShared?: boolean;
}

export function PasswordCard({ 
  id,
  title, 
  username, 
  password, 
  url, 
  category, 
  lastUpdated,
  onEdit,
  isShared = false
}: PasswordCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharedWithDialogOpen, setSharedWithDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  
  const { data: sharedWithUsers = [], isLoading: sharedUsersLoading } = useQuery({
    queryKey: ['sharedWithUsers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('password_shares_with_user')
        .select('id, shared_with_email')
        .eq('password_id', id);
      if (error) throw error;
      return (data || []) as {id: string, shared_with_email: string}[];
    },
    enabled: sharedWithDialogOpen // Only fetch when dialog is open
  });
  
  const unsharePassword = useMutation({
    mutationFn: async (shareId: string) => {
      // Call the server-side function that bypasses RLS
      const { data, error } = await supabase
        .rpc('revoke_password_share', {
          share_id: shareId
        });
      
      if (error) throw error;
      if (!data) throw new Error('Failed to revoke access');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedWithUsers', id] });
      toast.success("Access revoked successfully");
    },
    onError: (error) => {
      console.error("Failed to revoke access:", error);
      toast.error("Failed to revoke access");
    }
  });
  
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
          <div className="flex gap-2">
            {isShared && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Shared
              </Badge>
            )}
            <Badge variant="outline" className="capitalize">
              {category}
            </Badge>
          </div>
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
            <Button variant="outline" size="sm" onClick={() => setSharedWithDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Shared With
            </Button>
            {!isShared && (
              <>
                <Button variant="outline" size="sm" onClick={() => setShareDialogOpen(true)}>
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  Edit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <SharePasswordDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        passwordId={id}
      />
      
      <Dialog open={sharedWithDialogOpen} onOpenChange={setSharedWithDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Shared With</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {sharedUsersLoading ? (
              <p className="text-center">Loading shared users...</p>
            ) : sharedWithUsers.length === 0 ? (
              <p className="text-center text-muted-foreground">This password is not shared with anyone.</p>
            ) : (
              <ul className="space-y-2">
                {sharedWithUsers.map((user, index) => (
                  <li key={index} className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{user.shared_with_email}</span>
                    </div>
                    {!isShared && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => unsharePassword.mutate(user.id)}
                        disabled={unsharePassword.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Revoke access</span>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
