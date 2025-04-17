import React, { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { Card, CardContent } from "./ui/card"
import { Separator } from "./ui/separator"
import { Eye, EyeOff } from "lucide-react"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  avatar_url: z.string().url({
    message: "Please enter a valid URL for your avatar.",
  }).optional().or(z.literal('')),
})

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "Current password is required",
  }),
  newPassword: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string().min(6, {
    message: "Please confirm your new password.",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function SettingsForm() {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      avatar_url: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const loadProfile = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();
    
    if (error) {
      toast.error("Failed to load profile");
      return;
    }
    
    if (data) {
      form.reset(data);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        username: values.username,
        avatar_url: values.avatar_url || null,
      })
      .eq('id', user.id);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    toast.success("Profile updated successfully");
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: values.newPassword 
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Account Information</h3>
            <p className="text-sm text-muted-foreground">
              Your account details and information.
            </p>
          </div>
          <Separator className="my-4" />
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="text-sm">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Last Sign In</dt>
              <dd className="text-sm">
                {user?.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'PPpp') : 'Never'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Account Created</dt>
              <dd className="text-sm">
                {user?.created_at ? format(new Date(user.created_at), 'PPpp') : 'Unknown'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Profile Settings</h3>
            <p className="text-sm text-muted-foreground">
              Update your profile information.
            </p>
          </div>
          <Separator className="my-4" />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Your username" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your public display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      A URL to your profile picture.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Save changes</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Change Password</h3>
            <p className="text-sm text-muted-foreground">
              Update your password to keep your account secure.
            </p>
          </div>
          <Separator className="my-4" />
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-8">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showCurrentPassword ? "text" : "password"}
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showNewPassword ? "text" : "password"}
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FormDescription>
                      Password must be at least 6 characters long.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showConfirmPassword ? "text" : "password"}
                          {...field} 
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Update Password</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
