
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Share } from "lucide-react";

interface Password {
  id: string;
  title: string;
  username: string;
  isShared?: boolean;
}

interface MultiSharePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passwords: Password[];
}

export function MultiSharePasswordDialog({ open, onOpenChange, passwords }: MultiSharePasswordDialogProps) {
  const [email, setEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [selectedPasswords, setSelectedPasswords] = useState<string[]>([]);

  const handleShare = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    if (selectedPasswords.length === 0) {
      toast.error("Please select at least one password to share");
      return;
    }

    setIsSharing(true);
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      // Get user ID by email
      const { data: userId, error: userError } = await supabase.rpc('get_user_id_by_email', {
        email_input: email
      });

      if (userError) {
        console.error("Error looking up user:", userError);
        toast.error("Error looking up user");
        return;
      }

      if (!userId) {
        toast.error("User not found. Make sure the email address is registered.");
        return;
      }

      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to share passwords");
        return;
      }

      // Share each selected password
      const sharePromises = selectedPasswords.map(passwordId => 
        supabase
          .from('password_shares')
          .insert({
            password_id: passwordId,
            shared_with: userId,
            shared_by: user.id
          })
          .then(({ error }) => {
            if (error && error.code !== '23505') { // Ignore duplicate share errors
              throw error;
            }
          })
      );

      await Promise.all(sharePromises);

      toast.success("Passwords shared successfully");
      setEmail("");
      setSelectedPasswords([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Share error:", error);
      toast.error("Failed to share some passwords");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Multiple Passwords</DialogTitle>
          <DialogDescription>
            Select the passwords you want to share and enter the recipient's email address.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-4 max-h-[300px] overflow-y-auto">
            {passwords.map((pwd) => (
              <div key={pwd.id} className="flex items-center space-x-2">
                <Checkbox
                  id={pwd.id}
                  checked={selectedPasswords.includes(pwd.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPasswords(prev => [...prev, pwd.id]);
                    } else {
                      setSelectedPasswords(prev => prev.filter(id => id !== pwd.id));
                    }
                  }}
                />
                <Label htmlFor={pwd.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {pwd.title}
                </Label>
              </div>
            ))}
          </div>

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

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedPasswords([]);
              setEmail("");
              onOpenChange(false);
            }}
            disabled={isSharing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleShare}
            disabled={isSharing || selectedPasswords.length === 0}
          >
            <Share className="mr-2 h-4 w-4" />
            Share Selected ({selectedPasswords.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
