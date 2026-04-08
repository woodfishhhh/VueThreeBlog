import type { FriendLinkData } from "@/types/content";

let friendLinksPromise: Promise<FriendLinkData[]> | null = null;

export async function loadFriendLinks() {
  if (!friendLinksPromise) {
    friendLinksPromise = import("@/generated/friends.json").then((module) => module.default as FriendLinkData[]);
  }

  return friendLinksPromise;
}
