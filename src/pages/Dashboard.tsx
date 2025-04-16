
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, PlusCircle, Key, LogOut, UserCircle, Settings, List, Grid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PasswordCard } from "@/components/PasswordCard";
import { PasswordDialog } from "@/components/PasswordDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for password entries
const mockPasswords = [
  {
    id: 1,
    title: "Company Email",
    username: "admin@company.com",
    password: "S3cureP@ss!",
    url: "mail.company.com",
    category: "Email",
    lastUpdated: "2 days ago",
  },
  {
    id: 2,
    title: "AWS Console",
    username: "company_admin",
    password: "Cl0udAcce$$123",
    url: "aws.amazon.com",
    category: "Cloud",
    lastUpdated: "1 week ago",
  },
  {
    id: 3,
    title: "GitHub",
    username: "company-dev",
    password: "GitHu8Dev!2023",
    url: "github.com",
    category: "Development",
    lastUpdated: "3 days ago",
  },
  {
    id: 4,
    title: "Company CRM",
    username: "sales_team",
    password: "CRM@cce$$2023",
    url: "crm.company.com",
    category: "Sales",
    lastUpdated: "Yesterday",
  },
  {
    id: 5,
    title: "Social Media",
    username: "marketing@company.com",
    password: "S0ci@lM3dia!",
    url: "facebook.com",
    category: "Marketing",
    lastUpdated: "5 days ago",
  },
  {
    id: 6,
    title: "Company VPN",
    username: "remote_access",
    password: "VPNs3cur3!",
    url: "vpn.company.com",
    category: "Infrastructure",
    lastUpdated: "2 weeks ago",
  },
];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [passwords, setPasswords] = useState(mockPasswords);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<any | undefined>(undefined);
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate]);

  // Filter passwords based on search
  const filteredPasswords = passwords.filter(
    (pwd) =>
      pwd.title.toLowerCase().includes(search.toLowerCase()) ||
      pwd.username.toLowerCase().includes(search.toLowerCase()) ||
      pwd.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  const handleEdit = (id: number) => {
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
      // Update existing password
      setPasswords((prev) =>
        prev.map((pwd) => (pwd.id === entry.id ? { ...entry, lastUpdated: "Just now" } : pwd))
      );
    } else {
      // Add new password
      const newId = Math.max(0, ...passwords.map((p) => p.id || 0)) + 1;
      setPasswords((prev) => [
        ...prev,
        { ...entry, id: newId, lastUpdated: "Just now" }
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Key className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Futeur Wallet</h1>
              <p className="text-xs text-muted-foreground">by Futeur Secure</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">admin@company.com</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-6">
          {/* Search and controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search passwords..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="rounded-none h-10"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                  <span className="sr-only">Grid view</span>
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="rounded-none h-10"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                  <span className="sr-only">List view</span>
                </Button>
              </div>
              
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Password
              </Button>
            </div>
          </div>

          {/* Category tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="cloud">Cloud</TabsTrigger>
              <TabsTrigger value="development">Development</TabsTrigger>
              <TabsTrigger value="sales">Sales</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {filteredPasswords.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">No passwords match your search</p>
                </div>
              ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col space-y-4"}>
                  {filteredPasswords.map((pwd) => (
                    <PasswordCard
                      key={pwd.id}
                      title={pwd.title}
                      username={pwd.username}
                      password={pwd.password}
                      url={pwd.url}
                      category={pwd.category}
                      lastUpdated={pwd.lastUpdated}
                      onEdit={() => handleEdit(pwd.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="email">
              <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col space-y-4"}>
                {filteredPasswords
                  .filter((pwd) => pwd.category === "Email")
                  .map((pwd) => (
                    <PasswordCard
                      key={pwd.id}
                      title={pwd.title}
                      username={pwd.username}
                      password={pwd.password}
                      url={pwd.url}
                      category={pwd.category}
                      lastUpdated={pwd.lastUpdated}
                      onEdit={() => handleEdit(pwd.id)}
                    />
                  ))}
              </div>
            </TabsContent>
            
            {/* Additional TabsContent for other categories */}
            <TabsContent value="cloud">
              <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col space-y-4"}>
                {filteredPasswords
                  .filter((pwd) => pwd.category === "Cloud")
                  .map((pwd) => (
                    <PasswordCard
                      key={pwd.id}
                      title={pwd.title}
                      username={pwd.username}
                      password={pwd.password}
                      url={pwd.url}
                      category={pwd.category}
                      lastUpdated={pwd.lastUpdated}
                      onEdit={() => handleEdit(pwd.id)}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Password Dialog */}
      <PasswordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={currentPassword}
        onSave={handleSavePassword}
      />
    </div>
  );
}
