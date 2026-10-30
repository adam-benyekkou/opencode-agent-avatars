# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0]

First public release.

### Added

- Portable default avatar directory. When no `directory` option is given, the
  plugin now resolves the avatar folder per platform: `%APPDATA%\opencode\avatars`
  on native Windows, `~/.config/opencode/avatars` on Unix and under WSL.
- `repository`, `homepage`, and `bugs` package metadata.
- `prepublishOnly` script so a publish run typechecks and builds first.
- CI workflow: typecheck, build, and syntax-check the built files on Linux,
  macOS, and Windows with Node 20.

### Changed

- Explicit `directory` values keep supporting `~` expansion; only the default
  changed.

### Packaging

- `dist/` is committed, so installing from GitHub
  (`opencode plugin add github:adam-benyekkou/opencode-agent-avatars`) works
  without a build step on the user's machine.

## [0.1.1]

Local iteration before public release. Not published.

[0.2.0]: https://github.com/adam-benyekkou/opencode-agent-avatars/releases/tag/v0.2.0
