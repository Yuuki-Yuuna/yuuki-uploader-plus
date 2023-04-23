import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { defineConfig } from 'rollup'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import esbuild from 'rollup-plugin-esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const targetDir = path.resolve(__dirname, 'packages')

if (!fs.existsSync(targetDir)) {
  throw new Error('不存在packages目录')
}

export default fs.readdirSync(targetDir).map((target) => {
  const YuDir = path.resolve(targetDir, target)
  const outDir = path.resolve(YuDir, 'dist')
  const pkg = require(path.resolve(YuDir, 'package.json'))

  const readme = path.resolve(__dirname, 'README.md') //自动维护重复的readme
  fs.copyFileSync(readme, path.resolve(YuDir, 'README.md'))

  return defineConfig({
    input: path.resolve(YuDir, 'index.ts'),
    output: {
      file: path.resolve(outDir, 'yuuki-uploader.js'),
      format: 'es'
    },
    plugins: [nodeResolve(), commonjs(), json(), esbuild()],
    external: [...Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies })]
  })
})
