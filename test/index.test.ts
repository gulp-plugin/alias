import Stream from 'event-stream';
import File from 'vinyl';

import plugin, { PluginOptions, CompilerOptions } from '../src';

interface TestCase {
  pluginOptions: PluginOptions;
  path: string | undefined;
  input: string;
  expected: string;
}

// tslint:disable-next-line:object-literal-key-quotes
const compilerOptions: CompilerOptions = { paths: { 'MyAlias': ['MyAliasFolder/MyAliasClass'] } };

const run = (test: TestCase): void => {
  const input = new File({ contents: Buffer.from(test.input), path: test.path });

  Stream.readArray([input])
    .pipe(plugin(test.pluginOptions))
    .pipe(Stream.mapSync((file: File, cb: (error: any, file?: any) => void) => {
      const contents: Buffer | NodeJS.ReadableStream | null = file.contents;

      if (contents === null) {
        return cb(null, file);
      }
    }));
};

it('should throw with no config', (done) => {
  expect(() => {
    run({
      pluginOptions: { configuration: undefined! },
      path: undefined,
      input: '',
      expected: '',
    });
  }).toThrow();

  done();
});

it('should throw with no path', (done: jest.DoneCallback) => {
  expect(() => {
    run({
      pluginOptions: { configuration: compilerOptions },
      path: undefined,
      input: '',
      expected: '',
    });
  }).toThrow();

  done();
});
