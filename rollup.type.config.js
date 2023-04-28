import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { defineConfig } from 'rollup'
import nodeResolve from '@rollup/plugin-node-resolve'
import dts from 'rollup-plugin-dts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const typeDir = path.resolve(__dirname, 'declarations')

if (!fs.existsSync(typeDir)) {
  throw new Error('还未运行tsc')
}

export default fs.readdirSync(typeDir).map((target) => {
  const YuDir = path.resolve(__dirname, 'packages', target)
  const outDir = path.resolve(YuDir, 'dist')
  const pkg = require(path.resolve(YuDir, 'package.json'))

  return defineConfig({
    input: path.resolve(typeDir, target, 'index.d.ts'),
    output: {
      file: path.resolve(outDir, 'yuuki-uploader.d.ts')
    },
    plugins: [ nodeResolve(), dts()],
    external: [...Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies })]
  })
})
