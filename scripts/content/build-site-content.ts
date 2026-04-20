import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import DOMPurify from "isomorphic-dompurify";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import yaml from "js-yaml";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

import {
  buildLegacySlugIndex,
  normalizeMarkdownBody,
  resolveAssetReference,
  resolveCanonicalSlug,
  toSitePublicUrl,
  rewriteMarkdownAssetPaths,
} from "./generator-core";

export interface GeneratedPostIndexEntry {
  canonicalSlug: string;
  aliases: string[];
  title: string;
  publishedAt: string;
  publishedLabel: string;
  excerpt: string;
  type: string;
  searchText: string;
  readingMinutes: number;
  coverImage: string | null;
  categories: string[];
  tags: string[];
}

export interface GeneratedTocItem {
  id: string;
  level: 2 | 3 | 4;
  text: string;
}

export interface GeneratedPostArticle extends GeneratedPostIndexEntry {
  html: string;
  toc: GeneratedTocItem[];
}

export interface GeneratedAuthorProfile {
  name: string;
  title: string;
  slogan: string;
  intro: string;
  avatar: string;
  postsCount: number;
  tagsCount: number;
  categoriesCount: number;
  skills: { title: string; color: string; img: string }[];
  tags: string[];
  // 完整作者信息
  leftTags: string[];
  rightTags: string[];
  careers: {
    school: string;
    major: string;
    color: string;
  }[];
  personalities: {
    tips: string;
    title: string;
    color: string;
    type: string;
    image: string;
    linkText: string;
    typeLink: string;
    typeName: string;
    myphoto: string;
  };
  motto: {
    title: string;
    prefix: string;
    content: string;
  };
  expertise: {
    title: string;
    prefix: string;
    specialist: string;
    content: string;
    level: string;
  };
  game: {
    title: string;
    subtitle: string;
    img: string;
    box_shadow: string;
    tips_left: string;
    tips_right: string;
  }[];
  likes: {
    type: string;
    tips: string;
    title: string;
    subtips: string;
    list?: {
      name: string;
      href: string;
      cover: string;
    }[];
    bg?: string;
    button?: boolean;
    button_link?: string;
    button_text?: string;
  }[];
  oneself: {
    map: {
      light: string;
      dark: string;
    };
    location: string;
    birthYear: number;
    university: string;
    major: string;
    occupation: string;
  };
  cause: {
    tip: string;
    title: string;
    content: string;
  };
  tenyear: {
    tips: string;
    title: string;
    text: string;
    start: string;
    end: string;
  };
  award: {
    enable: boolean;
    description: string;
    tips: string;
  };
  rewardList: {
    name: string;
    money: number;
    time: number;
    color: string;
    icon: string;
  }[];
}

export interface GeneratedFriendLink {
  name: string;
  link: string;
  avatar?: string;
  descr?: string;
  className?: string;
}

export interface SiteContentBuildResult {
  postIndex: GeneratedPostIndexEntry[];
  postsBySlug: Record<string, GeneratedPostArticle>;
  author: GeneratedAuthorProfile;
  friendLinks: GeneratedFriendLink[];
}

export interface BuildSiteContentOptions {
  sourceProjectRoot: string;
  targetPublicDir?: string;
  siteBasePath?: string;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const timestampPattern = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

const tagsToRemove = [
  "数码科技爱好者",
  "🔍 分享与热心帮助",
  "🏠 我是鱼唇大学生",
  "🔨 前端开发正在学",
  "学习算法和音乐 🤝",
  "脚踏实地行动派 🏃",
  "团队小组发动机 🧱",
  "电子音乐制作人 🎧",
] as const;

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSlug)
  .use(rehypeHighlight)
  .use(rehypeStringify);

export async function buildSiteContent(options: BuildSiteContentOptions): Promise<SiteContentBuildResult> {
  const sourceProjectRoot = options.sourceProjectRoot;
  const myblogRoot = path.join(sourceProjectRoot, "content", "source", "myblog");
  const legacyPostsRoot = path.join(sourceProjectRoot, "content", "posts");
  const aboutPath = path.join(sourceProjectRoot, "content", "source", "blog", "source", "_data", "about.yml");
  const linkPath = path.join(sourceProjectRoot, "content", "source", "blog", "source", "_data", "link.yml");
  const configPath = path.join(sourceProjectRoot, "content", "source", "blog", "_config.yml");
  const targetPublicDir = options.targetPublicDir ?? path.join(process.cwd(), "public");
  const siteBasePath = options.siteBasePath;

  const legacyIndex = buildLegacySlugIndex(await readLegacyEntries(legacyPostsRoot));
  const markdownFiles = await collectMarkdownFiles(myblogRoot);
  const postsBySlug: Record<string, GeneratedPostArticle> = {};
  const postIndex: GeneratedPostIndexEntry[] = [];

  for (const filePath of markdownFiles) {
    const rawMarkdown = await readFile(filePath, "utf8");
    const parsed = matter(rawMarkdown);
    const title = readString(parsed.data.title) || path.basename(filePath, ".md");
    const date = readString(parsed.data.date) || "2026-01-01 00:00:00";
    const sourceRelativePath = path.relative(myblogRoot, filePath);
    const slugResult = resolveCanonicalSlug({
      title,
      date,
      rawMarkdown,
      sourceRelativePath,
      legacyIndex,
    });

    const normalizedBody = normalizeMarkdownBody(rawMarkdown, title);
    const rewritten = await rewriteMarkdownAssetPaths(normalizedBody, {
      sourceFilePath: filePath,
      canonicalSlug: slugResult.canonicalSlug,
      publicDir: targetPublicDir,
      siteBasePath,
    });
    const toc = extractToc(rewritten.markdown);
    const publishedAt = toIsoDate(date);
    const postType = resolvePostType(parsed.data.type);
    const categories = toStringArray(parsed.data.categories);
    const tags = toStringArray(parsed.data.tags);
    const searchText = createSearchText({
      title,
      type: postType,
      categories,
      tags,
      markdown: rewritten.markdown,
    });
    const readingMinutes = estimateReadingMinutes(rewritten.markdown);
    const coverImage = await resolveContentAssetValue(readString(parsed.data.cover), {
      sourceFilePath: filePath,
      canonicalSlug: slugResult.canonicalSlug,
      targetPublicDir,
      siteBasePath,
    });
    const entry: GeneratedPostArticle = {
      canonicalSlug: slugResult.canonicalSlug,
      aliases: slugResult.aliases,
      title,
      publishedAt,
      publishedLabel: formatPublishedDate(publishedAt),
      excerpt: createExcerpt(rewritten.markdown, title),
      type: postType,
      searchText,
      readingMinutes,
      coverImage,
      categories,
      tags,
      html: await renderArticleHtml(rewritten.markdown),
      toc,
    };

    postsBySlug[entry.canonicalSlug] = entry;
    postIndex.push({
      canonicalSlug: entry.canonicalSlug,
      aliases: entry.aliases,
      title: entry.title,
      publishedAt: entry.publishedAt,
      publishedLabel: entry.publishedLabel,
      excerpt: entry.excerpt,
      type: entry.type,
      searchText: entry.searchText,
      readingMinutes: entry.readingMinutes,
      coverImage: entry.coverImage,
      categories: entry.categories,
      tags: entry.tags,
    });
  }

  postIndex.sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));

  return {
    postIndex,
    postsBySlug,
    author: await buildAuthorProfile({ aboutPath, configPath, posts: postIndex, targetPublicDir, siteBasePath }),
    friendLinks: await readFriendLinks(linkPath, targetPublicDir, siteBasePath),
  };
}

async function readLegacyEntries(legacyPostsRoot: string) {
  try {
    const directories = await readdir(legacyPostsRoot, { withFileTypes: true });
    const entries = [];

    for (const directory of directories) {
      if (!directory.isDirectory()) {
        continue;
      }

      const filePath = path.join(legacyPostsRoot, directory.name, "index.md");
      const rawMarkdown = await readFile(filePath, "utf8");
      const parsed = matter(rawMarkdown);
      entries.push({
        slug: directory.name,
        title: readString(parsed.data.title) || directory.name,
        date: readString(parsed.data.date) || "2026-01-01 00:00:00",
        rawMarkdown,
      });
    }

    return entries;
  } catch {
    return [];
  }
}

async function collectMarkdownFiles(root: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentPath: string) {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const resolvedPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await walk(resolvedPath);
        continue;
      }

      if (entry.isFile() && resolvedPath.endsWith(".md")) {
        files.push(resolvedPath);
      }
    }
  }

  try {
    await walk(root);
  } catch {
    return [];
  }

  return files;
}

function extractToc(markdown: string): GeneratedTocItem[] {
  const slugger = new GithubSlugger();
  const toc: GeneratedTocItem[] = [];
  const lines = markdown.split(/\r?\n/);
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (!match) {
      continue;
    }

    const text = stripInlineMarkdown(match[2].trim());
    toc.push({
      id: slugger.slug(text),
      level: match[1].length as 2 | 3 | 4,
      text,
    });
  }

  return toc;
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_]{1,2}(.*?)[*_]{1,2}/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function createExcerpt(markdown: string, title: string) {
  const paragraphs = markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .filter((block) => !block.startsWith("#"))
    .filter((block) => !block.startsWith("```"));

  const firstParagraph = paragraphs[0] ?? `A deep dive into ${title}.`;
  const plainText = stripInlineMarkdown(firstParagraph).replace(/!\[[^\]]*\]\([^)]+\)/g, "").trim();
  return `${plainText.slice(0, 150)}${plainText.length > 150 ? "..." : ""}`;
}

function resolvePostType(value: unknown) {
  return readString(value).trim() || "Notes";
}

function createSearchText(options: {
  title: string;
  type: string;
  categories: string[];
  tags: string[];
  markdown: string;
}) {
  return [
    options.title,
    options.type,
    options.categories.join(" "),
    options.tags.join(" "),
    toSearchablePlainText(options.markdown),
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateReadingMinutes(markdown: string) {
  const plainText = toSearchablePlainText(markdown);

  if (!plainText) {
    return 1;
  }

  const cjkCount = (plainText.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) ?? [])
    .length;
  const nonCjkText = plainText.replace(
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu,
    " ",
  );
  const wordCount = nonCjkText.split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil((cjkCount + wordCount) / 220));
}

function toSearchablePlainText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, " $1 ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function resolveContentAssetValue(
  rawValue: string,
  options: {
    sourceFilePath: string;
    targetPublicDir: string;
    siteBasePath?: string;
    canonicalSlug?: string;
  },
) {
  if (!rawValue) {
    return options.canonicalSlug ? null : "";
  }

  const resolved = await resolveAssetReference(rawValue, {
    sourceFilePath: options.sourceFilePath,
    publicDir: options.targetPublicDir,
    siteBasePath: options.siteBasePath,
    canonicalSlug: options.canonicalSlug,
  });

  if (resolved) {
    return resolved;
  }

  const normalized = toSitePublicUrl(rawValue, options.siteBasePath);
  if (normalized !== rawValue) {
    return normalized;
  }

  return options.canonicalSlug ? null : rawValue;
}

async function resolveContentAssetText(
  rawValue: string,
  options: {
    sourceFilePath: string;
    targetPublicDir: string;
    siteBasePath?: string;
    canonicalSlug?: string;
  },
) {
  return (await resolveContentAssetValue(rawValue, options)) ?? "";
}

async function buildAuthorProfile(options: {
  aboutPath: string;
  configPath: string;
  posts: GeneratedPostIndexEntry[];
  targetPublicDir: string;
  siteBasePath?: string;
}): Promise<GeneratedAuthorProfile> {
  const tagsSet = new Set<string>();
  const categoriesSet = new Set<string>();
  for (const post of options.posts) {
    for (const tag of post.tags) tagsSet.add(tag);
    for (const category of post.categories) categoriesSet.add(category);
  }

  const configText = await safeReadFile(options.configPath);
  const configData = (yaml.load(configText) as { author?: unknown; subtitle?: unknown } | undefined) ?? {};
  const aboutText = await safeReadFile(options.aboutPath);
  const aboutData = (yaml.load(aboutText) as Record<string, any> | undefined) ?? {};
  const rawProfileTags = [
    ...(Array.isArray(aboutData.authorinfo?.leftTags) ? aboutData.authorinfo.leftTags : []),
    ...(Array.isArray(aboutData.authorinfo?.rightTags) ? aboutData.authorinfo.rightTags : []),
  ];
  const filteredTags = rawProfileTags
    .map((item: unknown) => readString(typeof item === "string" ? item : (item as { title?: unknown })?.title))
    .filter((tag) => tag.length > 0)
    .filter((tag) => !tagsToRemove.some((forbiddenTag) => tag.includes(forbiddenTag)));

  const rawAvatar = readString(aboutData.authorinfo?.image);
  const avatar = await resolveContentAssetText(rawAvatar, {
    sourceFilePath: options.aboutPath,
    targetPublicDir: options.targetPublicDir,
    siteBasePath: options.siteBasePath,
  });

  // 提取 leftTags 和 rightTags
  const leftTags = (Array.isArray(aboutData.authorinfo?.leftTags) ? aboutData.authorinfo.leftTags : [])
    .map((item: unknown) => readString(typeof item === "string" ? item : ""))
    .filter((tag: string) => tag.length > 0);
  const rightTags = (Array.isArray(aboutData.authorinfo?.rightTags) ? aboutData.authorinfo.rightTags : [])
    .map((item: unknown) => readString(typeof item === "string" ? item : ""))
    .filter((tag: string) => tag.length > 0);

  // 提取 careers
  const careers = (Array.isArray(aboutData.careers?.items) ? aboutData.careers.items : []).map((item: any) => ({
    school: readString(item?.school),
    major: readString(item?.major),
    color: readString(item?.color),
  })).filter((item: { school: string; major: string }) => item.school && item.major);

  // 提取 personalities
  const personalitiesRaw = aboutData.personalities || {};
  const personalities = {
    tips: readString(personalitiesRaw.tips),
    title: readString(personalitiesRaw.title),
    color: readString(personalitiesRaw.color),
    type: readString(personalitiesRaw.type),
    image: await resolveContentAssetText(readString(personalitiesRaw.image), {
      sourceFilePath: options.aboutPath,
      targetPublicDir: options.targetPublicDir,
      siteBasePath: options.siteBasePath,
    }),
    linkText: readString(personalitiesRaw.linkText),
    typeLink: readString(personalitiesRaw.typeLink),
    typeName: readString(personalitiesRaw.typeName),
    myphoto: await resolveContentAssetText(readString(personalitiesRaw.myphoto), {
      sourceFilePath: options.aboutPath,
      targetPublicDir: options.targetPublicDir,
      siteBasePath: options.siteBasePath,
    }),
  };

  // 提取 motto
  const mottoRaw = aboutData.motto || {};
  const motto = {
    title: readString(mottoRaw.title),
    prefix: readString(mottoRaw.prefix),
    content: readString(mottoRaw.content),
  };

  // 提取 expertise
  const expertiseRaw = aboutData.expertise || {};
  const expertise = {
    title: readString(expertiseRaw.title),
    prefix: readString(expertiseRaw.prefix),
    specialist: readString(expertiseRaw.specialist),
    content: readString(expertiseRaw.content),
    level: readString(expertiseRaw.level),
  };

  // 提取 game
  const gameRaw = Array.isArray(aboutData.game) ? aboutData.game : [];
  const game = await Promise.all(gameRaw.map(async (item: any) => ({
    title: readString(item?.title),
    subtitle: readString(item?.subtitle),
    img: await resolveContentAssetText(readString(item?.img), {
      sourceFilePath: options.aboutPath,
      targetPublicDir: options.targetPublicDir,
      siteBasePath: options.siteBasePath,
    }),
    box_shadow: readString(item?.box_shadow),
    tips_left: readString(item?.tips_left),
    tips_right: readString(item?.tips_right),
  })));

  // 提取 likes
  const likesRaw = Array.isArray(aboutData.likes) ? aboutData.likes : [];
  const likes = await Promise.all(likesRaw.map(async (item: any) => {
    const normalized: any = {
      type: readString(item?.type),
      tips: readString(item?.tips),
      title: readString(item?.title),
      subtips: readString(item?.subtips),
    };
    if (Array.isArray(item?.list)) {
      normalized.list = await Promise.all(item.list.map(async (listItem: any) => ({
        name: readString(listItem?.name),
        href: readString(listItem?.href),
        cover: await resolveContentAssetText(readString(listItem?.cover), {
          sourceFilePath: options.aboutPath,
          targetPublicDir: options.targetPublicDir,
          siteBasePath: options.siteBasePath,
        }),
      })));
    }
    if (item?.bg) {
      normalized.bg = await resolveContentAssetText(readString(item.bg), {
        sourceFilePath: options.aboutPath,
        targetPublicDir: options.targetPublicDir,
        siteBasePath: options.siteBasePath,
      });
    }
    if (item?.button) normalized.button = item.button;
    if (item?.button_link) normalized.button_link = readString(item.button_link);
    if (item?.button_text) normalized.button_text = readString(item.button_text);
    return normalized;
  }));

  // 提取 oneself
  const oneselfRaw = aboutData.oneself || {};
  const oneself = {
    map: {
      light: await resolveContentAssetText(readString(oneselfRaw.map?.light), {
        sourceFilePath: options.aboutPath,
        targetPublicDir: options.targetPublicDir,
        siteBasePath: options.siteBasePath,
      }),
      dark: await resolveContentAssetText(readString(oneselfRaw.map?.dark), {
        sourceFilePath: options.aboutPath,
        targetPublicDir: options.targetPublicDir,
        siteBasePath: options.siteBasePath,
      }),
    },
    location: readString(oneselfRaw.location),
    birthYear: typeof oneselfRaw.birthYear === "number" ? oneselfRaw.birthYear : 2006,
    university: readString(oneselfRaw.university),
    major: readString(oneselfRaw.major),
    occupation: readString(oneselfRaw.occupation),
  };

  // 提取 cause
  const causeRaw = aboutData.cause || {};
  const cause = {
    tip: readString(causeRaw.tip),
    title: readString(causeRaw.title),
    content: readString(causeRaw.content),
  };

  // 提取 tenyear
  const tenyearRaw = aboutData.tenyear || {};
  const tenyear = {
    tips: readString(tenyearRaw.tips),
    title: readString(tenyearRaw.title),
    text: readString(tenyearRaw.text),
    start: readString(tenyearRaw.start),
    end: readString(tenyearRaw.end),
  };

  // 提取 award 和 rewardList
  const awardRaw = aboutData.award || {};
  const award = {
    enable: Boolean(awardRaw.enable),
    description: readString(awardRaw.description),
    tips: readString(awardRaw.tips),
  };
  const rewardListRaw = Array.isArray(aboutData.rewardList) ? aboutData.rewardList : [];
  const rewardList = rewardListRaw.map((item: any) => ({
    name: readString(item?.name),
    money: typeof item?.money === "number" ? item.money : 0,
    time: typeof item?.time === "number" ? item.time : 0,
    color: readString(item?.color),
    icon: readString(item?.icon),
  })).filter((item) => item.name && item.money > 0);

  return {
    name: readString(aboutData.contentinfo?.name) || readString(configData.author) || "Woodfish",
    title: readString(aboutData.contentinfo?.title) || "Developer",
    slogan: readString(aboutData.contentinfo?.slogan),
    intro: readString(aboutData.contentinfo?.sup) || readString(configData.subtitle),
    avatar,
    postsCount: options.posts.length,
    tagsCount: tagsSet.size,
    categoriesCount: categoriesSet.size,
    skills: await normalizeSkills(aboutData.skills?.tags, options.aboutPath, options.targetPublicDir, options.siteBasePath),
    tags: filteredTags,
    // 新增字段
    leftTags,
    rightTags,
    careers,
    personalities,
    motto,
    expertise,
    game,
    likes,
    oneself,
    cause,
    tenyear,
    award,
    rewardList,
  };
}

async function readFriendLinks(
  linkPath: string,
  targetPublicDir: string,
  siteBasePath?: string,
): Promise<GeneratedFriendLink[]> {
  const raw = await safeReadFile(linkPath);
  const data = (yaml.load(raw) as { links?: unknown } | undefined) ?? {};
  const result: GeneratedFriendLink[] = [];
  const groups = Array.isArray(data.links) ? data.links : [];

  for (const group of groups) {
    const typedGroup = typeof group === "object" && group !== null ? (group as { class_name?: unknown; link_list?: unknown }) : null;
    const className = readString(typedGroup?.class_name);
    const linkList = Array.isArray(typedGroup?.link_list) ? typedGroup.link_list : [];

    for (const item of linkList) {
      const typedItem = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : null;
      const name = readString(typedItem?.name);
      const link = readString(typedItem?.link);
      if (!name || !link) {
        continue;
      }

      const rawAvatar = readString(typedItem?.avatar);
      const avatar = rawAvatar
        ? (await resolveContentAssetValue(rawAvatar, {
            sourceFilePath: linkPath,
            targetPublicDir,
            siteBasePath,
          })) ?? undefined
        : undefined;

      result.push({
        name,
        link,
        avatar,
        descr: readString(typedItem?.descr) || undefined,
        className: className || undefined,
      });
    }
  }

  return result;
}

async function safeReadFile(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function normalizeSkills(
  value: unknown,
  sourceFilePath: string,
  targetPublicDir: string,
  siteBasePath?: string,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized = await Promise.all(
    value.map(async (item) => {
      const typedItem = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : null;
      const title = readString(typedItem?.title);
      if (!title) {
        return null;
      }

      const rawImage = readString(typedItem?.img);
      const image = rawImage
        ? await resolveContentAssetText(rawImage, {
            sourceFilePath,
            targetPublicDir,
            siteBasePath,
          })
        : "";

      return {
        title,
        color: readString(typedItem?.color),
        img: image,
      };
    }),
  );

  return normalized.filter((item): item is { title: string; color: string; img: string } => item !== null);
}

function readString(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return "";
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(readString).filter(Boolean);
}

function toIsoDate(value: string) {
  const parsedTimestamp = value.match(timestampPattern);

  if (parsedTimestamp) {
    const [, year, month, day, hour = "0", minute = "0", second = "0"] = parsedTimestamp;
    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ),
    ).toISOString();
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? new Date("2026-01-01T00:00:00.000Z").toISOString() : parsedDate.toISOString();
}

function formatPublishedDate(value: string) {
  const parsedTimestamp = value.match(timestampPattern);

  if (parsedTimestamp) {
    const [, year, month, day, hour = "0", minute = "0", second = "0"] = parsedTimestamp;
    const date = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
      ),
    );

    return dateFormatter.format(date);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

async function renderArticleHtml(markdown: string) {
  const rendered = await markdownProcessor.process(markdown);
  const rawHtml = String(rendered.value);
  // ─────────────────────────────────────────────────────────────────────────────
  // XSS 防护：构建时用 DOMPurify 消毒生成的 HTML
  //
  // DOMPurify 配置说明：
  //   ALLOWED_TAGS:  允许的 HTML 标签黑名单之外的标签会被删除
  //   ALLOWED_ATTR:  允许的 HTML 属性黑名单之外的属性会被移除
  //   ALLOW_DATA_ATTR: 允许 data-* 自定义属性（常用于组件库）
  //
  // 这样即使 Markdown 里有人埋了 <script> 或 <img onerror=...>
  // 也会在构建时被清除，不会进入最终产物的 JSON 文件。
  // ─────────────────────────────────────────────────────────────────────────────
  const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "strong", "em", "del", "s", "mark", "sup", "sub",
      "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span",
      "details", "summary",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class",
      "id", "loading", "decoding",
      "target", "rel", "width", "height",
      "colspan", "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
  });
  return addLazyImageAttributes(sanitizedHtml);
}

function addLazyImageAttributes(html: string) {
  return html.replace(/<img\b([^>]*?)>/g, (_match, attributes) => {
    let nextAttributes = attributes;

    if (!/\sloading=/.test(nextAttributes)) {
      nextAttributes += ' loading="lazy"';
    }

    if (!/\sdecoding=/.test(nextAttributes)) {
      nextAttributes += ' decoding="async"';
    }

    return `<img${nextAttributes}>`;
  });
}
