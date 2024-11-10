import type { DefaultTheme, SiteConfig } from 'vitepress';

export type SidebarItem = DefaultTheme.SidebarItem & {
  fname: string
};

export interface SidebarPluginOptionType {
  ignoreList?: Array<RegExp | string>
  path?: string
  createIndex?: boolean
  ignoreIndexItem?: boolean
  deletePrefix?: string | RegExp
  collapsed?: boolean
  /**
   * Directory meta file name
   * ```json
   * {
   *   "title": "xxx",
   *   "order": ["b.md", "a.md"]
   * }
   * ```
   *
   * @default '.sidebar.meta.json'
   */
  metaFilename?: string
  /**
   * Whether to get the sidebar title from the file
   *
   * @default false
   */
  titleFromFile?: boolean
  titleFromFileByYaml?: boolean
  sideBarResolved?: (data: DefaultTheme.SidebarMulti) => DefaultTheme.SidebarMulti
  sideBarItemsResolved?: (data: SidebarItem[]) => SidebarItem[]
  beforeCreateSideBarItems?: (data: string[]) => string[]
}

export interface UserConfig {
  vitepress: SiteConfig
}
