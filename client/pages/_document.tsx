/**
 * Pages-router `_document.tsx` shim. Exists only to satisfy the legacy pages
 * router that Next.js 14 still bundles for /404 and /500 static fallbacks
 * during `next build`. The App Router (`app/`) handles all real routing.
 */
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
