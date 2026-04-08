export interface TocItem {
  id: string;
  level: 2 | 3 | 4;
  text: string;
}

export interface PostSummary {
  canonicalSlug: string;
  aliases: string[];
  title: string;
  publishedAt: string;
  publishedLabel: string;
  excerpt: string;
  type: string;
  searchText: string;
  readingMinutes: number;
  coverImage?: string | null;
  categories: string[];
  tags: string[];
}

export interface PostArticle extends PostSummary {
  html: string;
  toc: TocItem[];
}

export interface AuthorProfileData {
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

export interface FriendLinkData {
  name: string;
  link: string;
  avatar?: string;
  descr?: string;
  className?: string;
}

export interface WorkProjectData {
  slug: string;
  name: string;
  description: string;
  kind: string;
  liveUrl: string;
  githubUrl: string;
}
