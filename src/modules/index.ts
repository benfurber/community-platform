import { getConfigurationOption } from 'src/config/config'

export enum MODULE {
  CORE = 'core', // This is enabled on all installations
  HOWTO = 'howto',
  MAP = 'map',
  RESEARCH = 'research',
  ACADEMY = 'academy',
  USER = 'user',
  QUESTION = 'question',
}

export const getSupportedModules = (): MODULE[] => {
  const envModules: string[] =
    getConfigurationOption(
      'VITE_SUPPORTED_MODULES',
      'howto,map,research,academy,user,question',
    )
      .split(',')
      .map((s) => s.trim()) || []
  return [MODULE.CORE].concat(
    Object.values(MODULE).filter((module) => envModules.includes(module)),
  )
}

export const isModuleSupported = (MODULE): boolean =>
  getSupportedModules().includes(MODULE)
