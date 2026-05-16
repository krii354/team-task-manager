/**
 * Pages-router `_error.tsx` shim that the framework prerenders for static
 * `/404` and `/500` fallbacks. App Router handles the real 404/500 UI via
 * `app/not-found.tsx` and `app/global-error.tsx`. This page exists only so
 * that the build phase has something to render for the framework defaults
 * without falling back to Next.js's internal class component (which trips
 * its own `<Html>` validation guard during prerender).
 */
import type { NextPageContext } from "next";

interface ErrorProps {
  statusCode?: number;
}

function ErrorPage({ statusCode }: ErrorProps) {
  const message =
    statusCode === 404
      ? "This page could not be found."
      : statusCode
        ? `A server-side error occurred (${statusCode}).`
        : "An unexpected error occurred.";

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        background: "#0b0d12",
        color: "#e6e9ef",
        fontFamily: "system-ui, sans-serif",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "28rem" }}>
        <h1
          style={{
            fontSize: "3rem",
            margin: 0,
            background: "linear-gradient(90deg, #6366f1, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {statusCode ?? "Error"}
        </h1>
        <p style={{ color: "#a3acba", margin: "1rem 0 1.5rem" }}>{message}</p>
        <a
          href="/"
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            background: "linear-gradient(90deg, #6366f1, #ec4899)",
            color: "#fff",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          Go home
        </a>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext): ErrorProps => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};

export default ErrorPage;
