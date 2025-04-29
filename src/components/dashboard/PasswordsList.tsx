import { PasswordCard } from "@/components/PasswordCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { useState } from "react";
import { MultiSharePasswordDialog } from "@/components/MultiSharePasswordDialog";
interface Password {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category: string;
  updated_at: string;
  user_id: string;
  isShared?: boolean;
}
interface PasswordsListProps {
  passwords: Password[];
  viewMode: "grid" | "list";
  onEdit: (id: string) => void;
  currentUserId?: string;
}
export function PasswordsList({
  passwords,
  viewMode,
  onEdit,
  currentUserId
}: PasswordsListProps) {
  const isMobile = useIsMobile();
  const shouldUseGrid = isMobile || viewMode === "grid";
  const [multiShareOpen, setMultiShareOpen] = useState(false);

  // Filter out shared passwords to only show own passwords for multi-sharing
  const ownPasswords = passwords.filter(pwd => !pwd.isShared && pwd.user_id === currentUserId);
  console.log("PasswordsList rendering with passwords:", passwords.length);
  console.log("Own passwords for sharing:", ownPasswords.length);
  if (passwords.length > 0) {
    console.log("First password:", passwords[0].title, "Shared:", passwords[0].isShared);
  }
  return <>
      {ownPasswords.length > 0 && <div className="mb-4">
          
        </div>}

      <div className={shouldUseGrid ? `grid grid-cols-1 ${isMobile ? "" : "sm:grid-cols-2 lg:grid-cols-3"} gap-4` : "space-y-4"}>
        {passwords.length === 0 ? <div className="col-span-full text-center py-12">
            <p className="text-lg text-muted-foreground">No passwords found</p>
          </div> : passwords.map(pwd => <PasswordCard key={pwd.id} id={pwd.id} title={pwd.title} username={pwd.username} password={pwd.password} url={pwd.url} category={pwd.category} lastUpdated={pwd.updated_at} onEdit={() => onEdit(pwd.id)} isShared={pwd.isShared || pwd.user_id !== currentUserId} />)}
      </div>

      <MultiSharePasswordDialog open={multiShareOpen} onOpenChange={setMultiShareOpen} passwords={ownPasswords} />
    </>;
}