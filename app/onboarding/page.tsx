import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OnboardingForm } from "./OnboardingForm";

export const metadata: Metadata = {
  title: "Set up your profile — mirubox",
};

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

function safeCallbackUrl(url: string | undefined): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return "/";
  if (url.startsWith("/onboarding") || url.startsWith("/auth")) return "/";
  return url;
}

export default async function OnboardingPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/onboarding");

  const { callbackUrl: rawCallback } = await searchParams;
  const callbackUrl = safeCallbackUrl(rawCallback);
  if (session.user.onboarded) redirect(callbackUrl);

  return (
    <OnboardingForm
      userId={session.user.id}
      initialDisplayName={session.user.name ?? ""}
      callbackUrl={callbackUrl}
    />
  );
}
