import { NextRequest } from 'next/server'

export function validateBearerToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return false
  }
  
  const [type, token] = authHeader.split(' ')
  if (type !== 'Bearer' || !token) {
    return false
  }

  return true
}
