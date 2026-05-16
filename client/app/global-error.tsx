"use client";

/**
 * Replaces Next.js's default framework 500 page. Without this file the framework
 * tries to render the legacy pages-router `_error.js`, which imports `<Html>`
 * from `next/document` and crashes the App Router build with:
 *   Error: <Html> should not be imported outside of pages/_document.
 *
 * `global-error.tsx` MUST define its own <html> and <body> because it sits
 * above the root layout in the tree.
 */
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b0d12", color: "#e6e9ef", fontFamily: "system-ui, sans-serif" }}>
        <main
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: "100vh",
            padding: "1.5rem",
          }}
        >
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <div
              style={{
                margin: "0 auto 1.5rem",
                width: "4rem",
                height: "4rem",
                borderRadius: "9999px",
                background: "rgba(239,68,68,0.12)",
                color: "#ef4444",
                display: "grid",
                placeItems: "center",
                fontSize: "1.5rem",
              }}
            >
              !
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 .5rem" }}>Something went wrong</h1>
            <p style={{ color: "#a3acba", fontSize: "0.875rem", margin: "0 0 1.5rem" }}>
              An unexpected error occurred while loading the app. Try again, or head back to the dashboard.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
              <a
                href="/"
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #2a2f3a",
                  background: "transparent",
                  color: "#e6e9ef",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                }}
              >
                Go home
              </a>
              <button
                onClick={() => reset()}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  background: "linear-gradient(90deg, #6366f1, #ec4899)",
                  color: "#fff",
                  border: 0,
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
