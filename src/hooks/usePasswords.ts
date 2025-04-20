
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Password {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  updated_at: string;
  user_id: string;
}

export function usePasswords() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Simple encryption/decryption functions using Base64 and XOR
  const encryptData = (text: string, key: string): string => {
    // Create a simple XOR cipher with the key
    const keyBytes = Array.from(key).map(char => char.charCodeAt(0));
    
    // XOR each character with the corresponding key character
    const encryptedBytes = Array.from(text).map((char, i) => {
      const charCode = char.charCodeAt(0);
      const keyByte = keyBytes[i % keyBytes.length];
      return String.fromCharCode(charCode ^ keyByte);
    }).join('');
    
    // Convert to Base64 for storage
    return btoa(encryptedBytes);
  };

  // Decrypt function reverses the process
  const decryptData = (encryptedBase64: string, key: string): string => {
    try {
      // Convert from Base64
      const encryptedBytes = atob(encryptedBase64);
      
      // Apply XOR with the key
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

  // Generate encryption key based on user ID
  const getEncryptionKey = (userId: string) => {
    // Using user ID as part of the encryption key
    return `${userId}-futeur-secure-key`;
  };

  const { data: allPasswords = [], isLoading } = useQuery({
    queryKey: ["all-passwords"],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      console.log("Fetching passwords for user:", user.id);

      // Fetch user's own passwords
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

      // Fetch the password IDs that have been shared with the user
      const { data: sharedWithMe, error: sharedWithMeError } = await supabase
        .from("password_shares")
        .select("password_id")
        .eq("shared_with", user.id);

      if (sharedWithMeError) {
        toast.error("Failed to fetch shared password references");
        throw sharedWithMeError;
      }

      console.log("Shared password references fetched:", sharedWithMe?.length);

      // Decrypt and mark own passwords
      const encryptionKey = getEncryptionKey(user.id);
      const decryptedOwnPasswords = ownPasswords.map(pwd => ({
        ...pwd,
        password: decryptData(pwd.password, encryptionKey),
        username: decryptData(pwd.username, encryptionKey),
        isShared: false
      }));

      // If there are no shared passwords, just return the own passwords
      if (!sharedWithMe || sharedWithMe.length === 0) {
        console.log("No shared passwords found");
        return decryptedOwnPasswords;
      }

      // Extract the shared password IDs
      const sharedPasswordIds = sharedWithMe.map(share => share.password_id);
      console.log("Shared password IDs:", sharedPasswordIds);
      
      // Debug: Check if the ID array is properly formatted
      console.log("Password IDs type:", typeof sharedPasswordIds, "Is array:", Array.isArray(sharedPasswordIds));
      
      // Convert string array to proper format for .in query if needed
      if (sharedPasswordIds.length === 0) {
        console.log("No shared password IDs found after mapping");
        return decryptedOwnPasswords;
      }
      
      // Fetch each shared password individually to work around potential RLS issues
      let sharedPasswords: any[] = [];
      
      for (const passwordId of sharedPasswordIds) {
        try {
          // Fetch the individual password by ID
          const { data, error } = await supabase
            .from("passwords")
            .select("*")
            .eq("id", passwordId)
            .single();
          
          if (error) {
            console.error(`Error fetching shared password ${passwordId}:`, error);
            continue; // Skip this password but continue with others
          }
          
          if (data) {
            sharedPasswords.push(data);
            console.log(`Successfully fetched shared password: ${data.title}`);
          }
        } catch (err) {
          console.error(`Error processing shared password ${passwordId}:`, err);
        }
      }
      
      console.log("Shared passwords fetched:", sharedPasswords?.length, "Details:", sharedPasswords);
      
      // If no shared passwords were found, return only own passwords
      if (!sharedPasswords || sharedPasswords.length === 0) {
        console.log("No actual shared passwords found in database");
        return decryptedOwnPasswords;
      }
      
      // Decrypt and mark shared passwords
      const decryptedSharedPasswords = sharedPasswords.map(pwd => {
        // Use the owner's encryption key for shared passwords
        const ownerEncryptionKey = getEncryptionKey(pwd.user_id);
        
        try {
          // Log decryption attempts for debugging
          console.log(`Decrypting shared password ${pwd.id} from user ${pwd.user_id}`);
          
          return {
            ...pwd,
            password: decryptData(pwd.password, ownerEncryptionKey),
            username: decryptData(pwd.username, ownerEncryptionKey),
            isShared: true
          };
        } catch (error) {
          console.error(`Failed to decrypt shared password ${pwd.id}:`, error);
          return {
            ...pwd,
            password: "**Decryption Error**",
            username: "**Decryption Error**",
            isShared: true
          };
        }
      });

      console.log("Total own passwords:", decryptedOwnPasswords.length);
      console.log("Total shared passwords:", decryptedSharedPasswords.length);
      console.log("Returning combined passwords:", 
        decryptedOwnPasswords.length + decryptedSharedPasswords.length);

      // Return combined array of both own and shared passwords
      return [...decryptedOwnPasswords, ...decryptedSharedPasswords];
    },
    enabled: !!user,
  });

  // Filter for own passwords
  const ownPasswords = allPasswords.filter(pwd => !pwd.isShared);
  
  // Filter for shared passwords
  const sharedPasswords = allPasswords.filter(pwd => pwd.isShared);

  console.log("All passwords:", allPasswords.length);
  console.log("Own passwords:", ownPasswords.length);
  console.log("Shared passwords:", sharedPasswords.length);

  const addPassword = useMutation({
    mutationFn: async (newPassword: Omit<Password, "id" | "updated_at">) => {
      if (!user) throw new Error("User must be logged in to add passwords");
      
      const encryptionKey = getEncryptionKey(user.id);
      
      // Encrypt sensitive fields before saving
      const encryptedPassword = {
        ...newPassword,
        password: encryptData(newPassword.password, encryptionKey),
        username: encryptData(newPassword.username, encryptionKey),
        user_id: user.id,
      };
      
      const { error } = await supabase.from("passwords").insert([encryptedPassword]);
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
      const encryptionKey = getEncryptionKey(user?.id || "");
      
      // Create an object with only the fields to update
      const updateData: any = { ...password };
      
      // Encrypt sensitive fields if they're being updated
      if (updateData.password) {
        updateData.password = encryptData(updateData.password, encryptionKey);
      }
      
      if (updateData.username) {
        updateData.username = encryptData(updateData.username, encryptionKey);
      }
      
      const { error } = await supabase
        .from("passwords")
        .update(updateData)
        .eq("id", password.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-passwords"] });
      toast.success("Password updated successfully");
    },
    onError: () => {
      toast.error("Failed to update password");
    },
  });

  const deletePassword = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("passwords").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-passwords"] });
      toast.success("Password deleted successfully");
    },
    onError: () => {
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
