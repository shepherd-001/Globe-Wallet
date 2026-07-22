import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { environmentVariableNames } from '../lib/env.mjs'

const examplePath = resolve(process.cwd(), '.env.example')
const contents = readFileSync(examplePath, 'utf8')
const exampleVariableNames = [...contents.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((match) => match[1])

const schemaNames = [...environmentVariableNames].sort()
const exampleNames = [...exampleVariableNames].sort()

const missing = schemaNames.filter((name) => !exampleNames.includes(name))
const unknown = exampleNames.filter((name) => !schemaNames.includes(name))

if (missing.length || unknown.length || new Set(exampleNames).size !== exampleNames.length) {
  const problems = [
    missing.length && `missing from .env.example: ${missing.join(', ')}`,
    unknown.length && `not declared by the environment schema: ${unknown.join(', ')}`,
    new Set(exampleNames).size !== exampleNames.length && 'duplicate variables in .env.example',
  ].filter(Boolean)
  throw new Error(`Environment schema and .env.example are out of sync: ${problems.join('; ')}`)
}

console.log(`Environment example matches ${schemaNames.length} schema variables.`)
