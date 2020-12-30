# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning].
This file uses change log convention from [Keep a CHANGELOG].

## [Unreleased]

## [1.3.0] - 2020-12-30
### Fixed
- Fixed resolving paths with different working directory than `tsconfig.json` (Use the new `cwd` option)
- Fixed support for multiple imports per line

## [1.2.0] - 2020-12-29
### Fixed
- Fixed paths inside comments being resolved.
- Fixed dependencies having security issues.
- Fixed typings' path in `package.json`

## [1.1.0] - 2019-08-23
### Fixed
- Fixed dependency issue and removed unused dependencies.

## [1.0.0] - 2019-08-23
### Added
- Added support for `require()` and `import()` call imports.
- Added a lot more tests to raise the coverage of the plugin.

## [0.2.1] - 2019-08-22
### Changed
- Updated testing and CI
### Fixed
- Fixed testing suite

## [0.2.0] - 2019-02-16
### Changed
- Change some types to be more restrictive
- Strip comments from compiled Javascript
### Fixed
- Fix module exporting for ES5/ES6 users by specifying `module.exports`

## [0.1.5] - 2019-01-23
### Fixed
- Fixed introduced bug

## [0.1.4] - 2019-01-23
### Changed
- Begin adding some testing

## [0.1.3] - 2019-01-23
### Removed
- Remove a `console.log` line that was used for debugging

## [0.1.2] - 2019-01-23
### Fixed
- Fix `event-stream` dependency in both `package.json` and `package-lock.json` files

## [0.1.1] - 2019-01-23
### Changed
- Lock `event-stream` to `3.3.4` under the recommendation of GitHub

## 0.1.0 - 2019-01-23
### Added
- Initial commit.

[Keep a CHANGELOG]: http://keepachangelog.com
[Semantic Versioning]: http://semver.org/

[unreleased]: https://github.com/dhkatz/gulp-ts-alias/compare/1.3.0...HEAD
[1.3.0]: https://github.com/dhkatz/gulp-ts-alias/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/dhkatz/gulp-ts-alias/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/dhkatz/gulp-ts-alias/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/dhkatz/gulp-ts-alias/compare/0.2.1...1.0.0
[0.2.1]: https://github.com/dhkatz/gulp-ts-alias/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/dhkatz/gulp-ts-alias/compare/0.1.5...0.2.0
[0.1.5]: https://github.com/dhkatz/gulp-ts-alias/compare/0.1.4...0.1.5
[0.1.4]: https://github.com/dhkatz/gulp-ts-alias/compare/0.1.3...0.1.4
[0.1.3]: https://github.com/dhkatz/gulp-ts-alias/compare/0.1.2...0.1.3
[0.1.2]: https://github.com/dhkatz/gulp-ts-alias/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/dhkatz/gulp-ts-alias/compare/0.1.0...0.1.1
