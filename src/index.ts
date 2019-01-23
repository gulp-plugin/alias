import * as path from 'path';

import * as PluginError from 'plugin-error';
import * as File from 'vinyl';

// @ts-ignore
import * as map from 'map-stream';

export interface FileData {
  path: string;
  index: number;
  import: string;
}

export interface TSConfig {
  compilerOptions: CompilerOptions;
}

export interface CompilerOptions {
  baseUrl?: string;
  paths: { [key: string]: string[] | undefined; };
}

export interface PluginOptions {
  configuration: TSConfig | CompilerOptions;
}

export type AliasPlugin = (pluginOptions: PluginOptions) => any;

function parseImports(file: string[], dir: string): FileData[] {
  const results = file.map((line: string, index: number) => {
    const imports = findImport(line);

    if (imports === null) {
      return null;
    }

    return {
      path: dir,
      index,
      import: imports,
    };
  });

  return results.filter((value: { path: string; index: number; import: string; } | null): value is FileData => {
    return value !== null && value !== undefined;
  });
}

function findImport(line: string): string | null {
  const matches = line.match(/from (["'])(.*?)\1/);

  if (!matches) {
    return null;
  }

  if (matches.length > 3) {
    throw new PluginError('gulp-ts-alias', 'Multiple imports on the same line are currently not supported!');
  }

  return matches[2];
}

function resolveImports(file: ReadonlyArray<string>, imports: FileData[], options: CompilerOptions): string[] {
  const { baseUrl, paths } = options;

  const aliases: { [key: string]: string[] | undefined } = {};
  for (const alias in paths) {
    if (!paths.hasOwnProperty(alias)) {
      continue;
    }

    let resolved = alias;
    if (alias.endsWith('/*')) {
        resolved = alias.replace('/*', '/');
    }

    aliases[resolved] = paths[alias];
  }

  const lines: string[] = [...file];
  for (const imported of imports) {
    const line = file[imported.index];

    let resolved: string = '';
    for (const alias in aliases) {
      if (!aliases.hasOwnProperty(alias)) {
        continue;
      }

      if (!imported.import.startsWith(alias)) {
        continue;
      }

      const choices: string[] | undefined = aliases[alias];

      if (choices !== undefined && choices !== null) {
        resolved = choices[0];
        if (resolved.endsWith('/*')) {
          resolved = resolved.replace('/*', '/');
        }

        resolved = imported.import.replace(alias, resolved);
      } else {
        continue;
      }

      break;
    }

    if (resolved.length < 1) {
      continue;
    }

    let relative = path.relative(path.dirname(imported.path), baseUrl || './');
    relative = path.join(relative, resolved);
    relative = path.relative(path.dirname(imported.path), path.resolve(path.dirname(imported.path), relative));
    relative = relative.replace(/\\/g, '/');

    if (relative.length === 0) {
      relative = './';
    } else if (!relative.startsWith('.')) {
      relative = './' + relative;
    }

    lines[imported.index] = line.replace(imported.import, relative);
  }

  return lines;
}

const aliasPlugin: AliasPlugin = (pluginOptions: PluginOptions) => {
  if (!pluginOptions.configuration) {
    // tslint:disable-next-line:max-line-length
    throw new PluginError('gulp-ts-alias', 'The \"configuration\" option cannot be empty. Provide the tsconfig or compilerOptions object.');
  }

  // tslint:disable-next-line:max-line-length
  const compilerOptions: CompilerOptions = (pluginOptions.configuration as TSConfig).compilerOptions || pluginOptions.configuration as CompilerOptions;

  if (!compilerOptions.paths) {
    throw new PluginError('gulp-ts-alias', 'Unable to find the \"paths\" property in the supplied configuration!');
  }

  if (compilerOptions.baseUrl === undefined || compilerOptions.baseUrl === '.') {
    compilerOptions.baseUrl = './';
  }

  return map((file: File, cb: (error: any, file?: any) => void) => {
    if (file.isNull() || !file.contents) {
      return cb(null, file);
    }

    if (file.isStream()) {
      return cb(new PluginError('gulp-ts-alias', 'Streaming is not supported.'));
    }

    const contents: Buffer | NodeJS.ReadableStream | null = file.contents;

    if (contents === null) {
      return cb(null, file);
    }

    const lines = contents.toString().split('\n');
    const imports = parseImports(lines, file.path);

    if (imports.length === 0) {
      return cb(null, file);
    }

    const resolved = resolveImports(lines, imports, compilerOptions);

    file.contents = Buffer.from(resolved.join('\n'));

    cb(null, file);
  });
};

export default aliasPlugin;

module.exports.default = aliasPlugin;
module.exports = aliasPlugin;
