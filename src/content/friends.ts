import friendLinkData from "@/generated/friends.json";

import type { FriendLinkData } from "@/types/content";

export function getFriendLinks() {
  return friendLinkData as FriendLinkData[];
}
