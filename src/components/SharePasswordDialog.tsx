
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Share, X } from "lucide-react";
import { sendPasswordSharedEmail } from "@/integrations/emailjs/client";

interface SharePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passwordId: string;
}

export function SharePasswordDialog({ open, onOpenChange, passwordId }: SharePasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [passwordTitle, setPasswordTitle] = useState("");
  
  // Fetch password details when dialog opens
  useEffect(() => {
    if (open && passwordId) {
      const fetchPasswordDetails = async () => {
        const { data, error } = await supabase
          .from('passwords')
          .select('title')
          .eq('id', passwordId)
          .single();
          
        if (data) {
          setPasswordTitle(data.title);
        }
      };
      
      fetchPasswordDetails();
    }
  }, [open, passwordId]);

  const handleShare = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSharing(true);
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        setIsSharing(false);
        return;
      }

      // Use our custom function to find the user ID by email
      const { data: userId, error: userError } = await supabase.rpc('get_user_id_by_email', {
        email_input: email
      });

      if (userError) {
        console.error("Error looking up user:", userError);
        toast.error("Error looking up user");
        setIsSharing(false);
        return;
      }

      if (!userId) {
        toast.error("User not found. Make sure the email address is registered.");
        setIsSharing(false);
        return;
      }

      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to share passwords");
        setIsSharing(false);
        return;
      }

      // Create the share record
      const { error: shareError } = await supabase
        .from('password_shares')
        .insert({
          password_id: passwordId,
          shared_with: userId,
          shared_by: user.id
        });

      if (shareError) {
        if (shareError.code === '23505') {
          toast.error("Password already shared with this user");
        } else {
          console.error("Share error:", shareError);
          toast.error("Failed to share password");
        }
        setIsSharing(false);
        return;
      }

      // Get current user's name or email for the notification
      const currentUserEmail = user.email || 'A user';
      const currentUserName = user.user_metadata?.full_name || currentUserEmail;
      
      // Send email notification
      await sendPasswordSharedEmail({
        to_email: email,
        from_name: currentUserName,
        password_title: passwordTitle || 'a password',
        message: `${currentUserName} has shared a password with you in Futeur Vault. Log in to view it.`
      });
      // Email errors are handled silently in the sendPasswordSharedEmail function
      
      toast.success("Password shared successfully");
      setEmail("");
      onOpenChange(false);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An error occurred while sharing");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Password</DialogTitle>
          <DialogDescription>
            Enter the email address of the user you want to share this password with.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Share with (email)</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter user email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSharing}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing}
          >
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
