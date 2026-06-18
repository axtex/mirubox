import Link from "next/link";
import { auth } from "@/auth";
import { NavbarLinks } from "./NavbarLinks";
import { NavbarSearch } from "./NavbarSearch";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const session = await auth();

  return (
    <nav
      className="hidden md:block sticky top-0 z-50 backdrop-blur-[20px]"
      style={{
        background: "rgba(15,15,18,0.95)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="page-container flex items-center justify-between" style={{ height: 60 }}>

        {/* Wordmark + nav links */}
        <div className="flex items-center min-w-0">
          <Link
            href="/"
            className="flex items-center shrink-0 text-[22px] font-bold tracking-tight"
            style={{ fontFamily: "var(--font-anybody)" }}
          >
            <span style={{ color: "var(--fg)" }}>miru</span>
            <span style={{ color: "var(--primary)" }}>box</span>
          </Link>
          <NavbarLinks />
        </div>

        {/* Search + auth */}
        <div className="flex items-center shrink-0 gap-6">
          <NavbarSearch />
          <NavbarClient session={session} />
        </div>
      </div>
    </nav>
  );
}
