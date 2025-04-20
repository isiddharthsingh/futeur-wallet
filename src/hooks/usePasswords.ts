
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
  const getEncryptionKey = () => {
    if (!user) return "";
    // Using user ID as part of the encryption key
    return `${user.id}-futeur-secure-key`;
  };

  const { data: passwords = [], isLoading } = useQuery({
    queryKey: ["passwords"],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      // Fetch user's own passwords
      const { data: ownPasswords, error: ownError } = await supabase
        .from("passwords")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ownError) {
        toast.error("Failed to fetch passwords");
        throw ownError;
      }

      // Fetch shared passwords
      const { data: sharedPasswordsData, error: sharedError } = await supabase
        .from("password_shares")
        .select(`
          password_id,
          passwords (*)
        `)
        .eq("shared_with", user.id);

      if (sharedError) {
        toast.error("Failed to fetch shared passwords");
        throw sharedError;
      }

      // Extract the actual password objects from the shared data
      const sharedPasswords = sharedPasswordsData
        .filter(share => share.passwords) // Make sure passwords exist
        .map(share => share.passwords);

      // Combine own and shared passwords
      const encryptionKey = getEncryptionKey();
      const allPasswords = [
        ...ownPasswords,
        ...sharedPasswords
      ].map(pwd => ({
        ...pwd,
        password: decryptData(pwd.password, encryptionKey),
        username: decryptData(pwd.username, encryptionKey)
      }));

      return allPasswords;
    },
    enabled: !!user,
  });

  const addPassword = useMutation({
    mutationFn: async (newPassword: Omit<Password, "id" | "updated_at">) => {
      if (!user) throw new Error("User must be logged in to add passwords");
      
      const encryptionKey = getEncryptionKey();
      
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
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
      toast.success("Password added successfully");
    },
    onError: () => {
      toast.error("Failed to add password");
    },
  });

  const updatePassword = useMutation({
    mutationFn: async (password: Partial<Password> & { id: string }) => {
      const encryptionKey = getEncryptionKey();
      
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
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
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
      queryClient.invalidateQueries({ queryKey: ["passwords"] });
      toast.success("Password deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete password");
    },
  });

  return {
    passwords,
    isLoading,
    addPassword,
    updatePassword,
    deletePassword,
  };
}
