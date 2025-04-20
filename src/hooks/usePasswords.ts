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

  const { data: allPasswords = [], isLoading } = useQuery({
    queryKey: ["all-passwords"],
    queryFn: async () => {
      if (!user) {
        return [];
      }

      console.log("Fetching passwords for user:", user.id);

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

      const { data: sharedWithMe, error: sharedWithMeError } = await supabase
        .from("password_shares")
        .select(`
          password_id,
          passwords:password_id (
            *
          )
        `)
        .eq("shared_with", user.id);

      if (sharedWithMeError) {
        toast.error("Failed to fetch shared passwords");
        throw sharedWithMeError;
      }

      console.log("Shared passwords fetched:", sharedWithMe?.length);

      const encryptionKey = getEncryptionKey(user.id);
      const decryptedOwnPasswords = ownPasswords.map(pwd => ({
        ...pwd,
        password: decryptData(pwd.password, encryptionKey),
        username: decryptData(pwd.username, encryptionKey),
        isShared: false
      }));

      const sharedPasswords = sharedWithMe
        .filter(share => share.passwords)
        .map(share => {
          const pwd = share.passwords;
          const ownerEncryptionKey = getEncryptionKey(pwd.user_id);
          return {
            ...pwd,
            password: decryptData(pwd.password, ownerEncryptionKey),
            username: decryptData(pwd.username, ownerEncryptionKey),
            isShared: true
          };
        });

      console.log("Processed shared passwords:", sharedPasswords.length);

      return [...decryptedOwnPasswords, ...sharedPasswords];
    },
    enabled: !!user,
  });

  const ownPasswords = allPasswords.filter(pwd => !pwd.isShared);
  const sharedPasswords = allPasswords.filter(pwd => pwd.isShared);

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
      
      const updateData: any = { ...password };
      
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
