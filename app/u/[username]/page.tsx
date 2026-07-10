import { auth } from "@/auth";
import { ProfileView } from "@/components/profile/ProfileView";
import { getProfileData, parseProfileTab } from "@/lib/profile-data";

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
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
