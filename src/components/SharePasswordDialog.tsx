
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Share, X } from "lucide-react";

interface SharePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passwordId: string;
}

export function SharePasswordDialog({ open, onOpenChange, passwordId }: SharePasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSharing(true);
    try {
      // First, get the user ID for the provided email
      const { data: userResults, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', email)
        .single();

      if (userError || !userResults) {
        toast.error("User not found");
        return;
      }

      // Create the share record
      const { error: shareError } = await supabase
        .from('password_shares')
        .insert({
          password_id: passwordId,
          shared_with: userResults.id,
          shared_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (shareError) {
        if (shareError.code === '23505') {
          toast.error("Password already shared with this user");
        } else {
          toast.error("Failed to share password");
        }
        return;
      }

      toast.success("Password shared successfully");
      setEmail("");
      onOpenChange(false);
    } catch (error) {
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
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Share with (email)</Label>
            <Input
              id="email"
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
