import { prisma } from "@/lib/prisma";
import type { NotifType, Notification } from "@prisma/client";

interface CreateNotificationInput {
  userId: string;
  type: NotifType;
  title: string;
  body?: string;
  listId?: string;
  mediaId?: number;
  badgeKey?: string;
  fromUserId?: string;
}

export async function createNotification(
  data: CreateNotificationInput
): Promise<Notification> {
  const notif = await prisma.notification.create({ data });

  // Stub for future mobile push notifications
  // When mobile app is built:
  // const user = await prisma.user.findUnique({
  //   where: { id: data.userId },
  //   select: { pushToken: true }
  // })
  // if (user?.pushToken) {
  //   await sendPushNotification(user.pushToken, notif)
  // }

  return notif;
}
