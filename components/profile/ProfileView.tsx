"use client";

import { Suspense, useState } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileTab } from "@/components/profile/tabs/ProfileTab";
import { ActivityTab } from "@/components/profile/tabs/ActivityTab";
import { StatsTab } from "@/components/profile/tabs/StatsTab";
import { ReviewsTab } from "@/components/profile/tabs/ReviewsTab";
import { ListsTab } from "@/components/profile/tabs/ListsTab";
import { PassportModal } from "@/components/profile/PassportModal";
import type { ProfileData, ProfileTabId } from "@/lib/profile-types";

interface ProfileViewProps {
  data: ProfileData;
  activeTab: ProfileTabId;
  sharePath: string;
}

function TabContent({
  data,
  activeTab,
}: {
  data: ProfileData;
  activeTab: ProfileTabId;
}): React.JSX.Element {
  switch (activeTab) {
    case "activity":
      return (
        <ActivityTab activity={data.activity} />
      );
    case "stats":
      return (
        <StatsTab
          totalXP={data.user.totalXP}
          rank={data.rank}
          streak={data.streak}
          badges={data.badges}
          statsGenres={data.statsGenres}
          ratingDistribution={data.ratingDistribution}
        />
      );
    case "reviews":
      return <ReviewsTab reviews={data.reviews} />;
    case "lists":
      return (
        <ListsTab
          isOwnProfile={data.isOwnProfile}
          yourLists={data.yourLists}
          likedLists={data.likedLists}
        />
      );
    case "profile":
    default:
      return (
        <ProfileTab
          isOwnProfile={data.isOwnProfile}
          favouriteAnime={data.favouriteAnime}
          favouriteManga={data.favouriteManga}
          tasteGenres={data.tasteGenres}
          badges={data.badges}
        />
      );
  }
}

export function ProfileView({
  data,
  activeTab,
  sharePath,
}: ProfileViewProps): React.JSX.Element {
  const [passportOpen, setPassportOpen] = useState(false);

  const unlockedBadges = data.badges.filter((b) => b.earned);
  const lockedBadges = data.badges.filter((b) => !b.earned);
  const passportBadges = [...unlockedBadges, ...lockedBadges].slice(0, 6).map((b) => ({
    key: b.key,
    label: b.name,
    emoji: b.emoji,
    earned: b.earned,
  }));

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <ProfileHeader
        user={data.user}
        isOwnProfile={data.isOwnProfile}
        sharePath={sharePath}
        rank={data.rank}
        onOpenPassport={() => setPassportOpen(true)}
      />
      <Suspense fallback={null}>
        <ProfileTabs activeTab={activeTab} />
      </Suspense>
      <TabContent data={data} activeTab={activeTab} />

      {data.isOwnProfile ? (
        <PassportModal
          isOpen={passportOpen}
          onClose={() => setPassportOpen(false)}
          username={data.user.username ?? ""}
          displayName={data.user.displayName}
          avatarUrl={data.user.resolvedAvatarUrl}
          rank={{ name: data.rank.name, emoji: data.rank.emoji }}
          currentXP={data.user.totalXP}
          nextRankName={data.rank.isMax ? "MAX" : (data.rank.nextName ?? "MAX")}
          nextRankXP={data.rank.isMax ? data.rank.minXP : (data.rank.nextMinXP ?? data.rank.minXP)}
          rankMinXP={data.rank.minXP}
          stats={data.stats}
          favouriteAnime={data.favouriteAnime.map((f) => ({
            title: f.media.title,
            coverImage: f.media.coverImage ?? "",
          }))}
          favouriteManga={data.favouriteManga.map((f) => ({
            title: f.media.title,
            coverImage: f.media.coverImage ?? "",
          }))}
          tasteProfile={data.tasteGenres.slice(0, 5).map((g) => ({ genre: g.name, count: g.count }))}
          badges={passportBadges}
        />
      ) : null}
    </div>
  );
}
