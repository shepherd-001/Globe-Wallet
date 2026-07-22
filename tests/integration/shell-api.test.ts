/** @jest-environment node */
/**
 * Integration test: GET /api/shell (Issue #16)
 * Validates shell config API shape and nav item contract.
 */
import { GET } from '../../app/api/shell/route'

describe('GET /api/shell', () => {
  it('returns 200 with success:true', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('response includes a config object', async () => {
    const { config } = await GET().then((r) => r.json())
    expect(config).toBeDefined()
  })

  it('config.mainContentId is "main-content"', async () => {
    const { config } = await GET().then((r) => r.json())
    expect(config.mainContentId).toBe('main-content')
  })

  it('config.safeAreaEnabled is true', async () => {
    const { config } = await GET().then((r) => r.json())
    expect(config.safeAreaEnabled).toBe(true)
  })

  it('config.skipLinkLabel is a non-empty string', async () => {
    const { config } = await GET().then((r) => r.json())
    expect(typeof config.skipLinkLabel).toBe('string')
    expect(config.skipLinkLabel.length).toBeGreaterThan(0)
  })

  it('config.navItems is an array of 5', async () => {
    const { config } = await GET().then((r) => r.json())
    expect(Array.isArray(config.navItems)).toBe(true)
    expect(config.navItems).toHaveLength(5)
  })

  it('each navItem has label, href, iconName fields', async () => {
    const { config } = await GET().then((r) => r.json())
    config.navItems.forEach((item: Record<string, unknown>) => {
      expect(typeof item.label).toBe('string')
      expect(typeof item.href).toBe('string')
      expect((item.href as string).startsWith('/')).toBe(true)
      expect(typeof item.iconName).toBe('string')
    })
  })

  it('navItems include Home (/) Send (/send) Profile (/profile)', async () => {
    const { config } = await GET().then((r) => r.json())
    const hrefs = config.navItems.map((i: { href: string }) => i.href)
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/send')
    expect(hrefs).toContain('/profile')
  })

  it('Home navItem has exact:true', async () => {
    const { config } = await GET().then((r) => r.json())
    const home = config.navItems.find((i: { href: string }) => i.href === '/')
    expect(home?.exact).toBe(true)
  })
})
