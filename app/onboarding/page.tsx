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

export default async function OnboardingPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/onboarding");

  const { callbackUrl } = await searchParams;
  if (session.user.onboarded) redirect(callbackUrl || "/");

  return (
    <OnboardingForm
      userId={session.user.id}
      initialDisplayName={session.user.name ?? ""}
      callbackUrl={callbackUrl || "/"}
    />
  );
}
