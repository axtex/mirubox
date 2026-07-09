import { auth } from "@/auth";
import { NextResponse } from "next/server";

// "/lists/new" is this project's actual create-list route (spec refers to it as "/lists/create").
const protectedRoutes = ["/watchlist", "/archive", "/profile", "/settings", "/lists/new"];
const onboardingExemptRoutes = ["/onboarding", "/auth"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isProtected = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL("/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isLoggedIn && req.auth?.user?.onboarded === false) {
    const isExempt = onboardingExemptRoutes.some((route) => nextUrl.pathname.startsWith(route));
    if (!isExempt) {
      const onboardingUrl = new URL("/onboarding", nextUrl.origin);
      onboardingUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
