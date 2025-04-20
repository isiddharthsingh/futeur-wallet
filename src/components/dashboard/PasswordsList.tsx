
import { PasswordCard } from "@/components/PasswordCard";
import { useIsMobile } from "@/hooks/use-mobile";

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

export function PasswordsList({ passwords, viewMode, onEdit, currentUserId }: PasswordsListProps) {
  const isMobile = useIsMobile();
  const shouldUseGrid = isMobile || viewMode === "grid";

  return (
    <div className={shouldUseGrid ? `grid grid-cols-1 ${isMobile ? "" : "sm:grid-cols-2 lg:grid-cols-3"} gap-4` : "space-y-4"}>
      {passwords.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <p className="text-lg text-muted-foreground">No passwords found</p>
        </div>
      ) : (
        passwords.map((pwd) => (
          <PasswordCard
            key={pwd.id}
            id={pwd.id}
            title={pwd.title}
            username={pwd.username}
            password={pwd.password}
            url={pwd.url}
            category={pwd.category}
            lastUpdated={pwd.updated_at}
            onEdit={() => onEdit(pwd.id)}
            isShared={pwd.isShared || pwd.user_id !== currentUserId}
          />
        ))
      )}
    </div>
  );
}
