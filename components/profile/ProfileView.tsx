"use client";

import { Suspense } from "react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileTab } from "@/components/profile/tabs/ProfileTab";
import { ActivityTab } from "@/components/profile/tabs/ActivityTab";
import { StatsTab } from "@/components/profile/tabs/StatsTab";
import { ReviewsTab } from "@/components/profile/tabs/ReviewsTab";
import { ListsTab } from "@/components/profile/tabs/ListsTab";
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
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <ProfileHeader
        user={data.user}
        isOwnProfile={data.isOwnProfile}
        sharePath={sharePath}
        rank={data.rank}
      />
      <Suspense fallback={null}>
        <ProfileTabs activeTab={activeTab} />
      </Suspense>
      <TabContent data={data} activeTab={activeTab} />
    </div>
  );
}
