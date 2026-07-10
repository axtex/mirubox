import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileView } from "@/components/profile/ProfileView";
import { getProfileData, parseProfileTab } from "@/lib/profile-data";
import { getRankProgress } from "@/lib/xp";
import { getAvatarSeed, getAvatarUrl } from "@/lib/avatar";

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, displayName: true, avatarUrl: true, totalXP: true },
  });
  if (!user) return {};

  const displayName = user.displayName ?? user.username ?? "Anonymous";
  const rank = getRankProgress(user.totalXP);
  const title = `${displayName} (${rank.name}) — mirubox`;
  const description =
    `${displayName}'s anime and manga profile on mirubox. ${rank.emoji} ${rank.name} · ${user.totalXP} XP`;
  const ogImage = user.avatarUrl ?? getAvatarUrl(getAvatarSeed(user.username, user.id));
  const url = `https://mirubox.vercel.app/u/${username}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url,
      siteName: "mirubox",
      images: [{ url: ogImage, width: 200, height: 200, alt: displayName }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function PublicProfilePage({
  params,
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const [{ username }, { tab }, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ]);

  const activeTab = parseProfileTab(tab);
  const data = await getProfileData({
    username,
    viewerId: session?.user?.id ?? null,
  });

  return (
    <ProfileView
      data={data}
      activeTab={activeTab}
      sharePath={`/u/${username}`}
    />
  );
}
