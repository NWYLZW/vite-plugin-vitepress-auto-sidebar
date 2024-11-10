import { join } from 'path';
import { readdirSync, statSync } from 'fs';
import { type DefaultTheme } from 'vitepress/theme';
import { type Plugin, type ViteDevServer } from 'vite';
import type { SidebarPluginOptionType, UserConfig } from './types';

import { DEFAULT_IGNORE_FOLDER, log, removePrefix, getTitleFromFile, getTitleFromFileByYaml } from './utils';

let option: SidebarPluginOptionType;

function extractTitleFn ({ titleFromFile = false, titleFromFileByYaml = false }): ((file: string) => string | undefined) | undefined {
  if (titleFromFile) {
    return getTitleFromFile;
  } else if (titleFromFileByYaml) {
    return getTitleFromFileByYaml;
  }
  return undefined;
}

function createSideBarItems (
  targetPath: string,
  ...reset: string[]
): DefaultTheme.SidebarItem[] {
  const {
    ignoreIndexItem,
    deletePrefix,
    collapsed,
    sideBarItemsResolved,
    beforeCreateSideBarItems,
    ignoreList = [],
    titleFromFile = false,
    titleFromFileByYaml = false
  } = option;
  const rawNode = readdirSync(join(targetPath, ...reset)).reduce<string[]>(
    // make index.md to the first
    (acc, cur) => [
      'index.md', 'index.MD'
    ].includes(cur)
      ? [cur, ...acc]
      : [...acc, cur],
    []
  );
  const node = beforeCreateSideBarItems?.(rawNode) ?? rawNode;
  const currentDir = join(targetPath, ...reset);
  if (ignoreIndexItem && node.length === 1 && node[0] === 'index.md') {
    return [];
  }
  const result: DefaultTheme.SidebarItem[] = [];

  const exec = extractTitleFn({ titleFromFile, titleFromFileByYaml });
  for (const fname of node) {
    if (statSync(join(targetPath, ...reset, fname)).isDirectory()) {
      if (ignoreList.some(item => item === fname || (item instanceof RegExp && item.test(fname)))) {
        continue;
      }
      // is directory
      // ignore cur node if items length is 0
      const items = createSideBarItems(join(targetPath), ...reset, fname);
      let exsistIndex = false;
      // replace directory name, if yes
      let text = fname;
      // get the title in index.md file
      if (exec) {
        const filenames = [
          'index.md',
          'index.MD',
          `${fname}.md`
        ];

        for (const filename of filenames) {
          const path = join(currentDir, fname, filename);
          const title = exec(path);
          if (title) {
            text = title;
            if (filename === 'index.md' || filename === 'index.MD') {
              const index = items.findIndex(i => i.link?.endsWith('index.html'));
              if (index !== -1) {
                items.splice(index, 1);
                exsistIndex = true;
              }
            }
            break;
          }
        }
      }
      if (deletePrefix) {
        text = removePrefix(text, deletePrefix);
      }
      if (items.length > 0) {
        const sidebarItem: DefaultTheme.SidebarItem = {
          text,
          link: exsistIndex ? `/${[...reset, fname].join('/')}/` : undefined,
          items
        };
        // vitePress sidebar option collapsed
        sidebarItem.collapsed = collapsed;
        result.push(sidebarItem);
      }
    } else {
      // is filed
      if (
        (ignoreIndexItem && fname === 'index.md') ||
        /^-.*\.(md|MD)$/.test(fname) ||
        ignoreList.some(item => item === fname || (item instanceof RegExp && item.test(fname))) ||
        !fname.endsWith('.md')
      ) {
        continue;
      }
      const fileName = fname.replace(/\.md$/, '');
      let text = fileName;
      if (deletePrefix) {
        text = removePrefix(text, deletePrefix);
      }
      const realFileName = join(currentDir, fname);
      if (exec) {
        const title = exec(realFileName);
        if (title) {
          text = title;
        }
      }
      const item: DefaultTheme.SidebarItem = {
        text,
        link: '/' + [...reset, `${fileName}.html`].join('/')
      };
      result.push(item);
    }
  }
  return sideBarItemsResolved?.(result) ?? result;
}

function createSideBarGroups (
  targetPath: string,
  base = ''
): DefaultTheme.SidebarMulti[string] {
  return {
    base,
    items: createSideBarItems(targetPath)
  };
}

function createSidebarMulti (path: string, prefix?: string): DefaultTheme.SidebarMulti {
  const calcPrefix = prefix ? `/${prefix}` : '';
  const {
    ignoreList = [],
    ignoreIndexItem = false,
    sideBarResolved
  } = option;
  const il = [...DEFAULT_IGNORE_FOLDER, ...ignoreList];
  const data: DefaultTheme.SidebarMulti = {};
  const node = readdirSync(path).filter(
    (n) => statSync(join(path, n)).isDirectory() && !il.includes(n)
  );

  for (const k of node) {
    data[`${calcPrefix}/${k}/`] = createSideBarGroups(
      join(path, k),
      prefix !== undefined ? `${calcPrefix}/${k}/` : undefined
    );
  }

  // is ignored only index.md
  if (ignoreIndexItem) {
    for (const i in data) {
      let obj = data[i];
      if (Array.isArray(obj)) {
        obj = obj.filter((i) => i.items != null && i.items.length > 0);
        if (obj.length === 0) {
          Reflect.deleteProperty(data, i);
        }
      }
    }
  }

  return sideBarResolved?.(data) ?? data;
}

export default function VitePluginVitePressAutoSidebar (
  opt: SidebarPluginOptionType = {}
): Plugin {
  return {
    name: 'vite-plugin-vitepress-auto-sidebar',
    configureServer ({
      watcher,
      restart
    }: ViteDevServer) {
      const fsWatcher = watcher.add('*.md');
      fsWatcher.on('all', async (event, path) => {
        if (event !== 'change') {
          log(`${event} ${path}`);
          try {
            await restart();
            log('update sidebar...');
          } catch {
            log(`${event} ${path}`);
            log('update sidebar failed');
          }
        }
      });
    },
    config (config) {
      option = opt;
      const { path = '/docs' } = option;
      // increment ignore item
      const docsPath = join(process.cwd(), path);
      const { vitepress: { site } } = (config as UserConfig);
      if (site.locales && Object.keys(site.locales).length > 0) {
        for (const key in site.locales) {
          const { themeConfig, lang } = site.locales[key];
          if (!lang) {
            throw new Error('`lang` is required in locale config');
          }
          themeConfig.sidebar = createSidebarMulti(join(docsPath, lang), lang);
        }
      } else {
        site.themeConfig.sidebar = createSidebarMulti(docsPath);
      }
      log('injected sidebar data successfully');
      return config;
    }
  };
}
