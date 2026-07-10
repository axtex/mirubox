import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileView } from "@/components/profile/ProfileView";
import { getProfileData, parseProfileTab } from "@/lib/profile-data";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProfilePage({
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/profile");

  const { tab } = await searchParams;
  const activeTab = parseProfileTab(tab);
  const data = await getProfileData({
    userId: session.user.id,
    viewerId: session.user.id,
  });

  const sharePath = data.user.username
    ? `/u/${data.user.username}`
    : "/profile";

  return (
    <ProfileView data={data} activeTab={activeTab} sharePath={sharePath} />
  );
}
