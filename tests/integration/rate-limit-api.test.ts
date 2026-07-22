describe('Rate Limiting Logic Integration', () => {
  let rateLimitCache: Map<string, { count: number; resetTime: number }>;
  
  const ROUTE_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
    '/api/wallet/send': { windowMs: 60 * 1000, maxRequests: 5 },
    '/api/rates': { windowMs: 60 * 1000, maxRequests: 60 },
  };

  beforeEach(() => {
    jest.useFakeTimers();
    rateLimitCache = new Map();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function simulateMiddlewareAccess(pathname: string, ip: string): { status: number; retryAfter?: string } {
    if (!ROUTE_LIMITS[pathname]) return { status: 200 };

    const { windowMs, maxRequests } = ROUTE_LIMITS[pathname];
    const cacheKey = `${pathname}:${ip}`;
    const now = Date.now();
    const currentRecord = rateLimitCache.get(cacheKey);

    if (!currentRecord || now > currentRecord.resetTime) {
      rateLimitCache.set(cacheKey, { count: 1, resetTime: now + windowMs });
      return { status: 200 };
    } else {
      currentRecord.count += 1;
      if (currentRecord.count > maxRequests) {
        const secondsLeft = Math.ceil((currentRecord.resetTime - now) / 1000);
        return { status: 429, retryAfter: secondsLeft.toString() };
      }
    }
    return { status: 200 };
  }

  it('should enforce strict limit and return 429 status on costlier route', () => {
    const route = '/api/wallet/send';
    const ip = '127.0.0.1';

    for (let i = 0; i < 5; i++) {
      const res = simulateMiddlewareAccess(route, ip);
      expect(res.status).not.toBe(429);
    }

    const blockingRes = simulateMiddlewareAccess(route, ip);
    expect(blockingRes.status).toBe(429);
    expect(blockingRes.retryAfter).toBeDefined();
  });

  it('should allow more requests on less costly routes like rates lookup', () => {
    const route = '/api/rates';
    const ip = '127.0.0.1';

    for (let i = 0; i < 20; i++) {
      const res = simulateMiddlewareAccess(route, ip);
      expect(res.status).not.toBe(429);
    }
  });
});