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

import { Plugin } from "@opencode/plugin/tui"
import { For, Show, createMemo } from "solid-js"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { join, resolve } from "node:path"

type Fit = "fit" | "cover" | "fill"
type Protocol = "auto" | "kitty" | "sixel" | "blocks"
type Mode = "active" | "all"
type SlotPath = "sidebar.content" | "sidebar.footer" | "session.composer.top"

type AgentView = {
  readonly id: string
  readonly name: string
  readonly color: string
}

type AvatarOptions = {
  readonly directory: string
  readonly width: number
  readonly height: number
  readonly fit: Fit
  readonly protocol: Protocol
  readonly showLabel: boolean
  readonly overrides: Record<string, string>
  readonly aliases: Record<string, string>
}

const EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"]

function expandHome(value: string): string {
  if (value === "~") return homedir()
  if (value.startsWith("~/")) return join(homedir(), value.slice(2))
  return value
}

function defaultDirectory(): string {
  if (process.platform === "win32") {
    return join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "opencode", "avatars")
  }
  return join(homedir(), ".config", "opencode", "avatars")
}

function candidateNames(agentID: string): string[] {
  return [
    ...new Set([
      agentID,
      agentID.toLowerCase(),
      agentID.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(),
    ]),
  ]
}

function findAvatar(options: AvatarOptions, agentID: string): string | undefined {
  const override = options.overrides[agentID] ?? options.overrides[agentID.toLowerCase()]
  if (override) {
    const path = resolve(expandHome(override))
    if (existsSync(path)) return path
  }

  for (const name of candidateNames(agentID)) {
    for (const extension of EXTENSIONS) {
      const path = resolve(options.directory, `${name}.${extension}`)
      if (existsSync(path)) return path
    }
  }
  return undefined
}

function initials(value: string): string {
  const parts = value.replace(/[_-]+/g, " ").split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
}

function Avatar(props: { readonly agent: AgentView; readonly options: AvatarOptions }) {
  const source = createMemo(() => findAvatar(props.options, props.agent.id))
  return (
    <box flexDirection="column" alignItems="center" paddingTop={1}>
      <Show
        when={source()}
        fallback={
          <box border borderStyle="rounded" borderColor={props.agent.color} paddingLeft={1} paddingRight={1}>
            <text fg={props.agent.color}>{initials(props.agent.name)}</text>
          </box>
        }
      >
        {(path: () => string) => (
          <box border borderStyle="rounded" borderColor={props.agent.color}>
            <image
              source={path()}
              fit={props.options.fit}
              protocol={props.options.protocol}
              style={{ width: props.options.width, height: props.options.height }}
            />
          </box>
        )}
      </Show>
      <Show when={props.options.showLabel}>
        <text fg={props.agent.color}>{props.agent.name}</text>
      </Show>
    </box>
  )
}

export default Plugin.define({
  id: "agent-avatars",
  async setup(context) {
    const raw = context.options ?? {}

    const options: AvatarOptions = {
      directory: resolve(expandHome(String(raw.directory ?? defaultDirectory()))),
      width: Math.max(4, Number(raw.width ?? 20) | 0),
      height: Math.max(2, Number(raw.height ?? 10) | 0),
      fit: String(raw.fit ?? "cover") as Fit,
      protocol: String(raw.protocol ?? "auto") as Protocol,
      showLabel: raw.label !== false,
      overrides: (raw.avatars ?? {}) as Record<string, string>,
      aliases: (raw.aliases ?? {}) as Record<string, string>,
    }
    const mode = String(raw.mode ?? "active") as Mode
    const slot = String(raw.slot ?? "sidebar.content") as SlotPath

    const location = context.location ?? context.data.location.default()
    await context.data.location.agent.sync(location).catch(() => undefined)

    const aliasMap = new Map(
      Object.entries(options.aliases).map(([key, value]) => [key.toLowerCase(), value]),
    )

    const agentView = (id: string): AgentView => {
      const info = (context.data.location.agent.list(location) ?? []).find((agent) => agent.id === id)
      const alias = aliasMap.get(id.toLowerCase())
      return {
        id,
        name: alias ?? info?.name ?? id,
        color: info?.color ?? "#C79C6E",
      }
    }

    context.ui.slot({
      append: slot,
      render: ({ sessionID }) => {
        if (mode === "all") {
          const agents = createMemo(() =>
            (context.data.location.agent.list(location) ?? [])
              .filter((agent) => agent.mode !== "subagent")
              .map((agent) => agentView(agent.id)),
          )
          return (
            <box flexDirection="column">
              <For each={agents()}>{(agent: AgentView) => <Avatar agent={agent} options={options} />}</For>
            </box>
          )
        }

        const current = createMemo(() => {
          const session = context.data.session.get(sessionID)
          if (session?.agent) return agentView(session.agent)
          const agents = context.data.location.agent.list(location) ?? []
          const primary = agents.find((agent) => agent.mode === "primary")
          return agentView(primary?.id ?? "default")
        })

        return (
          <Show when={current()} fallback={null}>
            {(agent: () => AgentView) => <Avatar agent={agent()} options={options} />}
          </Show>
        )
      },
    })
  },
})
