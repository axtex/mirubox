import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  NotificationsList,
  type NotificationsListItem,
} from "@/components/notifications/NotificationsList";
import type { NotifVisualType } from "@/lib/notification-visuals";

export const metadata = {
  title: "Notifications — mirubox",
};

export default async function NotificationsPage(): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/notifications");
  }

  const rows = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      fromUser: {
        select: { username: true, displayName: true, avatarUrl: true },
      },
      list: {
        select: { slug: true },
      },
    },
  });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  const notifications: NotificationsListItem[] = rows.map((n) => ({
    id: n.id,
    type: n.type as NotifVisualType,
    title: n.title,
    body: n.body,
    read: true,
    createdAt: n.createdAt.toISOString(),
    listId: n.listId,
    mediaId: n.mediaId,
    fromUser: n.fromUser
      ? { username: n.fromUser.username }
      : null,
    list: n.list ? { slug: n.list.slug } : null,
  }));

  return (
    <div className="py-8 min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mb-5">
        <h1 className="text-headline-lg font-display uppercase">NOTIFICATIONS</h1>
      </div>
      <NotificationsList notifications={notifications} />
    </div>
  );
}
