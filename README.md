# gulp-ts-alias ![npm](https://img.shields.io/npm/v/gulp-ts-alias)

[![Build](https://github.com/dhkatz/gulp-ts-alias/actions/workflows/node.js.yml/badge.svg)](https://github.com/dhkatz/gulp-ts-alias/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/dhkatz/gulp-ts-alias/badge.svg?branch=master)](https://coveralls.io/github/dhkatz/gulp-ts-alias?branch=master) ![npm](https://img.shields.io/npm/dm/gulp-ts-alias)

Resolve TypeScript import aliases and paths defined in `tsconfig`.

## Install

`npm install --save-dev gulp-ts-alias`

## Information

### Features

* Supports all import types: `import`, `require`, `await import()`
* Supports wild card aliases

### Motivation

There have been previous attempts at releasing Gulp plugins that accomplish something similar, but all have become unmaintained.

For legacy’s sake, here is a list of previous packages/scripts that have been considered:

[gulp-ts-paths](https://www.npmjs.com/package/gulp-ts-paths)

[path-alias-resolver](https://gist.github.com/azarus/f369ee2ab0283ba0793b0ccf0e9ec590)

**Note:** Imports within multiline comments may also be replaced.

## Usage

```javascript
const typescript = require('gulp-typescript');
const sourcemaps = require('gulp-sourcemaps');
const alias = require('gulp-ts-alias');

const { config } = typescript.createProject('tsconfig.json');

function build() {
  const compiled = src('./src/**/*.ts')
    .pipe(alias(config))
    // or .pipe(alias('tsconfig.json'))
    // or even .pipe(alias())
    .pipe(sourcemaps.init())
    .pipe(project());

  return compiled.js
    .pipe(sourcemaps.write({ sourceRoot: file => path.relative(path.join(file.cwd, file.path), file.base) }))
    .pipe(dest('build/'))
}
```

## Example

The following configuration is common in `tsconfig` configuration files

```json
{
  "rootDir": "./src",
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"]
  }
}
```

In practice, these path aliases are often used in this fashion

Input:

```typescript
import express from 'express';

import A from './file'; // Normal relative import

// Aliased import, resolves to some relative path to rootDir
import B from '@/components';
```

Output:

```typescript
import express from 'express';

import A from './file';

// gulp-ts-alias finds the correct relative path
// and replaces it before compilation
import B from '../../components';
```
