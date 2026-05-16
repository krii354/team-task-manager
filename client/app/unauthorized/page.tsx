import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function UnauthorizedPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Unauthorized</h1>
          <p className="text-sm text-muted-foreground">
            You don't have permission to access this page. Contact your administrator if you believe this is a mistake.
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
