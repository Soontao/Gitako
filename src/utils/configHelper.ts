import * as storageHelper from 'utils/storageHelper'

export type Config = {
  sideBarWidth: number
  shortcut: string | undefined
  /**
   * temporary access token store
   */
  access_token: string | undefined
  compressSingletonFolder: boolean
  copyFileButton: boolean
  copySnippetButton: boolean
  intelligentToggle: boolean | null // `null` stands for intelligent, boolean for sidebar open status
  icons: 'rich' | 'dim' | 'native',
  /**
   * access token for github.com and other github enterprise instances
   */
  access_tokens: {
    [key: string]: string
  }
}

export enum configKeys {
  sideBarWidth = 'sideBarWidth',
  shortcut = 'shortcut',
  accessToken = 'access_token',
  accessTokens = 'access_tokens',
  compressSingletonFolder = 'compressSingletonFolder',
  copyFileButton = 'copyFileButton',
  copySnippetButton = 'copySnippetButton',
  intelligentToggle = 'intelligentToggle',
  icons = 'icons',
}

export const defaultConfigs: Config = {
  sideBarWidth: 260,
  shortcut: undefined,
  access_token: undefined,
  compressSingletonFolder: true,
  copyFileButton: true,
  copySnippetButton: true,
  intelligentToggle: null,
  icons: 'native',
  access_tokens: {}
}

const configKeyArray = Object.values(configKeys)

function applyDefaultConfigs(configs: Config) {
  return configKeyArray.reduce((applied, configKey) => {
    const key = configKey as keyof Config
    Object.assign(applied, { [key]: key in configs ? configs[key] : defaultConfigs[key] })
    return applied
  }, {} as Config)
}

export async function get(): Promise<Config> {
  const config = applyDefaultConfigs(await storageHelper.get(configKeyArray))
  config.access_token = config.access_tokens[window.location.host] // sync access token from storage
  return config
}

export async function set(partialConfig: Partial<Config>) {
  // store current site access token
  partialConfig.access_tokens = partialConfig.access_tokens || {}
  partialConfig.access_tokens[window.location.host] = partialConfig.access_token || ""
  return await storageHelper.set(partialConfig)
}
