import { CheckCircle, Eye, Star } from "lucide-react";
import type { ReactNode } from "react";

export function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function xpIcon(reason: string): ReactNode {
  if (reason.toLowerCase().includes("rate")) return <Star className="w-4 h-4" />;
  if (reason.toLowerCase().includes("complet")) return <CheckCircle className="w-4 h-4" />;
  return <Eye className="w-4 h-4" />;
}
