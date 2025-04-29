import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import loginAnimation from "../../asset/Secure Login.json";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardControls } from "@/components/dashboard/DashboardControls";
import { PasswordsList } from "@/components/dashboard/PasswordsList";
import { PasswordDialog } from "@/components/PasswordDialog";
import { MultiSharePasswordDialog } from "@/components/MultiSharePasswordDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { usePasswords } from "@/hooks/usePasswords";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Dashboard() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const { 
    allPasswords, 
    ownPasswords,
    sharedPasswords,
    isLoading, 
    addPassword, 
    updatePassword 
  } = usePasswords();
  const isMobile = useIsMobile();

  useEffect(() => {
    console.log("Dashboard received passwords:", {
      all: allPasswords.length,
      own: ownPasswords.length,
      shared: sharedPasswords.length
    });
    
    if (sharedPasswords.length > 0) {
      console.log("First shared password:", sharedPasswords[0]);
    }
  }, [allPasswords, ownPasswords, sharedPasswords]);

  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<any | undefined>(undefined);
  const [mainTab, setMainTab] = useState("all");
  const [multiShareDialogOpen, setMultiShareDialogOpen] = useState(false);

  const filterPasswords = (passwords: any[]) => {
    return passwords.filter(
      (pwd) => 
        pwd.title.toLowerCase().includes(search.toLowerCase()) || 
        pwd.username.toLowerCase().includes(search.toLowerCase()) ||
        pwd.url?.toLowerCase().includes(search.toLowerCase())
    );
  };

  const filteredAllPasswords = filterPasswords(allPasswords);
  const filteredOwnPasswords = filterPasswords(ownPasswords);
  const filteredSharedPasswords = filterPasswords(sharedPasswords);

  console.log("Filtered password counts:", {
    all: filteredAllPasswords.length,
    own: filteredOwnPasswords.length,
    shared: filteredSharedPasswords.length
  });

  const handleEdit = (id: string) => {
    const passwordToEdit = allPasswords.find((pwd) => pwd.id === id);
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

  const hasPasswordsToShare = ownPasswords.filter(pwd => pwd.isShared === false).length > 0;

  const handleMultiShare = () => {
    setMultiShareDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-black/90">
        <div className="w-64 h-64">
          <Lottie 
            animationData={loginAnimation} 
            loop={true} 
            autoplay={true}
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid slice'
            }}
          />
        </div>
        <p className="text-primary font-bold mt-4 text-center">Loading your vault...</p>
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
            onMultiShare={handleMultiShare}
            hasPasswordsToShare={hasPasswordsToShare}
          />

          <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Passwords</TabsTrigger>
              <TabsTrigger value="my-passwords">My Passwords</TabsTrigger>
              <TabsTrigger value="shared-with-me">Shared with Me</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
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
                  {filteredAllPasswords.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-lg text-muted-foreground">No passwords match your search</p>
                    </div>
                  ) : (
                    <PasswordsList 
                      passwords={filteredAllPasswords}
                      viewMode={viewMode}
                      onEdit={handleEdit}
                      currentUserId={user?.id}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="email">
                  <PasswordsList 
                    passwords={filteredAllPasswords.filter((pwd) => pwd.category === "Email")}
                    viewMode={viewMode}
                    onEdit={handleEdit}
                    currentUserId={user?.id}
                  />
                </TabsContent>
                
                <TabsContent value="cloud">
                  <PasswordsList 
                    passwords={filteredAllPasswords.filter((pwd) => pwd.category === "Cloud")}
                    viewMode={viewMode}
                    onEdit={handleEdit}
                    currentUserId={user?.id}
                  />
                </TabsContent>
                
                <TabsContent value="development">
                  <PasswordsList 
                    passwords={filteredAllPasswords.filter((pwd) => pwd.category === "Development")}
                    viewMode={viewMode}
                    onEdit={handleEdit}
                    currentUserId={user?.id}
                  />
                </TabsContent>
                
                <TabsContent value="sales">
                  <PasswordsList 
                    passwords={filteredAllPasswords.filter((pwd) => pwd.category === "Sales")}
                    viewMode={viewMode}
                    onEdit={handleEdit}
                    currentUserId={user?.id}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="my-passwords">
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
                  {filteredOwnPasswords.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-lg text-muted-foreground">No passwords match your search</p>
                    </div>
                  ) : (
                    <PasswordsList 
                      passwords={filteredOwnPasswords}
                      viewMode={viewMode}
                      onEdit={handleEdit}
                      currentUserId={user?.id}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="email">
                  <PasswordsList 
                    passwords={filteredOwnPasswords.filter((pwd) => pwd.category === "Email")}
                    viewMode={viewMode}
                    onEdit={handleEdit}
                    currentUserId={user?.id}
                  />
                </TabsContent>
                
                <TabsContent value="cloud">
                  <PasswordsList 
                    passwords={filteredOwnPasswords.filter((pwd) => pwd.category === "Cloud")}
                    viewMode={viewMode}
                    onEdit={handleEdit}
                    currentUserId={user?.id}
                  />
                </TabsContent>
                
                <TabsContent value="development">
                  <PasswordsList 
                    passwords={filteredOwnPasswords.filter((pwd) => pwd.category === "Development")}
                    viewMode={viewMode}
                    onEdit={handleEdit}
                    currentUserId={user?.id}
                  />
                </TabsContent>
                
                <TabsContent value="sales">
                  <PasswordsList 
                    passwords={filteredOwnPasswords.filter((pwd) => pwd.category === "Sales")}
                    viewMode={viewMode}
                    onEdit={handleEdit}
                    currentUserId={user?.id}
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="shared-with-me">
              {filteredSharedPasswords.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No shared passwords found</p>
                </div>
              ) : (
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
                    <PasswordsList 
                      passwords={filteredSharedPasswords}
                      viewMode={viewMode}
                      onEdit={handleEdit}
                      currentUserId={user?.id}
                    />
                  </TabsContent>
                  
                  <TabsContent value="email">
                    <PasswordsList 
                      passwords={filteredSharedPasswords.filter((pwd) => pwd.category === "Email")}
                      viewMode={viewMode}
                      onEdit={handleEdit}
                      currentUserId={user?.id}
                    />
                  </TabsContent>
                  
                  <TabsContent value="cloud">
                    <PasswordsList 
                      passwords={filteredSharedPasswords.filter((pwd) => pwd.category === "Cloud")}
                      viewMode={viewMode}
                      onEdit={handleEdit}
                      currentUserId={user?.id}
                    />
                  </TabsContent>
                  
                  <TabsContent value="development">
                    <PasswordsList 
                      passwords={filteredSharedPasswords.filter((pwd) => pwd.category === "Development")}
                      viewMode={viewMode}
                      onEdit={handleEdit}
                      currentUserId={user?.id}
                    />
                  </TabsContent>
                  
                  <TabsContent value="sales">
                    <PasswordsList 
                      passwords={filteredSharedPasswords.filter((pwd) => pwd.category === "Sales")}
                      viewMode={viewMode}
                      onEdit={handleEdit}
                      currentUserId={user?.id}
                    />
                  </TabsContent>
                </Tabs>
              )}
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

      <MultiSharePasswordDialog
        open={multiShareDialogOpen}
        onOpenChange={setMultiShareDialogOpen}
        passwords={ownPasswords.filter(pwd => pwd.isShared === false)}
      />
    </div>
  );
}
