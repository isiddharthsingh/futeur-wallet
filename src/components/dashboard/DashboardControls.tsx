
import { Grid, List, PlusCircle, Share, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onAddNew: () => void;
  onMultiShare: () => void;
  hasPasswordsToShare: boolean;
}

export function DashboardControls({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onAddNew,
  onMultiShare,
  hasPasswordsToShare,
}: DashboardControlsProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search passwords..."
            className="pl-9"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-end space-x-2">
          <Button 
            onClick={onAddNew} 
            size="sm"
            className="flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add
          </Button>
          {hasPasswordsToShare && (
            <Button 
              onClick={onMultiShare} 
              size="sm" 
              variant="outline"
              className="flex items-center"
            >
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search passwords..."
          className="pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="rounded-none h-10"
            onClick={() => onViewModeChange("grid")}
          >
            <Grid className="h-4 w-4" />
            <span className="sr-only">Grid view</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="rounded-none h-10"
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
            <span className="sr-only">List view</span>
          </Button>
        </div>
        
        <Button onClick={onAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Password
        </Button>

        {hasPasswordsToShare && (
          <Button 
            onClick={onMultiShare} 
            variant="outline"
            className="flex items-center"
          >
            <Share className="mr-2 h-4 w-4" />
            Share Multiple
          </Button>
        )}
      </div>
    </div>
  );
}
