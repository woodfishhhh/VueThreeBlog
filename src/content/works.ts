import type { WorkProjectData } from "@/types/content";

const workProjects: WorkProjectData[] = [
  {
    slug: "blog",
    name: "VueCubeBlog",
    description: "三维博客主站，用超立方体把文章、作者和作品入口组织在同一个空间里。",
    kind: "Blog",
    liveUrl: "http://36.151.148.198/newBlog/",
    githubUrl: "https://github.com/woodfishhhh/VueThreeBlog",
  },
  {
    slug: "weather",
    name: "WeatherDemo",
    description: "以黑白留白和克制动效构建的天气探索工作台，兼顾信息密度与阅读节奏。",
    kind: "App",
    liveUrl: "http://36.151.148.198/weather/",
    githubUrl: "https://github.com/woodfishhhh/WeatherDemo",
  },
  {
    slug: "pretext",
    name: "Pretext",
    description: "围绕几何与空间感展开的交互实验，把叙事感放进可触摸的立体结构里。",
    kind: "Lab",
    liveUrl: "http://36.151.148.198/pretext/",
    githubUrl: "https://github.com/woodfishhhh/Pretext-cube",
  },
];

export function getWorkProjects() {
  return workProjects;
}
