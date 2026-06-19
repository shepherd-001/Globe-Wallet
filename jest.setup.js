import '@testing-library/jest-dom'
import { toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

const nodeRequest = global.Request || globalThis.Request
const nodeResponse = global.Response || globalThis.Response
const nodeHeaders = global.Headers || globalThis.Headers

if (typeof window !== 'undefined') {
  if (!window.Request && nodeRequest) {
    window.Request = nodeRequest
  }
  if (!window.Response && nodeResponse) {
    window.Response = nodeResponse
  }
  if (!window.Headers && nodeHeaders) {
    window.Headers = nodeHeaders
  }
}

if (!global.Request && nodeRequest) {
  global.Request = nodeRequest
}
if (!global.Response && nodeResponse) {
  global.Response = nodeResponse
}
if (!global.Headers && nodeHeaders) {
  global.Headers = nodeHeaders
}
