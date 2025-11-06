import { Link } from "wouter";
import { Settings, Package, Image, UserCheck, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function HeaderOpsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-ops-menu">
          <Settings className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Ops</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Operations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/ops/overview">
          <DropdownMenuItem data-testid="menu-ops-overview">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </DropdownMenuItem>
        </Link>
        <Link href="/ops/inventory">
          <DropdownMenuItem data-testid="menu-ops-inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </DropdownMenuItem>
        </Link>
        <Link href="/ops/images">
          <DropdownMenuItem data-testid="menu-ops-images">
            <Image className="h-4 w-4 mr-2" />
            Images
          </DropdownMenuItem>
        </Link>
        <Link href="/ops/affiliates">
          <DropdownMenuItem data-testid="menu-ops-affiliates">
            <UserCheck className="h-4 w-4 mr-2" />
            Affiliates
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <Link href="/ops/settings">
          <DropdownMenuItem data-testid="menu-ops-settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
