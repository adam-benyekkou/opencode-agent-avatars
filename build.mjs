import { transformAsync } from "@babel/core"
import ts from "@babel/preset-typescript"
import solid from "babel-preset-solid"
import { mkdir, readFile, writeFile } from "node:fs/promises"

const targets = [
  { source: "./src/index.ts", output: "./dist/index.js", solid: false },
  { source: "./src/tui.tsx", output: "./dist/tui.js", solid: true },
]

await mkdir(new URL("./dist", import.meta.url), { recursive: true })

for (const target of targets) {
  const source = await readFile(new URL(target.source, import.meta.url), "utf8")

  const result = await transformAsync(source, {
    filename: target.source,
    configFile: false,
    babelrc: false,
    presets: [
      ...(target.solid
        ? [[solid, { moduleName: "@opentui/solid", generate: "universal" }]]
        : []),
      [ts, { allExtensions: true, isTSX: true }],
    ],
  })

  if (!result?.code) throw new Error(`Babel produced no output for ${target.source}`)

  await writeFile(new URL(target.output, import.meta.url), `${result.code}\n`)
  console.log(`built ${target.output}`)
}
