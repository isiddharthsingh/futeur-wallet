
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardControls } from "@/components/dashboard/DashboardControls";
import { PasswordsList } from "@/components/dashboard/PasswordsList";
import { PasswordDialog } from "@/components/PasswordDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { usePasswords } from "@/hooks/usePasswords";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Dashboard() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const { passwords, isLoading, addPassword, updatePassword } = usePasswords();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<any | undefined>(undefined);

  const filteredPasswords = passwords.filter(
    (pwd) => 
      pwd.title.toLowerCase().includes(search.toLowerCase()) || 
      pwd.username.toLowerCase().includes(search.toLowerCase()) ||
      pwd.url?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (id: string) => {
    const passwordToEdit = passwords.find((pwd) => pwd.id === id);
    if (passwordToEdit) {
      setCurrentPassword(passwordToEdit);
      setDialogOpen(true);
    }
  };

  const handleAddNew = () => {
    setCurrentPassword(undefined);
    setDialogOpen(true);
  };

  const handleSavePassword = (entry: any) => {
    if (entry.id) {
      updatePassword.mutate(entry);
    } else {
      addPassword.mutate(entry);
    }
    setDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-6">
          <DashboardControls 
            search={search}
            onSearchChange={setSearch}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onAddNew={handleAddNew}
          />

          <Tabs defaultValue="all" className="w-full">
            {!isMobile ? (
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="cloud">Cloud</TabsTrigger>
                <TabsTrigger value="development">Development</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
              </TabsList>
            ) : (
              <div className="mb-4 overflow-x-auto pb-2">
                <TabsList className="inline-flex w-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="cloud">Cloud</TabsTrigger>
                  <TabsTrigger value="development">Dev</TabsTrigger>
                  <TabsTrigger value="sales">Sales</TabsTrigger>
                </TabsList>
              </div>
            )}
            
            <TabsContent value="all">
              {filteredPasswords.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No passwords match your search</p>
                </div>
              ) : (
                <PasswordsList 
                  passwords={filteredPasswords}
                  viewMode={viewMode}
                  onEdit={handleEdit}
                  currentUserId={user?.id}
                />
              )}
            </TabsContent>
            
            <TabsContent value="email">
              <PasswordsList 
                passwords={filteredPasswords.filter((pwd) => pwd.category === "Email")}
                viewMode={viewMode}
                onEdit={handleEdit}
                currentUserId={user?.id}
              />
            </TabsContent>
            
            <TabsContent value="cloud">
              <PasswordsList 
                passwords={filteredPasswords.filter((pwd) => pwd.category === "Cloud")}
                viewMode={viewMode}
                onEdit={handleEdit}
                currentUserId={user?.id}
              />
            </TabsContent>
            
            <TabsContent value="development">
              <PasswordsList 
                passwords={filteredPasswords.filter((pwd) => pwd.category === "Development")}
                viewMode={viewMode}
                onEdit={handleEdit}
                currentUserId={user?.id}
              />
            </TabsContent>
            
            <TabsContent value="sales">
              <PasswordsList 
                passwords={filteredPasswords.filter((pwd) => pwd.category === "Sales")}
                viewMode={viewMode}
                onEdit={handleEdit}
                currentUserId={user?.id}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <PasswordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={currentPassword}
        onSave={handleSavePassword}
      />
    </div>
  );
}
