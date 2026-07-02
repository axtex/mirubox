import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ListsPage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const params = new URLSearchParams({ tab: "lists" });
  if (type) params.set("type", type);
  redirect(`/community?${params.toString()}`);
}
