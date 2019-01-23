'use strict';

const del = require('del');
const path = require('path');
const merge = require('merge2');

const { src, dest, watch, series } = require('gulp');

const typescript = require('gulp-typescript');
const tslint = require('gulp-tslint').default;
const sourcemaps = require('gulp-sourcemaps');
const jest = require('gulp-jest').default;

const project = typescript.createProject('tsconfig.json', { declaration: true });
const linter = require('tslint').Linter.createProgram('tsconfig.json');

function lint() {
  return src('./src/**/*.ts')
    .pipe(tslint({ configuration: 'tslint.json', formatter: 'verbose', program: linter }))
    .pipe(tslint.report());
}

function build() {
  del.sync(['./lib/**/*.*']);

  src('./src/**/*.json')
    .pipe(dest('lib/'));

  const compiled = src('./src/**/*.ts')
    .pipe(sourcemaps.init())
    .pipe(project());

  return merge([
    compiled.js
    .pipe(sourcemaps.write({ includeContent: false, sourceRoot: file => path.relative(path.join(file.cwd, file.path), file.base) }))
    .pipe(dest('lib/')),
    compiled.dts
    .pipe(dest('lib/'))
  ]);
}

function update() {
  watch('./src/**/*.ts', series(lint, build));
}

function test() {
  return src('./lib')
    .pipe(jest({ preprocessorIgnorePatterns: ["<rootDir>/src/", "<rootDir>/node_modules/"], automock: false, verbose: false }));
}

exports.lint = lint;
exports.build = series(lint, build);
exports.watch = series(lint, build, update);
exports.test = series(lint, build, test);
exports.default = series(lint, build);
