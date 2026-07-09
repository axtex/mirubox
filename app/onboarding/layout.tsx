import type { ReactNode } from "react";

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex w-full flex-1 items-center justify-center py-6 md:py-8">
      {children}
    </div>
  );
}
