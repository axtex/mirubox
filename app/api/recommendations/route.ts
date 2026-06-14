import { auth } from "@/auth";
import { getRecommendations } from "@/lib/recommendations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getRecommendations(session.user.id, 20);
  return Response.json(result);
}
