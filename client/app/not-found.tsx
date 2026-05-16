import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="space-y-2">
          <p className="text-7xl font-bold text-gradient">404</p>
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/">Go home</Link>
          </Button>
          <Button variant="gradient" asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
