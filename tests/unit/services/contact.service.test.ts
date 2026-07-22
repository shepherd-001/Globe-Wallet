import { ContactService } from '../../../lib/services/contact.service'
import { Contact } from '../../../lib/types'
import { TEST_STELLAR_ADDRESS } from '../../../lib/fixtures'

const seed: Contact[] = [
  { id: 'c1', name: 'Adaeze Okoro', handle: '@adaeze', initials: 'AO', address: TEST_STELLAR_ADDRESS },
  { id: 'c2', name: 'James Bello', handle: '@jbello', initials: 'JB' },
  { id: 'c3', name: 'Zara Ahmed', handle: '@zaraahmed', initials: 'ZA' },
]

describe('ContactService', () => {
  let service: ContactService

  beforeEach(() => {
    service = new ContactService(seed)
  })

  describe('getContacts', () => {
    it('returns all contacts', () => {
      expect(service.getContacts()).toHaveLength(3)
    })
  })

  describe('search', () => {
    it('returns all contacts for empty query', () => {
      expect(service.search('')).toHaveLength(3)
    })

    it('returns all contacts for whitespace-only query', () => {
      expect(service.search('   ')).toHaveLength(3)
    })

    it('filters by name (case-insensitive)', () => {
      const results = service.search('adaeze')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('c1')
    })

    it('filters by handle', () => {
      const results = service.search('@jbello')
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('c2')
    })

    it('returns empty array when no match', () => {
      expect(service.search('zzznomatch')).toHaveLength(0)
    })

    it('is case-insensitive on name', () => {
      expect(service.search('ZARA')).toHaveLength(1)
    })

    it('partial match works', () => {
      expect(service.search('Bello')).toHaveLength(1)
    })
  })

  describe('getById', () => {
    it('returns contact when found', () => {
      expect(service.getById('c1')?.name).toBe('Adaeze Okoro')
    })

    it('returns undefined for unknown id', () => {
      expect(service.getById('unknown')).toBeUndefined()
    })
  })
})
