import { adminTokens, extractData } from '@/lib/api/client'

// Mock localStorage
const mockStorage: Record<string, string> = {}
const mockLocalStorage = {
  getItem: jest.fn((key: string) => mockStorage[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key]
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  }),
}

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('adminTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key])
  })

  describe('getAccessToken', () => {
    it('should return null when no token exists', () => {
      const token = adminTokens.getAccessToken()
      expect(token).toBeNull()
    })

    it('should return access token when it exists', () => {
      mockStorage['admin_access_token'] = 'test-token'
      const token = adminTokens.getAccessToken()
      expect(token).toBe('test-token')
    })
  })

  describe('getRefreshToken', () => {
    it('should return null when no token exists', () => {
      const token = adminTokens.getRefreshToken()
      expect(token).toBeNull()
    })

    it('should return refresh token when it exists', () => {
      mockStorage['admin_refresh_token'] = 'refresh-token'
      const token = adminTokens.getRefreshToken()
      expect(token).toBe('refresh-token')
    })
  })

  describe('setTokens', () => {
    it('should store access and refresh tokens', () => {
      adminTokens.setTokens('access123', 'refresh456')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('admin_access_token', 'access123')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('admin_refresh_token', 'refresh456')
    })
  })

  describe('clearTokens', () => {
    it('should remove both tokens', () => {
      mockStorage['admin_access_token'] = 'access123'
      mockStorage['admin_refresh_token'] = 'refresh456'

      adminTokens.clearTokens()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('admin_access_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('admin_refresh_token')
    })
  })
})

describe('extractData', () => {
  it('should return data when response is successful', () => {
    const response = {
      data: {
        success: true,
        data: { id: '123', name: 'Test' },
      },
    }

    const result = extractData(response)
    expect(result).toEqual({ id: '123', name: 'Test' })
  })

  it('should throw error when response is not successful', () => {
    const response = {
      data: {
        success: false,
        message: 'Something went wrong',
        data: null,
      },
    }

    expect(() => extractData(response)).toThrow('Something went wrong')
  })

  it('should throw default error message when no message provided', () => {
    const response = {
      data: {
        success: false,
        data: null,
      },
    }

    expect(() => extractData(response)).toThrow('Request failed')
  })
})
