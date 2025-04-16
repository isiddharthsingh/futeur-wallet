
import { useState, useEffect } from "react";
import { Eye, EyeOff, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface PasswordEntry {
  id?: number;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
}

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: PasswordEntry;
  onSave: (entry: PasswordEntry) => void;
}

export function PasswordDialog({ 
  open, 
  onOpenChange, 
  entry, 
  onSave 
}: PasswordDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<PasswordEntry>({
    title: "",
    username: "",
    password: "",
    url: "",
    category: "Other"
  });

  // Initialize form data when entry changes
  useEffect(() => {
    if (entry) {
      setFormData(entry);
    } else {
      setFormData({
        title: "",
        username: "",
        password: "",
        url: "",
        category: "Other"
      });
    }
  }, [entry, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  // Category options
  const categories = [
    "Email", 
    "Cloud", 
    "Development", 
    "Sales", 
    "Marketing", 
    "Infrastructure", 
    "Financial",
    "Other"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {entry?.id ? "Edit Password" : "Add New Password"}
            </DialogTitle>
            <DialogDescription>
              {entry?.id 
                ? "Update the credential details below" 
                : "Fill in the credential details to save in the vault"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Company Email"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Username/Email</Label>
              <Input
                id="username"
                name="username"
                placeholder="e.g., john@example.com"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="url">URL (optional)</Label>
              <Input
                id="url"
                name="url"
                placeholder="e.g., mail.company.com"
                value={formData.url}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              {entry?.id ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
