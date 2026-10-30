import { insertNode as _$insertNode } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { createComponent as _$createComponent } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
/**
 * opencode-agent-avatars — TUI plugin
 *
 * Renders a still-image portrait for the active OpenCode agent inside the
 * terminal UI. Images come from a directory you control, keyed by agent id.
 * When no image exists, the agent name is drawn in the agent's configured
 * color instead, so the plugin degrades quietly on any terminal.
 *
 * Protocol: "auto" uses Kitty graphics, then SIXEL, then Unicode blocks.
 * It is not tied to one terminal.
 */

import { Plugin } from "@opencode/plugin/tui";
import { For, Show, createMemo } from "solid-js";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
const EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"];
function expandHome(value) {
  if (value === "~") return homedir();
  if (value.startsWith("~/")) return join(homedir(), value.slice(2));
  return value;
}
function defaultDirectory() {
  if (process.platform === "win32") {
    return join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "opencode", "avatars");
  }
  return join(homedir(), ".config", "opencode", "avatars");
}
function candidateNames(agentID) {
  return [...new Set([agentID, agentID.toLowerCase(), agentID.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()])];
}
function findAvatar(options, agentID) {
  const override = options.overrides[agentID] ?? options.overrides[agentID.toLowerCase()];
  if (override) {
    const path = resolve(expandHome(override));
    if (existsSync(path)) return path;
  }
  for (const name of candidateNames(agentID)) {
    for (const extension of EXTENSIONS) {
      const path = resolve(options.directory, `${name}.${extension}`);
      if (existsSync(path)) return path;
    }
  }
  return undefined;
}
function initials(value) {
  const parts = value.replace(/[_-]+/g, " ").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
function Avatar(props) {
  const source = createMemo(() => findAvatar(props.options, props.agent.id));
  return (() => {
    var _el$ = _$createElement("box");
    _$setProp(_el$, "flexDirection", "column");
    _$setProp(_el$, "alignItems", "center");
    _$setProp(_el$, "paddingTop", 1);
    _$insert(_el$, _$createComponent(Show, {
      get when() {
        return source();
      },
      get fallback() {
        return (() => {
          var _el$3 = _$createElement("box"),
            _el$4 = _$createElement("text");
          _$insertNode(_el$3, _el$4);
          _$setProp(_el$3, "border", true);
          _$setProp(_el$3, "borderStyle", "rounded");
          _$setProp(_el$3, "paddingLeft", 1);
          _$setProp(_el$3, "paddingRight", 1);
          _$insert(_el$4, () => initials(props.agent.name));
          _$effect(_p$ => {
            var _v$ = props.agent.color,
              _v$2 = props.agent.color;
            _v$ !== _p$.e && (_p$.e = _$setProp(_el$3, "borderColor", _v$, _p$.e));
            _v$2 !== _p$.t && (_p$.t = _$setProp(_el$4, "fg", _v$2, _p$.t));
            return _p$;
          }, {
            e: undefined,
            t: undefined
          });
          return _el$3;
        })();
      },
      children: path => (() => {
        var _el$5 = _$createElement("box"),
          _el$6 = _$createElement("image");
        _$insertNode(_el$5, _el$6);
        _$setProp(_el$5, "border", true);
        _$setProp(_el$5, "borderStyle", "rounded");
        _$effect(_p$ => {
          var _v$3 = props.agent.color,
            _v$4 = path(),
            _v$5 = props.options.fit,
            _v$6 = props.options.protocol,
            _v$7 = {
              width: props.options.width,
              height: props.options.height
            };
          _v$3 !== _p$.e && (_p$.e = _$setProp(_el$5, "borderColor", _v$3, _p$.e));
          _v$4 !== _p$.t && (_p$.t = _$setProp(_el$6, "source", _v$4, _p$.t));
          _v$5 !== _p$.a && (_p$.a = _$setProp(_el$6, "fit", _v$5, _p$.a));
          _v$6 !== _p$.o && (_p$.o = _$setProp(_el$6, "protocol", _v$6, _p$.o));
          _v$7 !== _p$.i && (_p$.i = _$setProp(_el$6, "style", _v$7, _p$.i));
          return _p$;
        }, {
          e: undefined,
          t: undefined,
          a: undefined,
          o: undefined,
          i: undefined
        });
        return _el$5;
      })()
    }), null);
    _$insert(_el$, _$createComponent(Show, {
      get when() {
        return props.options.showLabel;
      },
      get children() {
        var _el$2 = _$createElement("text");
        _$insert(_el$2, () => props.agent.name);
        _$effect(_$p => _$setProp(_el$2, "fg", props.agent.color, _$p));
        return _el$2;
      }
    }), null);
    return _el$;
  })();
}
export default Plugin.define({
  id: "agent-avatars",
  async setup(context) {
    const raw = context.options ?? {};
    const options = {
      directory: resolve(expandHome(String(raw.directory ?? defaultDirectory()))),
      width: Math.max(4, Number(raw.width ?? 20) | 0),
      height: Math.max(2, Number(raw.height ?? 10) | 0),
      fit: String(raw.fit ?? "cover"),
      protocol: String(raw.protocol ?? "auto"),
      showLabel: raw.label !== false,
      overrides: raw.avatars ?? {},
      aliases: raw.aliases ?? {}
    };
    const mode = String(raw.mode ?? "active");
    const slot = String(raw.slot ?? "sidebar.content");
    const location = context.location ?? context.data.location.default();
    await context.data.location.agent.sync(location).catch(() => undefined);
    const aliasMap = new Map(Object.entries(options.aliases).map(([key, value]) => [key.toLowerCase(), value]));
    const agentView = id => {
      const info = (context.data.location.agent.list(location) ?? []).find(agent => agent.id === id);
      const alias = aliasMap.get(id.toLowerCase());
      return {
        id,
        name: alias ?? info?.name ?? id,
        color: info?.color ?? "#C79C6E"
      };
    };
    context.ui.slot({
      append: slot,
      render: ({
        sessionID
      }) => {
        if (mode === "all") {
          const agents = createMemo(() => (context.data.location.agent.list(location) ?? []).filter(agent => agent.mode !== "subagent").map(agent => agentView(agent.id)));
          return (() => {
            var _el$7 = _$createElement("box");
            _$setProp(_el$7, "flexDirection", "column");
            _$insert(_el$7, _$createComponent(For, {
              get each() {
                return agents();
              },
              children: agent => _$createComponent(Avatar, {
                agent: agent,
                options: options
              })
            }));
            return _el$7;
          })();
        }
        const current = createMemo(() => {
          const session = context.data.session.get(sessionID);
          if (session?.agent) return agentView(session.agent);
          const agents = context.data.location.agent.list(location) ?? [];
          const primary = agents.find(agent => agent.mode === "primary");
          return agentView(primary?.id ?? "default");
        });
        return _$createComponent(Show, {
          get when() {
            return current();
          },
          fallback: null,
          children: agent => _$createComponent(Avatar, {
            get agent() {
              return agent();
            },
            options: options
          })
        });
      }
    });
  }
});
