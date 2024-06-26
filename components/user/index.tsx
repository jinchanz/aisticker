"use client";

import * as React from "react";
import { SignOutButton } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/types/user";
import { useRouter } from "next/navigation";

interface Props {
  user: User;
}

export default function ({ user }: Props) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={user.avatar_url} alt={user.nickname} />
          <AvatarFallback>{user.nickname}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mx-4">
        <DropdownMenuLabel className="text-center truncate">
          {user.nickname ? user.nickname : user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuCheckboxItem className="md:hidden text-center">
          {/* credits: {user.credits?.left_credits} */}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator className="md:hidden" />

        <DropdownMenuCheckboxItem className="md:hidden">
          <a href="/pricing">Pricing</a>
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator className="md:hidden" />

        <DropdownMenuCheckboxItem>
          <SignOutButton signOutCallback={() => location.reload()} />
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
