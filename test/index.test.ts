/* eslint-disable @typescript-eslint/no-non-null-assertion */
import File from 'vinyl'

import alias, { PluginOptions, CompilerOptions } from '../src'
import { Readable } from 'stream'

interface Test {
  options: PluginOptions
  path: string
  input?: string
  output?: string
  error?: string
  env?: Record<string, unknown>
}

const config: CompilerOptions = {
  paths: { components: ['./src/components/Component'] },
  baseUrl: './',
}

const tests: Record<string, Test> = {
  ['should support ES6 imports']: {
    options: { config },
    path: './src/pages/Page.ts',
    input: "import module from 'module'\nimport Component from 'components'",
    output: "import module from 'module'\nimport Component from '../components/Component'",
  },
  ['should support dynamic imports']: {
    options: { config },
    path: './src/pages/Page.ts',
    input: "const Component = await import('components')",
    output: "const Component = await import('../components/Component')",
  },
  ["should support 'require()' imports"]: {
    options: { config },
    path: './src/pages/Page.ts',
    input: "const module = require('module')\nconst Component = require('components')",
    output:
      "const module = require('module')\nconst Component = require('../components/Component')",
  },
  ['should support side effect imports']: {
    options: { config },
    path: './src/pages/Page.ts',
    input: "import module from 'module'\nimport 'components'",
    output: "import module from 'module'\nimport '../components/Component'",
  },
  ['should support wild card aliases']: {
    options: { config: { paths: { '@/*': ['./src/*'] } } },
    path: './src/pages/Page.ts',
    input: "import module from 'module'\nimport Component from '@/components'",
    output: "import module from 'module'\nimport Component from '../components'",
  },
  ['should skip commented imports']: {
    options: { config },
    path: './src/pages/Page.ts',
    input: "// import Component from 'components'\nimport module from 'module'",
    output: "// import Component from 'components'\nimport module from 'module'",
  },
  ['should pass files with no aliases']: {
    options: { config },
    path: './src/pages/Page.ts',
    input: "import module from 'module'",
    output: "import module from 'module'",
  },
  ['should pass empty files']: {
    options: { config },
    path: './src/pages/Page.ts',
    input: '',
    output: '',
  },
  ['should pass invalid files']: {
    options: { config },
    path: './src/pages/Page.ts',
  },
  ["should work with no 'baseUrl'"]: {
    options: { config: { ...config, baseUrl: undefined } },
    path: './src/pages/Page.ts',
    input: "import module from 'module'\nimport Component from 'components'",
    output: "import module from 'module'\nimport Component from '../components/Component'",
  },
  ["should work with 'baseUrl' of '.'"]: {
    options: { config: { ...config, baseUrl: '.' } },
    path: './src/pages/Page.ts',
    input: "import module from 'module'\nimport Component from 'components'",
    output: "import module from 'module'\nimport Component from '../components/Component'",
  },
  ['should support different working directories']: {
    options: { config: { ...config, baseUrl: './src' }, cwd: '../' },
    path: './src/pages/Page.ts',
    input: "import module from 'module'\nimport Component from 'components'",
    output: "import module from 'module'\nimport Component from '../components/Component'",
  },
  ['should support multiple imports per line']: {
    options: { config },
    path: './src/pages/Page.ts',
    input: "import module from 'module'; import Component from 'components'",
    output: "import module from 'module'; import Component from '../components/Component'",
  },
  ['should support aliased node_modules']: {
    options: {
      config: {
        ...config,
        paths: { components: ['node_modules/@lib/Component'] },
      },
    },
    path: './src/pages/Page.ts',
    input: "import module from 'module'\nimport Component from 'components'",
    output:
      "import module from 'module'\nimport Component from '../../node_modules/@lib/Component'",
  },
  ["should support different working directory with 'node_modules'"]: {
    options: {
      config: {
        ...config,
        paths: { components: ['node_modules/@lib/Component'] },
        baseUrl: './src',
      },
      cwd: '../',
    },
    path: './src/pages/Page.ts',
    input: "import module from 'module'\nimport Component from 'components'",
    output:
      "import module from 'module'\nimport Component from '../../node_modules/@lib/Component'",
  },
  ['should support file name config']: {
    options: { config: './test/test.tsconfig.json' },
    path: './src/pages/Page.ts',
    input: "import module from 'module'\nimport Component from 'components'",
    output: "import module from 'module'\nimport Component from '../components/Component'",
  },
  ['should error with no config']: {
    options: {},
    path: './src/pages/Page.ts',
    error: "Could not find a valid 'tsconfig.json'",
  },
  ["should error with no 'paths' in config"]: {
    options: { config: { ...config, paths: undefined } },
    path: './src/pages/Page.ts',
    error: "Unable to find the 'paths' property in the supplied configuration!",
  },
  ["should error with no 'path' supplied"]: {
    options: { config },
    path: undefined!,
    input: '',
    output: '',
    error: 'Received file with no path. Files must have path to be resolved.',
  },
}

const run = async (test: Test): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const input = new File({
      contents: test.input == undefined ? undefined : Buffer.from(test.input),
      path: test.path,
    })
    const stream = Readable.from([input], { objectMode: true })

    stream
      .pipe(alias(test.options))
      .on('data', (file: File) => {
        expect(file.contents?.toString()).toEqual(test.output)
      })
      .on('end', resolve)
      .on('error', reject)
  })
}

for (const [name, test] of Object.entries(tests)) {
  it(name, () => (test.error ? expect(run(test)).rejects.toThrow(test.error) : run(test)))
}
