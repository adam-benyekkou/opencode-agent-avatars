# opencode-agent-avatars

Still-image avatars for [OpenCode](https://opencode.ai) agents in the TUI.

The plugin renders the active agent's portrait in the sidebar. Each agent gets
its own image, keyed by agent id. When an image is missing, the agent's name is
drawn in its configured `color` instead, so nothing breaks.

Works on any terminal: image rendering uses Kitty graphics, then SIXEL, then a
Unicode-block fallback.

## Install

From npm:

```sh
opencode plugin add opencode-agent-avatars
```

Or straight from GitHub:

```sh
opencode plugin add github:adam-benyekkou/opencode-agent-avatars
```

The GitHub install uses the committed `dist/`, so no build step is needed on
your machine.

Options are read by the TUI part, so declare them in `~/.config/opencode/cli.json`:

```jsonc
{
  "$schema": "https://opencode.ai/v2/cli.json",
  "plugins": [
    {
      "package": "opencode-agent-avatars",
      "options": {
        "directory": "~/.config/opencode/avatars",
        "width": 20,
        "height": 10,
        "aliases": { "Warrior": "Cairne", "Shaman": "Thrall" }
      }
    }
  ]
}
```

Keep a plain string entry in `opencode.jsonc` so the server part loads and the
TUI picks up `./tui`:

```jsonc
"plugins": ["opencode-agent-avatars"]
```

In OpenCode 2.0.x, `opencode.jsonc` options are not passed to the TUI part.

## Add portraits

Create the avatar folder and drop one image per agent, named after the agent
id. The default folder depends on your platform:

| Platform | Default folder |
| --- | --- |
| Linux, macOS | `~/.config/opencode/avatars` |
| Windows (native) | `%APPDATA%\opencode\avatars` |
| WSL | `~/.config/opencode/avatars` (behaves like Unix) |

Native Windows has no `~/.config`, so the default follows `%APPDATA%`
(`C:\Users\<you>\AppData\Roaming`) and falls back to `~/AppData/Roaming` if that
variable is unset. OpenCode recommends WSL on Windows; under WSL the Unix
default applies. Set the `directory` option to point anywhere else.

```
~/.config/opencode/avatars/
├── Warrior.png
├── Shaman.png
├── Hunter.png
├── Paladin.png
├── Peon.png
└── Warlock.png
```

Supported formats: `png`, `jpg`, `jpeg`, `webp`, `gif` (first frame).

Lookup order for an agent id:

1. Explicit `avatars` map entry.
2. Exact id (`Warrior.png`).
3. Lowercase id (`warrior.png`).
4. Kebab-case id (`cairne-bloodhoof.png` from `CairneBloodhoof`).

## Aliases

The label under the portrait defaults to the agent's configured name, such as
`Warrior` or `Shaman`. Use `aliases` to show a character name instead:

```jsonc
"aliases": {
  "Warrior": "Cairne",
  "Shaman": "Thrall",
  "Hunter": "Rexxar",
  "Paladin": "Uther",
  "Warlock": "Gul'dan"
}
```

Keys match the agent id (case-insensitive). Agents without an alias keep their
configured name.

## Options

| Option | Type | Default | Meaning |
| --- | --- | --- | --- |
| `directory` | string | per OS (see [Add portraits](#add-portraits)) | Folder scanned for `<agent>.<ext>`. |
| `avatars` | object | `{}` | Explicit map: `{ "Warrior": "/path/cairne.png" }`. |
| `aliases` | object | `{}` | Display names: `{ "Warrior": "Cairne" }`. Falls back to the agent name. |
| `mode` | `"active"` \| `"all"` | `"active"` | Active agent only, or every primary agent. |
| `width` | number | `20` | Image width in terminal cells. |
| `height` | number | `10` | Image height in terminal cells. |
| `fit` | `"fit"` \| `"cover"` \| `"fill"` | `"cover"` | Image scaling. |
| `protocol` | `"auto"` \| `"kitty"` \| `"sixel"` \| `"blocks"` | `"auto"` | Rendering protocol. |
| `slot` | `"sidebar.content"` \| `"sidebar.footer"` \| `"session.composer.top"` | `"sidebar.content"` | Where the avatar renders. |
| `label` | boolean | `true` | Show the agent name under the image. |

## Terminal support

| Terminal | Best protocol |
| --- | --- |
| Ghostty, Kitty, WezTerm | Kitty graphics |
| Konsole, foot, xterm, Windows Terminal | SIXEL |
| Anything else | Unicode blocks (portable, lower fidelity) |

`"protocol": "auto"` picks the best available. To force one, set it explicitly.
The environment variable `OPENTUI_IMAGE_PROTOCOL` also sets a global default.

## How it works

- Registers a contribution to a TUI slot (`sidebar.content` by default).
- Reads the session's current agent from `SessionInfo.agent`.
- Resolves the agent's color and display name from the agent catalogue, then
  applies `aliases` when one matches.
- Renders `<image>` (OpenTUI `ImageRenderable`) inside a rounded border using
  the agent's configured `color`, otherwise a rounded box with the agent's
  initials in the same color.

## Artwork and licensing

The plugin ships **no** character artwork. You supply your own images. Do not
commit third-party copyrighted art to a public repository unless you have the
right to redistribute it.

## Development

```sh
npm install
npm run build      # dist/index.js + dist/tui.js
npm run typecheck  # tsc --noEmit
```

## License

MIT
