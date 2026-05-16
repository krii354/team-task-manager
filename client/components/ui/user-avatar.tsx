import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { cn, getInitials } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

export function UserAvatar({ name, src, className }: UserAvatarProps) {
  return (
    <Avatar className={cn("h-9 w-9", className)}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback>{getInitials(name || "User")}</AvatarFallback>
    </Avatar>
  );
}
