/**
 * Pages-router `_app.tsx` shim. Required when a `pages/` directory exists.
 * Real routing happens via the App Router (`app/`). This file just renders
 * the page tree so the framework defaults (404, 500) work during build.
 */
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
