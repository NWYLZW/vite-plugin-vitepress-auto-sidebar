import { defineConfig } from "vitepress";
import AutoSidebar from "vite-plugin-vitepress-auto-sidebar";

export default defineConfig({
  title: "VitePress",
  lang: "a",
  description: "Vite & Vue powered static site generator.",
  locales: {
    root: {
      lang: 'a',
      label: 'A',
      link: '/a/',
      themeConfig: {
        nav: [
          { text: "home", link: "/a/" },
          { text: "note", link: "/a/note/" },
          { text: "meta", link: "/a/meta/b" },
          { text: "nestedNote", link: "/a/nestedNote/first/first" }
        ]
      }
    },
    b: {
      lang: 'b',
      label: 'B',
      link: '/b/',
      themeConfig: {
        nav: [
          { text: "home", link: "/b/" },
          { text: "note", link: "/b/note/" },
          { text: "meta", link: "/b/meta/b" },
          { text: "nestedNote", link: "/b/nestedNote/first/first" }
        ]
      }
    }
  },
  vite: {
    plugins: [
      AutoSidebar({
        deletePrefix: '.',
        collapsed: false,
        titleFromFile: true,
      })
    ],
  },
});
