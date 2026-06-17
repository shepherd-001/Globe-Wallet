import '@testing-library/jest-dom'

import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

if (typeof Request === 'undefined') {
  global.Request = class Request {}
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    static json(data, init) {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
      })
    }

    constructor(body, init) {
      this.body = body
      this.init = init
    }

    async json() {
      return this.body ? JSON.parse(String(this.body)) : null
    }
  }
}

if (typeof Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init) {
      this.map = new Map()
      if (init) {
        Object.entries(init).forEach(([k, v]) => this.map.set(k.toLowerCase(), v))
      }
    }

    get(key) {
      return this.map.get(key.toLowerCase()) ?? null
    }

    set(key, value) {
      this.map.set(key.toLowerCase(), value)
    }
  }
}
