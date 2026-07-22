/** @jest-environment node */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(__dirname, '../..')
const envModule = pathToFileURL(resolve(root, 'lib/env.mjs')).href

function runValidation(environment: Record<string, string | undefined>) {
  const script = `import { validateEnvironment } from '${envModule}'; validateEnvironment(process.env)`
  return () => execFileSync(process.execPath, ['--input-type=module', '--eval', script], {
    cwd: root,
    env: environment,
    encoding: 'utf8',
    stdio: 'pipe',
  })
}

function validationError(environment: Record<string, string | undefined>) {
  try {
    runValidation(environment)()
    return ''
  } catch (error) {
    return String((error as { stderr?: string }).stderr ?? error)
  }
}

describe('environment validation', () => {
  const validEnvironment = {
    NEXT_PUBLIC_STELLAR_NETWORK: 'testnet',
    STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
  }

  it('accepts valid required configuration', () => {
    expect(runValidation(validEnvironment)).not.toThrow()
  })

  it('fails fast with actionable errors for missing or malformed values', () => {
    expect(validationError({ NEXT_PUBLIC_STELLAR_NETWORK: 'invalid', STELLAR_HORIZON_URL: 'not-a-url' }))
      .toMatch(/Invalid environment configuration[\s\S]*NEXT_PUBLIC_STELLAR_NETWORK[\s\S]*STELLAR_HORIZON_URL[\s\S]*\.env\.example/)
  })

  it('keeps .env.example synchronized with the schema', () => {
    expect(() => execFileSync(process.execPath, ['scripts/check-env-example.mjs'], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
    })).not.toThrow()
  })
})
