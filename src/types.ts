import type { DefaultTheme, SiteConfig } from 'vitepress';
export interface SidebarPluginOptionType {
  ignoreList?: Array<RegExp | string>
  path?: string
  createIndex?: boolean
  ignoreIndexItem?: boolean
  deletePrefix?: string | RegExp
  collapsed?: boolean
  /**
   * Whether to get the sidebar title from the file
   *
   * @default false
   */
  titleFromFile?: boolean
  titleFromFileByYaml?: boolean
  sideBarResolved?: (data: DefaultTheme.SidebarMulti) => DefaultTheme.SidebarMulti
  sideBarItemsResolved?: (data: DefaultTheme.SidebarItem[]) => DefaultTheme.SidebarItem[]
  beforeCreateSideBarItems?: (data: string[]) => string[]
}
export interface UserConfig {
  vitepress: SiteConfig
}
