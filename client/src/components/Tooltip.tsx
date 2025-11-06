import { ReactNode } from "react";
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type TooltipProps = {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  muted?: boolean;
};

export default function Tooltip({ 
  children, 
  content, 
  side = "top", 
  align = "center",
  muted = false
}: TooltipProps) {
  if (muted) {
    // When muted, don't show interactive tooltip
    return <>{children}</>;
  }

  return (
    <ShadcnTooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} align={align}>
        {content}
      </TooltipContent>
    </ShadcnTooltip>
  );
}
