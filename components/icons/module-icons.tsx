import {
  UserPlus,
  Ticket,
  Mic2,
  Globe,
  Megaphone,
  Film,
  Newspaper,
  Heart,
  Link2,
  PenLine,
  DollarSign,
  BarChart3,
  Package,
  Scale,
  Lock,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

// Maps module ID → Lucide icon component
export const MODULE_ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  onboarding:   UserPlus,
  live:         Ticket,
  "ar-recording": Mic2,
  distribution: Globe,
  marketing:    Megaphone,
  visual:       Film,
  pr:           Newspaper,
  fan:          Heart,
  sync:         Link2,
  publishing:   PenLine,
  royalties:    DollarSign,
  finance:      BarChart3,
  merch:        Package,
  legal:        Scale,
  vault:        Lock,
};

interface ModuleIconProps extends LucideProps {
  id: string;
}

export function ModuleIcon({ id, size = 20, ...props }: ModuleIconProps) {
  const Icon = MODULE_ICON_MAP[id] ?? Globe;
  return <Icon size={size} {...props} />;
}
