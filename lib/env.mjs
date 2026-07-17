import { z } from 'zod'

/**
 * Runtime configuration used by server processes. Keep this list in sync with
 * .env.example; `npm run check:env` enforces that contract.
 */
export const environmentVariableNames = [
  'NEXT_PUBLIC_STELLAR_NETWORK',
  'STELLAR_HORIZON_URL',
  'NEXT_PUBLIC_APP_ENV',
  'STELLAR_NETWORK_PASSPHRASE',
  'NEXT_PUBLIC_API_BASE_URL',
  'MERGE_ANALYTICS_URL',
]

const optionalNonEmptyString = (schema) => z.preprocess(
  (value) => value === '' ? undefined : value,
  schema.optional(),
)

export const environmentSchema = z.object({
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(['testnet', 'mainnet']),
  STELLAR_HORIZON_URL: z.string().url(),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).optional(),
  STELLAR_NETWORK_PASSPHRASE: optionalNonEmptyString(z.string().min(1)),
  NEXT_PUBLIC_API_BASE_URL: optionalNonEmptyString(z.string().url()),
  MERGE_ANALYTICS_URL: optionalNonEmptyString(z.string().url()),
})

export function validateEnvironment(environment = process.env) {
  const result = environmentSchema.safeParse(environment)

  if (result.success) return result.data

  const details = result.error.issues
    .map(({ path, message }) => `  - ${path.join('.')}: ${message}`)
    .join('\n')

  throw new Error(
    `Invalid environment configuration. Fix the following values before starting Globe Wallet:\n${details}\nSee .env.example for valid values.`,
  )
}
