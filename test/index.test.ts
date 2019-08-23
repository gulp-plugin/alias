import ObjectStream, { EnteredArgs } from 'o-stream';
import File from 'vinyl';

import plugin, { PluginOptions, CompilerOptions } from '../src';

interface TestCase {
  pluginOptions: PluginOptions;
  path: string | undefined;
  input: string;
  expected: string;
}

// tslint:disable-next-line:object-literal-key-quotes
const compilerOptions: CompilerOptions = { paths: { 'MyAlias': ['MyAliasFolder/MyAliasClass'] }, baseUrl: './src' };

const run = async (test: TestCase): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    const input = new File({ contents: test.input == null ? null : Buffer.from(test.input), path: test.path });
    const stream = ObjectStream.fromArray([input]);

    stream
      .pipe(plugin(test.pluginOptions))
      .pipe(ObjectStream.transform({
        onEntered: (args: EnteredArgs<File, void>) => {
          try {
            expect(args.object.contents ? args.object.contents.toString() : args.object.contents).toEqual(test.expected);
          } catch (error) {
            reject(error);
          }
        },
        onEnded: () => { resolve(); },
      })).on('error', (error: Error) => reject(error));
  });
};

it('should work with compilerOptions', async () => {
  return run({
    pluginOptions: { configuration: compilerOptions },
    path: './src/FileFolder/InnerFileFolder/File.ts',
    input: `
import A from "./asdf";
import B from "./MyAlias";
import C from "MyAlias";
import D from "express";
`,
    expected: `
import A from "./asdf";
import B from "./MyAlias";
import C from "../../MyAliasFolder/MyAliasClass";
import D from "express";
`
  });
});

it('should work with tsconfig', async () => {
  return run({
    pluginOptions: { configuration: { compilerOptions } },
    path: './src/FileFolder/InnerFileFolder/File.ts',
    input: `
import A from "./asdf";
import B from "./MyAlias";
import C from "MyAlias";
`,
    expected: `
import A from "./asdf";
import B from "./MyAlias";
import C from "../../MyAliasFolder/MyAliasClass";
`
  });
});

it('should work with no baseUrl', async () => {
  return run({
    pluginOptions: { configuration: { paths: { 'MyAlias': ['MyAliasFolder/MyAliasClass'] } } },
    path: './src/FileFolder/InnerFileFolder/File.ts',
    input: `
import A from "./asdf";
import B from "./MyAlias";
import C from "MyAlias";
`,
    expected: `
import A from "./asdf";
import B from "./MyAlias";
import C from "../../../MyAliasFolder/MyAliasClass";
`
  });
});

it('should support dynamic imports', async () => {
  return run({
    pluginOptions: { configuration: compilerOptions },
    path: './src/FileFolder/InnerFileFolder/File.ts',
    input: `
import("MyAlias").then(test => test());
`,
    expected: `
import("../../MyAliasFolder/MyAliasClass").then(test => test());
`
  });
});

it('should support require imports', async () => {
  return run({
    pluginOptions: { configuration: compilerOptions },
    path: './src/FileFolder/InnerFileFolder/File.ts',
    input: `
const A = require("./asdf");
const B = require("./MyAlias");
const C = require("MyAlias");
`,
    expected: `
const A = require("./asdf");
const B = require("./MyAlias");
const C = require("../../MyAliasFolder/MyAliasClass");
`
  });
});

it('should pass files with no import aliases', async () => {
  return run({
    pluginOptions: { configuration: compilerOptions },
    path: './src/FileFolder/InnerFileFolder/File.ts',
    input: `
const A = require("./asdf");
const B = require("./MyAlias");
const C = require("test");
`,
    expected: `
const A = require("./asdf");
const B = require("./MyAlias");
const C = require("test");
`
  });
});

it('should pass empty files', async () => {
  return run({
    pluginOptions: { configuration: compilerOptions },
    path: './src/FileFolder/InnerFileFolder/File.ts',
    input: '',
    expected: ''
  });
});

it('should pass null files', async () => {
  return run({
    pluginOptions: { configuration: compilerOptions },
    path: './src/FileFolder/InnerFileFolder/File.ts',
    input: null,
    expected: null
  });
});

it('should throw with multiple imports on one line', async () => {
  return expect(run({
    pluginOptions: { configuration: { compilerOptions } },
    path: './src/FileFolder/InnerFileFolder/File.ts',
    input: `
import A from "./asdf"; import B from "./MyAlias";
import C from "MyAlias";
`,
    expected: ''
  })).rejects.toThrow();
});

it('should throw with no config', async () => {
  await expect(run({
    pluginOptions: { configuration: undefined! },
    path: undefined,
    input: '',
    expected: '',
  })).rejects.toThrow();
});

it('should throw with no path', async () => {
  await expect(run({
    pluginOptions: { configuration: compilerOptions },
    path: undefined,
    input: '',
    expected: '',
  })).rejects.toThrow()
});

it('should throw with no paths in compilerOptions', async () => {
  await expect(run({
    pluginOptions: { configuration: { paths: undefined! } },
    path: './src/FileFolder/InnerFileFolder/File.ts',
    input: '',
    expected: '',
  })).rejects.toThrow()
});
