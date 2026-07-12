"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileTab } from "@/components/profile/tabs/ProfileTab";
import { ActivityTab } from "@/components/profile/tabs/ActivityTab";
import { StatsTab } from "@/components/profile/tabs/StatsTab";
import { ReviewsTab } from "@/components/profile/tabs/ReviewsTab";
import { ListsTab } from "@/components/profile/tabs/ListsTab";
import { PassportModal } from "@/components/profile/PassportModal";
import { FollowListModal } from "@/components/profile/FollowListModal";
import {
  parseProfileTab,
  type FavouriteSlot,
  type ProfileData,
  type ProfileTabId,
} from "@/lib/profile-types";

interface ProfileViewProps {
  data: ProfileData;
  activeTab: ProfileTabId;
  sharePath: string;
}

function toPassportCovers(
  slots: FavouriteSlot[]
): { title: string; coverImage: string }[] {
  return slots.map((f) => ({
    title: f.media.title,
    coverImage: f.media.coverImage ?? "",
  }));
}

function TabContent({
  data,
  activeTab,
  favouriteAnime,
  favouriteManga,
  onFavouritesSaved,
}: {
  data: ProfileData;
  activeTab: ProfileTabId;
  favouriteAnime: FavouriteSlot[];
  favouriteManga: FavouriteSlot[];
  onFavouritesSaved: (type: "anime" | "manga", slots: FavouriteSlot[]) => void;
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
          favouriteAnime={favouriteAnime}
          favouriteManga={favouriteManga}
          tasteGenres={data.tasteGenres}
          badges={data.badges}
          onFavouritesSaved={onFavouritesSaved}
        />
      );
  }
}

export function ProfileView({
  data,
  activeTab: initialTab,
  sharePath,
}: ProfileViewProps): React.JSX.Element {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [passportOpen, setPassportOpen] = useState(false);
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListType, setFollowListType] = useState<"followers" | "following">(
    "followers"
  );
  const [favouriteAnime, setFavouriteAnime] = useState(data.favouriteAnime);
  const [favouriteManga, setFavouriteManga] = useState(data.favouriteManga);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    function onPopState(): void {
      const tab = new URLSearchParams(window.location.search).get("tab");
      setActiveTab(parseProfileTab(tab));
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    setFavouriteAnime(data.favouriteAnime);
    setFavouriteManga(data.favouriteManga);
  }, [data.favouriteAnime, data.favouriteManga]);

  function handleFavouritesSaved(
    type: "anime" | "manga",
    slots: FavouriteSlot[]
  ): void {
    if (type === "anime") setFavouriteAnime(slots);
    else setFavouriteManga(slots);
    router.refresh();
  }

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
        initialIsFollowing={data.isFollowing}
        initialFollowerCount={data.user.followersCount}
        initialFollowingCount={data.user.followingCount}
        onOpenFollowList={(type) => {
          setFollowListType(type);
          setFollowListOpen(true);
        }}
        onOpenPassport={() => setPassportOpen(true)}
      />
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <TabContent
        data={data}
        activeTab={activeTab}
        favouriteAnime={favouriteAnime}
        favouriteManga={favouriteManga}
        onFavouritesSaved={handleFavouritesSaved}
      />

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
          favouriteAnime={toPassportCovers(favouriteAnime)}
          favouriteManga={toPassportCovers(favouriteManga)}
          tasteProfile={data.tasteGenres.slice(0, 5).map((g) => ({ genre: g.name, count: g.count }))}
          badges={passportBadges}
        />
      ) : null}

      {data.user.username ? (
        <FollowListModal
          isOpen={followListOpen}
          onClose={() => setFollowListOpen(false)}
          username={data.user.username}
          type={followListType}
        />
      ) : null}
    </div>
  );
}
