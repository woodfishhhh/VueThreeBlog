import authorData from "@/generated/author.json";

import type { AuthorProfileData } from "@/types/content";

export function getAuthorProfile() {
  return authorData as AuthorProfileData;
}
