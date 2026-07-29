import { LucideIcon } from "lucide-react";
import { EnhancedIconClient } from "./EnhancedIconClient";

export interface EnhancedIconProps {
  icon: any; // LucideIcon dynamically passed
  size?: number;
  color?: string;
  className?: string;
  glowColor?: string;
  hasBackground?: boolean;
  isActive?: boolean;
}

export function EnhancedIcon({
  icon: Icon,
  size = 20,
  color = "currentColor",
  className = "",
  glowColor = "rgba(74, 154, 173, 0.2)",
  hasBackground = false,
  isActive = false,
}: EnhancedIconProps) {
  return (
    <EnhancedIconClient
      className={className}
      glowColor={glowColor}
      hasBackground={hasBackground}
      isActive={isActive}
    >
      <Icon size={size} color={isActive ? "#4a9aad" : color} strokeWidth={isActive ? 2 : 1.5} />
    </EnhancedIconClient>
  );
}
