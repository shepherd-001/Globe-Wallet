import { ShellService } from '../../../lib/services/shell.service'
import { A11Y_MAIN_CONTENT_ID } from '../../../lib/a11y/pages'

describe('ShellService', () => {
  let service: ShellService

  beforeEach(() => {
    service = new ShellService()
  })

  describe('getConfig', () => {
    it('returns an AppShellConfig object', () => {
      const config = service.getConfig()
      expect(config).toHaveProperty('navItems')
      expect(config).toHaveProperty('mainContentId')
      expect(config).toHaveProperty('skipLinkLabel')
      expect(config).toHaveProperty('safeAreaEnabled')
    })

    it('safeAreaEnabled is true', () => {
      expect(service.getConfig().safeAreaEnabled).toBe(true)
    })

    it('skipLinkLabel is a non-empty string', () => {
      const { skipLinkLabel } = service.getConfig()
      expect(typeof skipLinkLabel).toBe('string')
      expect(skipLinkLabel.length).toBeGreaterThan(0)
    })
  })

  describe('getNavItems', () => {
    it('returns exactly 5 nav items', () => {
      expect(service.getNavItems()).toHaveLength(5)
    })

    it('each nav item has label, href, and iconName', () => {
      service.getNavItems().forEach((item) => {
        expect(typeof item.label).toBe('string')
        expect(item.href).toMatch(/^\//)
        expect(typeof item.iconName).toBe('string')
      })
    })

    it('includes a Home item pointing to /', () => {
      const home = service.getNavItems().find((i) => i.href === '/')
      expect(home).toBeDefined()
      expect(home?.exact).toBe(true)
    })

    it('includes Send, Cards, Savings, Profile items', () => {
      const hrefs = service.getNavItems().map((i) => i.href)
      expect(hrefs).toContain('/send')
      expect(hrefs).toContain('/cards')
      expect(hrefs).toContain('/savings')
      expect(hrefs).toContain('/profile')
    })

    it('all hrefs start with /', () => {
      service.getNavItems().forEach((item) => {
        expect(item.href.startsWith('/')).toBe(true)
      })
    })
  })

  describe('getMainContentId', () => {
    it('returns the shared A11Y_MAIN_CONTENT_ID constant', () => {
      expect(service.getMainContentId()).toBe(A11Y_MAIN_CONTENT_ID)
    })
  })

  describe('getSafeAreaInsets', () => {
    it('returns an object with all four sides', () => {
      const insets = service.getSafeAreaInsets()
      expect(insets).toHaveProperty('top')
      expect(insets).toHaveProperty('bottom')
      expect(insets).toHaveProperty('left')
      expect(insets).toHaveProperty('right')
    })

    it('each inset value is a CSS env() string', () => {
      const insets = service.getSafeAreaInsets()
      Object.values(insets).forEach((val) => {
        expect(val).toMatch(/env\(safe-area-inset-/)
      })
    })
  })
})
