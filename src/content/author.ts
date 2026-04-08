import type { AuthorProfileData } from "@/types/content";

let authorProfilePromise: Promise<AuthorProfileData> | null = null;

export async function loadAuthorProfile() {
  if (!authorProfilePromise) {
    authorProfilePromise = import("@/generated/author.json").then((module) => module.default as AuthorProfileData);
  }

  return authorProfilePromise;
}
