import type { BadgeKey, XPAction } from "@prisma/client";
import type { RankProgress } from "@/lib/xp";
import type {
  PastSeasonChallenge,
  SeasonChallengeData,
} from "@/lib/season-challenge-types";

export type ProfileTabId = "profile" | "activity" | "stats" | "reviews" | "lists";

export const PROFILE_TABS: { id: ProfileTabId; label: string }[] = [
  { id: "profile", label: "PROFILE" },
  { id: "activity", label: "ACTIVITY" },
  { id: "stats", label: "STATS" },
  { id: "reviews", label: "REVIEWS" },
  { id: "lists", label: "LISTS" },
];

export function parseProfileTab(tab: string | undefined | null): ProfileTabId {
  if (tab && PROFILE_TABS.some((t) => t.id === tab)) return tab as ProfileTabId;
  return "profile";
}

export interface ProfileMedia {
  id: number;
  title: string;
  titleEnglish: string | null;
  coverImage: string | null;
  format: string | null;
  seasonYear: number | null;
  type: string;
  episodes: number | null;
  chapters: number | null;
}

export interface FavouriteSlot {
  mediaId: number;
  order: number;
  media: ProfileMedia;
}

export interface GenreCount {
  name: string;
  count: number;
}

export interface BadgeDisplay {
  key: BadgeKey;
  id?: string;
  seasonKey?: string;
  name: string;
  emoji: string;
  earned: boolean;
  earnedAt: Date | null;
  description: string;
}

export type SocialActivityAction =
  | "FOLLOWING"
  | "NEW_FOLLOWER"
  | "LIST_LIKED"
  | "LIST_GOT_LIKED";

export type ActivityAction = XPAction | SocialActivityAction;

export interface ActivityRelatedUser {
  id: string;
  username: string | null;
  displayName: string;
}

export interface ActivityItem {
  id: string;
  action: ActivityAction;
  amount: number;
  createdAt: Date;
  media: ProfileMedia | null;
  listTitle: string | null;
  listSlug: string | null;
  listEntryCount: number | null;
  listIsPublic: boolean | null;
  badgeName: string | null;
  badgeDescription: string | null;
  meta: Record<string, unknown> | null;
  relatedUser: ActivityRelatedUser | null;
}

export interface ReviewItem {
  animeId: number;
  score: number;
  updatedAt: Date;
  review: string | null;
  containsSpoilers: boolean;
  media: ProfileMedia;
}

export interface ProfileListCard {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isOfficial: boolean;
  isPublic: boolean;
  username: string | null;
  entryCount: number;
  likeCount: number;
  coverPosters: (string | null)[];
}

export interface StreakDay {
  label: string;
  hasActivity: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface ProfileData {
  user: {
    id: string;
    username: string | null;
    displayName: string;
    avatarUrl: string | null;
    resolvedAvatarUrl: string;
    totalXP: number;
    followingCount: number;
    followersCount: number;
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
  rank: RankProgress;
  badges: BadgeDisplay[];
  headerBadges: BadgeDisplay[];
  favouriteAnime: FavouriteSlot[];
  favouriteManga: FavouriteSlot[];
  tasteGenres: GenreCount[];
  statsGenres: GenreCount[];
  ratingDistribution: { rating: number; count: number }[];
  stats: {
    watched: number;
    read: number;
    rated: number;
    lists: number;
  };
  streak: {
    current: number;
    longest: number;
    days: StreakDay[];
  };
  seasonChallenge: SeasonChallengeData | null;
  pastSeasonChallenges: PastSeasonChallenge[];
  activity: ActivityItem[];
  hasMoreActivity: boolean;
  reviews: ReviewItem[];
  yourLists: ProfileListCard[];
  likedLists: ProfileListCard[];
}
