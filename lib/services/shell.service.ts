import type { IShellService, AppShellConfig, NavItem, SafeAreaInsets } from '../types'
import { A11Y_MAIN_CONTENT_ID } from '../a11y/pages'
import { getSafeAreaInsetValues } from '../a11y/safe-area'
import { BaseService } from './base.service'

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',    href: '/',        iconName: 'Home',           exact: true  },
  { label: 'Send',    href: '/send',    iconName: 'ArrowLeftRight', exact: false },
  { label: 'Cards',   href: '/cards',   iconName: 'CreditCard',     exact: false },
  { label: 'Savings', href: '/savings', iconName: 'PiggyBank',      exact: false },
  { label: 'Profile', href: '/profile', iconName: 'User',           exact: false },
]

export class ShellService extends BaseService implements IShellService {
  constructor() {
    super('ShellService')
  }

  getConfig(): AppShellConfig {
    return {
      navItems: this.getNavItems(),
      mainContentId: this.getMainContentId(),
      skipLinkLabel: 'Skip to main content',
      safeAreaEnabled: true,
    }
  }

  getNavItems(): NavItem[] {
    return NAV_ITEMS
  }

  getMainContentId(): string {
    return A11Y_MAIN_CONTENT_ID
  }

  getSafeAreaInsets(): SafeAreaInsets {
    return getSafeAreaInsetValues()
  }
}

export const shellService = new ShellService()
