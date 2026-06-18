import Link from "next/link";
import { fetchAllPools } from "@/lib/discover-picks";
import { AiPicksClient } from "@/components/home/AiPicksClient";

export async function DiscoverSection() {
  const pools = await fetchAllPools();

  return (
    <section>
      <div className="section-header">
        <div className="section-header-row">
          <h2 className="text-headline-md font-display uppercase">
            Discover Your Taste
          </h2>
          <Link
            href="/auth/signin"
            className="text-label"
            style={{ color: "var(--accent)" }}
          >
            Personalize →
          </Link>
        </div>
        <div className="section-underline" />
      </div>

      <div className="section-cards">
        <AiPicksClient pools={pools} />
      </div>
    </section>
  );
}
