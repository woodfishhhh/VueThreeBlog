export interface FriendLinkIssueInput {
  siteName: string;
  siteUrl: string;
  avatarUrl: string;
  description: string;
  contact: string;
}

const FRIEND_LINK_ISSUE_BASE_URL = "https://github.com/woodfishhhh/VueThreeBlog/issues/new";

export function buildFriendLinkIssueUrl(input: FriendLinkIssueInput) {
  const normalizedInput = normalizeInput(input);
  const params = new URLSearchParams({
    title: `[Friend Link] ${normalizedInput.siteName}`,
    body: buildFriendLinkIssueBody(normalizedInput),
  });

  return `${FRIEND_LINK_ISSUE_BASE_URL}?${params.toString()}`;
}

function buildFriendLinkIssueBody(input: FriendLinkIssueInput) {
  return [
    "## Friend Link Application",
    "",
    `- Site Name: ${input.siteName}`,
    `- Site URL: ${input.siteUrl}`,
    `- Avatar URL: ${input.avatarUrl}`,
    `- Short Description: ${input.description}`,
    `- Your Name / Contact: ${input.contact}`,
  ].join("\n");
}

function normalizeInput(input: FriendLinkIssueInput): FriendLinkIssueInput {
  return {
    siteName: input.siteName.trim(),
    siteUrl: input.siteUrl.trim(),
    avatarUrl: input.avatarUrl.trim(),
    description: input.description.trim(),
    contact: input.contact.trim(),
  };
}
