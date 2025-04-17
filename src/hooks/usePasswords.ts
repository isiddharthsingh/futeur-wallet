
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Password {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  updated_at: string;
}

export function usePasswords() {
  const queryClient = useQueryClient();

  const { data: passwords = [], isLoading } = useQuery({
    queryKey: ["passwords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("passwords")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to fetch passwords");
        throw error;
      }

      return data;
    },
  });

  const addPassword = useMutation({
    mutationFn: async (newPassword: Omit<Password, "id" | "updated_at">) => {
      const { error } = await supabase.from("passwords").insert([newPassword]);
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
      const { error } = await supabase
        .from("passwords")
        .update(password)
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
