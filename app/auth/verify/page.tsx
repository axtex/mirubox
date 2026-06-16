import Link from "next/link";

export default function VerifyPage() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-full max-w-sm card-base p-8 text-center flex flex-col gap-4"
        style={{ border: "1px solid var(--border)" }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ background: "var(--accent-muted)" }}
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            style={{ color: "var(--accent)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <div>
          <h1
            className="text-xl font-semibold"
            style={{
              fontFamily: "var(--font-anybody)",
              color: "var(--fg)",
            }}
          >
            Check your email
          </h1>
          <p
            className="text-sm mt-2 leading-relaxed"
            style={{ color: "var(--fg-muted)" }}
          >
            A sign-in link was sent to your email. Click the link to continue.
          </p>
        </div>
        <Link href="/auth/signin" className="btn-ghost justify-center text-sm">
          Use a different method
        </Link>
      </div>
    </div>
  );
}
