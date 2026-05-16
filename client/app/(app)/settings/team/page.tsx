"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield, ShieldOff, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/auth.store";
import { useDeleteUser, useUpdateUserByAdmin, useUsers } from "@/hooks/use-users";
import { formatRelative } from "@/lib/utils";
import type { Role, User } from "@/lib/types";

export default function TeamSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  useEffect(() => {
    if (hydrated && user && user.role !== "ADMIN") router.replace("/unauthorized");
  }, [hydrated, user, router]);

  const { data, isLoading } = useUsers({ search: search || undefined, pageSize: 100 });
  const update = useUpdateUserByAdmin();
  const remove = useDeleteUser();
  const users = data?.items ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Team management</h1>
          <p className="text-sm text-muted-foreground">Promote admins, deactivate accounts, or remove users.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>All members</CardTitle>
              <CardDescription>Manage permissions across your workspace.</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
                  <UserAvatar name={u.name} src={u.avatar} className="h-9 w-9" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">
                      {u.name}{" "}
                      {u.id === user?.id && <span className="text-xs text-muted-foreground">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                  <Badge variant={u.isActive ? "success" : "destructive"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {u.lastLoginAt ? `Last login ${formatRelative(u.lastLoginAt)}` : "Never logged in"}
                  </span>
                  <div className="ml-auto flex gap-1">
                    {u.id !== user?.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={u.role === "ADMIN" ? "Demote to member" : "Promote to admin"}
                          onClick={() =>
                            update.mutate({
                              id: u.id,
                              payload: { role: (u.role === "ADMIN" ? "MEMBER" : "ADMIN") as Role },
                            })
                          }
                        >
                          {u.role === "ADMIN" ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={u.isActive ? "Deactivate" : "Activate"}
                          onClick={() => update.mutate({ id: u.id, payload: { isActive: !u.isActive } })}
                        >
                          <UserPlus className={u.isActive ? "h-4 w-4 text-destructive" : "h-4 w-4 text-success"} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(u)} title="Delete user">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
              {users.length === 0 && !isLoading && (
                <li className="py-6 text-center text-sm text-muted-foreground">No users found.</li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {confirmDelete?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove the user and their data. Projects they own will be deleted in cascade.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              loading={remove.isPending}
              onClick={async () => {
                if (confirmDelete) await remove.mutateAsync(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete user
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
