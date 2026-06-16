import Link from "next/link";
import { Folder } from "lucide-react";
import type { ArchiveFolder } from "@/lib/archive";
import { ARCHIVE_FOLDER_META } from "@/lib/archive";

function pad(n: number | string): string {
  return String(n).padStart(2, "0");
}

interface ArchiveFolderCardProps {
  folder: ArchiveFolder;
  value: string;
  accent?: boolean;
}

export function ArchiveFolderCard({ folder, value, accent = false }: ArchiveFolderCardProps) {
  const { label, sub, href } = ARCHIVE_FOLDER_META[folder];
  const iconColor = accent ? "var(--secondary)" : "var(--primary)";

  return (
    <Link href={href} className="archive-folder group">
      <span className="archive-folder-tab">
        <Folder className="w-3 h-3 shrink-0" style={{ color: iconColor }} aria-hidden />
        {label}
      </span>

      <Folder
        className="archive-folder-watermark"
        style={{ color: iconColor }}
        aria-hidden
      />

      <p
        className="font-display relative"
        style={{
          fontFamily: "var(--font-anybody)",
          fontSize: 36,
          fontWeight: 800,
          lineHeight: 1,
          color: accent ? "var(--secondary)" : "var(--fg)",
        }}
      >
        {folder === "ratings" ? value : pad(value)}
      </p>
      <p className="text-label mt-1 relative" style={{ color: "var(--fg-subtle)", fontSize: 9 }}>
        {sub}
      </p>
      <span
        className="absolute bottom-3 right-3 text-label transition-transform group-hover:translate-x-0.5"
        style={{ color: "var(--fg-subtle)", fontSize: 14 }}
      >
        →
      </span>
    </Link>
  );
}
