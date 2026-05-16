"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/auth.store";
import { useChangePassword, useUpdateProfile } from "@/hooks/use-auth";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(500).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Required"),
  newPassword: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[0-9]/, "Include a number"),
});
type PasswordValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", bio: "", avatar: "" },
  });

  useEffect(() => {
    if (user) profileForm.reset({ name: user.name, bio: user.bio ?? "", avatar: user.avatar ?? "" });
  }, [user, profileForm]);

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and security.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile information</CardTitle>
              <CardDescription>How others see you across the workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={profileForm.handleSubmit(async (v) => {
                  await updateProfile.mutateAsync({
                    name: v.name,
                    bio: v.bio,
                    avatar: v.avatar || undefined,
                  });
                })}
              >
                <div className="flex items-center gap-4">
                  <UserAvatar name={user?.name ?? "User"} src={profileForm.watch("avatar") || user?.avatar} className="h-16 w-16 text-base" />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="avatar">Avatar URL</Label>
                    <Input id="avatar" placeholder="https://..." {...profileForm.register("avatar")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" {...profileForm.register("name")} />
                  {profileForm.formState.errors.name && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" rows={3} placeholder="Tell your team what you work on..." {...profileForm.register("bio")} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ""} disabled />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="gradient" loading={updateProfile.isPending}>
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <CardDescription>You will be logged out after a successful change.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={passwordForm.handleSubmit(async (v) => {
                  await changePassword.mutateAsync(v);
                  passwordForm.reset();
                })}
              >
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input id="currentPassword" type="password" {...passwordForm.register("currentPassword")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="gradient" loading={changePassword.isPending}>
                    Update password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
