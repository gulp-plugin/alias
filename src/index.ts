import path from 'path'
import { TransformCallback, Transform } from 'stream'
import ts from 'typescript'

import File = require('vinyl')

export type CompilerOptions = ts.CompilerOptions

export interface FileData {
  path: string
  index: number
  import: string
}

export interface PluginOptions {
  config?: ts.CompilerOptions | string
  cwd?: string
}

export type AliasPlugin = (pluginOptions: PluginOptions) => Transform

const COMMENTED_PATTERN = /(\/\*(?:(?!\*\/).|[\n\r])*\*\/)|(\/\/[^\n\r]*(?:[\n\r]+|$))/
const IMPORT_PATTERNS = [
  /from (["'])(.*?)\1/g,
  /import\((["'])(.*?)\1\)/g,
  /require\((["'])(.*?)\1\)/g,
  /import\s+(["'])(.*?)\1/g,
]

function parseImports(file: ReadonlyArray<string>, dir: string): FileData[] {
  return file.flatMap((line, index) =>
    findImports(line).map((i) => ({ path: dir, index, import: i }))
  )
}

function findImports(line: string): string[] | null {
  line = line.replace(COMMENTED_PATTERN, '')

  return IMPORT_PATTERNS.flatMap((pattern) => [...line.matchAll(pattern)].map((match) => match[2]))
}

function resolveImports(
  file: ReadonlyArray<string>,
  imports: FileData[],
  options: ts.CompilerOptions
): string[] {
  const { baseUrl, paths, cwd } = options

  const aliases: { [key: string]: string[] | undefined } = {}
  for (const alias in paths) {
    /* istanbul ignore else  */
    if (paths.hasOwnProperty(alias)) {
      let resolved = alias
      if (alias.endsWith('/*')) {
        resolved = alias.replace('/*', '/')
      }

      aliases[resolved] = paths[alias]
    }
  }

  const lines: string[] = [...file]
  for (const imported of imports) {
    const line = file[imported.index]

    let resolved = ''
    for (const alias in aliases) {
      /* istanbul ignore else  */
      if (aliases.hasOwnProperty(alias) && imported.import.startsWith(alias)) {
        const choices: string[] | undefined = aliases[alias]

        if (choices !== undefined) {
          resolved = choices[0]
          if (resolved.endsWith('/*')) {
            resolved = resolved.replace('/*', '/')
          }

          resolved = imported.import.replace(alias, resolved)

          break
        }
      }
    }

    if (resolved.length < 1) {
      continue
    }

    const base = path.join(cwd as string, path.relative(cwd as string, baseUrl || './'))
    const current = path.relative(base, path.dirname(imported.path))
    const target = path.relative(base, resolved)

    const relative = path.relative(current, target).replace(/\\/g, '/')

    lines[imported.index] = line.replace(imported.import, relative)
  }

  return lines
}

function resolveConfig(config?: string | ts.CompilerOptions, cwd?: string): ts.CompilerOptions {
  if (!config) {
    let configPath: string | undefined

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'test') {
      configPath = ts.findConfigFile(cwd, ts.sys.fileExists)
    }

    /* istanbul ignore else */
    if (!configPath) {
      throw new Error("Could not find a valid 'tsconfig.json'")
    } else {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile)
      const { options } = ts.parseJsonConfigFileContent(configFile.config, ts.sys, cwd)

      return options
    }
  }

  if (typeof config === 'string') {
    const configFile = ts.readConfigFile(config, ts.sys.readFile)
    const { options } = ts.parseJsonConfigFileContent(configFile.config, ts.sys, cwd)

    return options
  }

  return config
}

const alias: AliasPlugin = ({ config, cwd }: PluginOptions) => {
  cwd = cwd === undefined ? process.cwd() : cwd === '.' ? './' : cwd

  const compilerOptions = resolveConfig(config, cwd)

  if (!compilerOptions.paths) {
    throw new Error("Unable to find the 'paths' property in the supplied configuration!")
  }

  if (compilerOptions.baseUrl === undefined || compilerOptions.baseUrl === '.') {
    compilerOptions.baseUrl = './'
  }

  compilerOptions.cwd = cwd

  return new Transform({
    objectMode: true,
    transform(file: File, encoding: BufferEncoding, callback: TransformCallback) {
      /* istanbul ignore if */
      if (file.isStream()) {
        return callback(new Error('Streaming is not supported.'))
      }

      if (file.isNull() || !file.contents) {
        return callback(undefined, file)
      }

      if (!file.path) {
        return callback(
          new Error('Received file with no path. Files must have path to be resolved.')
        )
      }

      const lines = file.contents.toString().split('\n')
      const imports = parseImports(lines, file.path)

      if (imports.length === 0) {
        return callback(undefined, file)
      }

      const resolved = resolveImports(lines, imports, compilerOptions)

      file.contents = Buffer.from(resolved.join('\n'))

      callback(undefined, file)
    },
  })
}

export default alias

// ES5/ES6 fallbacks
module.exports = alias
module.exports.default = alias
