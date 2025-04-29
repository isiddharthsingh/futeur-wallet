
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SharedUser {
  email: string;
  shared_at: string;
}

interface Password {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  updated_at: string;
  user_id: string;
  created_at?: string;
  isShared?: boolean;
  sharedWith?: SharedUser[];
}

// The interface for the database password (doesn't have isShared field)
interface DbPassword {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  updated_at: string;
  user_id: string;
  created_at?: string;
}

export function usePasswords() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const encryptData = (text: string, key: string): string => {
    const keyBytes = Array.from(key).map(char => char.charCodeAt(0));
    const encryptedBytes = Array.from(text).map((char, i) => {
      const charCode = char.charCodeAt(0);
      const keyByte = keyBytes[i % keyBytes.length];
      return String.fromCharCode(charCode ^ keyByte);
    }).join('');
    return btoa(encryptedBytes);
  };

  const decryptData = (encryptedBase64: string, key: string): string => {
    try {
      const encryptedBytes = atob(encryptedBase64);
      const keyBytes = Array.from(key).map(char => char.charCodeAt(0));
      const decryptedText = Array.from(encryptedBytes).map((char, i) => {
        const charCode = char.charCodeAt(0);
        const keyByte = keyBytes[i % keyBytes.length];
        return String.fromCharCode(charCode ^ keyByte);
      }).join('');
      return decryptedText;
    } catch (error) {
      console.error("Failed to decrypt data:", error);
      return "**Decryption Error**";
    }
  };

  const getEncryptionKey = (userId: string) => {
    return `${userId}-futeur-secure-key`;
  };

  // Function to get shared users information for a password
  const getSharedUsers = async (passwordId: string): Promise<SharedUser[]> => {
    try {
      // First, get all the users with whom the password is shared
      const { data: shares, error: sharesError } = await supabase
        .from("password_shares")
        .select("shared_with, created_at")
        .eq("password_id", passwordId);
      
      if (sharesError || !shares || shares.length === 0) {
        return [];
      }

      // Extract user IDs from the shares
      const userIds = shares.map(share => share.shared_with);
      
      // Get user emails for these IDs using the Supabase function
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_user_emails_by_ids', { user_ids: userIds });
      
      if (usersError || !usersData) {
        console.error("Error fetching user emails:", usersError);
        return [];
      }
      
      // Map emails to shared users
      const sharedUsers = shares.map(share => {
        // Find the corresponding user email
        const user = usersData.find(u => u.id === share.shared_with);
        return {
          email: user ? user.email : 'Unknown user',
          shared_at: share.created_at
        };
      });
      
      return sharedUsers;
    } catch (error) {
      console.error("Error getting shared users:", error);
      return [];
    }
  };

  const { data: allPasswords = [], isLoading } = useQuery({
    queryKey: ["all-passwords"],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      console.log("Fetching passwords for user:", user.id);

      // Fetch own passwords
      const { data: ownPasswords, error: ownError } = await supabase
        .from("passwords")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ownError) {
        toast.error("Failed to fetch your passwords");
        throw ownError;
      }

      console.log("Own passwords fetched:", ownPasswords?.length);

      // Fetch shared passwords
      const { data: sharedWithMe, error: sharedError } = await supabase
        .from("password_shares")
        .select(`
          password_id,
          passwords (*)
        `)
        .eq("shared_with", user.id);

      if (sharedError) {
        console.error("Error fetching shared passwords:", sharedError);
        toast.error("Failed to fetch shared passwords");
        return [...ownPasswords];
      }

      // Process own passwords (decrypt them)
      const encryptionKey = getEncryptionKey(user.id);
      
      // Fetch shared users information for own passwords
      const ownPasswordsWithSharedInfo = await Promise.all(
        ownPasswords.map(async (pwd: DbPassword) => {
          const sharedUsers = await getSharedUsers(pwd.id);
          return {
            ...pwd,
            password: decryptData(pwd.password, encryptionKey),
            username: decryptData(pwd.username, encryptionKey),
            isShared: false,
            sharedWith: sharedUsers
          } as Password;
        })
      );

      // Process shared passwords
      const sharedPasswords = await Promise.all(
        sharedWithMe
          .filter(share => share.passwords)
          .map(async (share) => {
            const pwd = share.passwords as DbPassword;
            if (!pwd) return null;
            
            // Decrypt using the owner's encryption key
            const ownerEncryptionKey = getEncryptionKey(pwd.user_id);
            return {
              ...pwd,
              password: decryptData(pwd.password, ownerEncryptionKey),
              username: decryptData(pwd.username, ownerEncryptionKey),
              isShared: true,
              sharedWith: [] // Shared passwords don't need to display with whom they're shared
            } as Password;
          })
      );

      const validSharedPasswords = sharedPasswords.filter(Boolean) as Password[];
      
      console.log("Shared passwords processed:", validSharedPasswords.length);
      
      return [...ownPasswordsWithSharedInfo, ...validSharedPasswords] as Password[];
    },
    enabled: !!user,
  });

  const ownPasswords = allPasswords.filter(pwd => pwd.isShared !== true);
  const sharedPasswords = allPasswords.filter(pwd => pwd.isShared === true);

  console.log("All passwords:", allPasswords.length);
  console.log("Own passwords:", ownPasswords.length);
  console.log("Shared passwords:", sharedPasswords.length);

  const addPassword = useMutation({
    mutationFn: async (newPassword: Omit<Password, "id" | "updated_at">) => {
      if (!user) throw new Error("User must be logged in to add passwords");
      
      const encryptionKey = getEncryptionKey(user.id);
      
      const encryptedPassword = {
        ...newPassword,
        password: encryptData(newPassword.password, encryptionKey),
        username: encryptData(newPassword.username, encryptionKey),
        user_id: user.id,
      };
      
      // Remove isShared property before sending to database
      const { isShared, sharedWith, ...passwordToSave } = encryptedPassword;
      
      const { error } = await supabase.from("passwords").insert([passwordToSave]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-passwords"] });
      toast.success("Password added successfully");
    },
    onError: () => {
      toast.error("Failed to add password");
    },
  });

  const updatePassword = useMutation({
    mutationFn: async (password: Partial<Password> & { id: string }) => {
      if (!user) throw new Error("User must be logged in to update passwords");
      
      // Find the original password to check if it's owned by the current user
      const originalPassword = allPasswords.find(p => p.id === password.id);
      
      if (!originalPassword) {
        throw new Error("Password not found");
      }
      
      // Check if current user owns this password
      if (originalPassword.user_id !== user.id) {
        toast.error("You can only edit your own passwords");
        throw new Error("You can only edit your own passwords");
      }
      
      const encryptionKey = getEncryptionKey(user.id);
      
      const updateData: any = { ...password };
      
      // Remove isShared property before sending to database
      delete updateData.isShared;
      delete updateData.sharedWith;
      
      if (updateData.password) {
        updateData.password = encryptData(updateData.password, encryptionKey);
      }
      
      if (updateData.username) {
        updateData.username = encryptData(updateData.username, encryptionKey);
      }
      
      console.log("Updating password with ID:", password.id);
      
      const { error } = await supabase
        .from("passwords")
        .update(updateData)
        .eq("id", password.id);
        
      if (error) {
        console.error("Error updating password:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-passwords"] });
      toast.success("Password updated successfully");
    },
    onError: (error) => {
      console.error("Update password error:", error);
      toast.error("Failed to update password");
    },
  });

  const deletePassword = useMutation({
    mutationFn: async (id: string) => {
      // Find the password to check if it's owned by the current user
      const passwordToDelete = allPasswords.find(p => p.id === id);
      
      if (!passwordToDelete) {
        throw new Error("Password not found");
      }
      
      // Check if current user owns this password
      if (passwordToDelete.user_id !== user?.id) {
        toast.error("You can only delete your own passwords");
        throw new Error("You can only delete your own passwords");
      }
      
      const { error } = await supabase.from("passwords").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-passwords"] });
      toast.success("Password deleted successfully");
    },
    onError: (error) => {
      console.error("Delete password error:", error);
      toast.error("Failed to delete password");
    },
  });

  return {
    allPasswords,
    ownPasswords,
    sharedPasswords,
    isLoading,
    addPassword,
    updatePassword,
    deletePassword,
  };
}
