import { APIClient } from './api-client'
import { ENDPOINTS } from './endpoints'
import { realtime } from './realtime'
import { storage } from './storage'
import { createLogger } from './logger'
import type { User, UserRole, AuthTokens } from './contracts'
import { ENV } from '@/config/env'

interface LoginCredentials {
  email: string
  password: string
}

interface SignupCredentials extends LoginCredentials {
  displayName: string
}

const logger = createLogger('AuthService')

class AuthError extends Error {
  code: string
  timestamp: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.timestamp = new Date().toISOString()
  }
}

export class AuthService {
  private currentUser: User | null = null
  private refreshAttempted = false
  private readonly useMocks = ENV.VITE_USE_MOCKS === 'true'

  getAccessToken(): string | null {
    // Access token is stored in APIClient, not here
    return APIClient.isAuthenticated() ? 'authenticated' : null
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    // If mocks are enabled, use storage-based login
    if (this.useMocks) {
      return this.loginWithMocks(credentials)
    }

    // Use backend API for login
    try {
      const response = await APIClient.post<{ user: User; tokens: AuthTokens }>(
        ENDPOINTS.AUTH.LOGIN,
        credentials
      )

      const { user, tokens } = response.data

      // Set tokens in APIClient (access token in memory, refresh token in cookie)
      APIClient.setTokens(tokens.accessToken, tokens.refreshToken)

      // Set session
      await this.setSession(user, tokens)

      return { user, tokens }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Login failed', err)
      throw new AuthError('AUTH_001', 'Invalid credentials')
    }
  }

  /**
   * Mock login for development (when VITE_USE_MOCKS=true)
   */
  private async loginWithMocks(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const existingUsers = await storage.get<User[]>('all-users') ?? []
    const user = existingUsers.find(
      u => u.email === credentials.email && u.status === 'active'
    )

    if (!user) {
      throw new AuthError('AUTH_001', 'Invalid credentials')
    }

    // For mock mode, skip password verification
    const tokens = await this.generateTokens(user)
    await this.setSession(user, tokens)

    return { user, tokens }
  }

  async signup(credentials: SignupCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    // If mocks are enabled, use storage-based signup
    if (this.useMocks) {
      return this.signupWithMocks(credentials)
    }

    // Use backend API for signup
    try {
      const response = await APIClient.post<{ user: User; tokens: AuthTokens }>(
        ENDPOINTS.AUTH.REGISTER,
        credentials
      )

      const { user, tokens } = response.data

      // Set tokens in APIClient
      APIClient.setTokens(tokens.accessToken, tokens.refreshToken)

      // Set session
      await this.setSession(user, tokens)

      return { user, tokens }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Signup failed', err)
      
      // Check if it's an email already exists error
      if ('status' in err && (err as { status: number }).status === 409) {
        throw new AuthError('AUTH_008', 'Email already exists')
      }
      
      throw new AuthError('AUTH_001', 'Signup failed')
    }
  }

  /**
   * Mock signup for development (when VITE_USE_MOCKS=true)
   */
  private async signupWithMocks(credentials: SignupCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const existingUsers = await storage.get<User[]>('all-users') ?? []
    
    if (existingUsers.some(u => u.email === credentials.email)) {
      throw new AuthError('AUTH_008', 'Email already exists')
    }

    const { generateULID } = await import('./utils')
    const { hashPassword } = await import('./password-utils')
    const { hash, salt } = await hashPassword(credentials.password)

    const now = new Date().toISOString()
    const user: User = {
      id: generateULID(),
      email: credentials.email,
      displayName: credentials.displayName,
      roles: ['user'],
      createdAt: now,
      updatedAt: now,
      lastSeenAt: now,
      status: 'active',
      passwordHash: hash,
      passwordSalt: salt,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: {
          push: true,
          email: true,
          matches: true,
          messages: true,
          likes: true
        },
        quietHours: null
      }
    }

    existingUsers.push(user)
    await storage.set('all-users', existingUsers)

    const tokens = await this.generateTokens(user)
    await this.setSession(user, tokens)

    return { user, tokens }
  }

  /**
   * Change user password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    if (!this.currentUser) {
      throw new AuthError('AUTH_007', 'Not authenticated')
    }

    // If mocks are enabled, use storage-based password change
    if (this.useMocks) {
      const { verifyPassword, hashPassword } = await import('./password-utils')
      
      // Verify old password
      if (this.currentUser.passwordHash && this.currentUser.passwordSalt) {
        const isValid = await verifyPassword(
          oldPassword,
          this.currentUser.passwordHash,
          this.currentUser.passwordSalt
        )

        if (!isValid) {
          throw new AuthError('AUTH_001', 'Invalid current password')
        }
      }

      // Hash new password
      const { hash, salt } = await hashPassword(newPassword)

      // Update user password
      await this.updateUser({
        passwordHash: hash,
        passwordSalt: salt
      })
      return
    }

    // Use backend API for password change
    try {
      await APIClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, {
        oldPassword,
        newPassword
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Password change failed', err)
      throw new AuthError('AUTH_001', 'Password change failed')
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null
    this.refreshAttempted = false
    
    // Logout from backend (clears httpOnly cookie)
    if (!this.useMocks) {
      try {
        await APIClient.post(ENDPOINTS.AUTH.LOGOUT)
      } catch (error) {
        logger.warn('Failed to call logout endpoint', { error: error instanceof Error ? error : new Error(String(error)) })
      }
    }

    // Clear APIClient tokens
    APIClient.logout()
    
    // Disconnect realtime
    realtime.setAccessToken(null)
    realtime.disconnect()

    // Clear local storage
    await storage.delete('current-user')
  }

  async refreshTokens(): Promise<AuthTokens | null> {
    if (this.refreshAttempted) {
      return null
    }

    this.refreshAttempted = true

    try {
      // If mocks are enabled, generate new tokens locally
      if (this.useMocks) {
        if (!this.currentUser) {
          throw new Error('No user available')
        }

        const tokens = await this.generateTokens(this.currentUser)
        await this.setSession(this.currentUser, tokens)
        this.refreshAttempted = false

        return tokens
      }

      // Use backend API for token refresh (handled by APIClient)
      // The refresh happens automatically in APIClient on 401
      // We just need to check if we're still authenticated
      if (APIClient.isAuthenticated()) {
        this.refreshAttempted = false
        // Return a token object (access token is in APIClient)
        return {
          accessToken: 'refreshed', // APIClient has the actual token
          refreshToken: '', // In httpOnly cookie
          expiresIn: 900
        }
      }

      throw new Error('Token refresh failed')
    } catch {
      await this.logout()
      return null
    }
  }

  async handleUnauthorized(): Promise<boolean> {
    const tokens = await this.refreshTokens()
    return tokens !== null
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    // Only used in mock mode
    const { generateULID } = await import('./utils')
    const accessToken = `access_${generateULID()}_${user.id}`
    const refreshToken = `refresh_${generateULID()}_${user.id}`
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 900
    }
  }

  private async setSession(user: User, tokens: AuthTokens) {
    this.currentUser = user

    // Set tokens in APIClient (access token in memory, refresh token in cookie if using cookies)
    APIClient.setTokens(tokens.accessToken, tokens.refreshToken)

    // Set realtime token (this will connect WebSocket)
    realtime.setAccessToken(tokens.accessToken)

    // Cache user locally
    await storage.set('current-user', user)
  }

  async restoreSession(): Promise<User | null> {
    // If mocks are enabled, restore from storage
    if (this.useMocks) {
      const user = await storage.get<User>('current-user')
      if (user) {
        this.currentUser = user
        // Generate tokens for mock mode
        const tokens = await this.generateTokens(user)
        await this.setSession(user, tokens)
        return user
      }
      return null
    }

    // Use backend API to restore session
    try {
      const response = await APIClient.get<{ user: User }>(ENDPOINTS.AUTH.ME)
      const user = response.data.user

      this.currentUser = user
      
      // Update last seen
      const updatedUser = {
        ...user,
        lastSeenAt: new Date().toISOString()
      }
      await this.updateUser({ lastSeenAt: updatedUser.lastSeenAt })

      // Connect realtime - we need to get the token from somewhere
      // For now, we'll need to get it from the response or APIClient
      // The token should be in APIClient's memory after a successful request
      // Since we just called /auth/me, the token should be available
      // We'll need to expose a method to get it, or pass it through
      // For now, set a placeholder - the WebSocket will get the token from cookies
      if (APIClient.isAuthenticated()) {
        // The WebSocket manager will get the token from the query param or cookies
        // We can't directly access APIClient's private token, so we'll rely on cookies
        realtime.setAccessToken('authenticated') // Placeholder - WebSocket uses cookies
      }

      return user
    } catch (error) {
      // If 401, user is not authenticated
      if (error instanceof Error && 'status' in error && (error as { status: number }).status === 401) {
        return null
      }
      logger.error('Failed to restore session', { error: error instanceof Error ? error : new Error(String(error)) })
      return null
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser?.roles.includes(role) ?? false
  }

  hasPermission(_action: string, _resource: string): boolean {
    if (!this.currentUser) return false

    const hasAdminRole = this.currentUser.roles.includes('admin')
    if (hasAdminRole) return true

    return true
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No user logged in')
    }

    // If mocks are enabled, update in storage
    if (this.useMocks) {
      const updatedUser = {
        ...this.currentUser,
        ...updates,
        updatedAt: new Date().toISOString()
      }

      const allUsers = await storage.get<User[]>('all-users') ?? []
      const userIndex = allUsers.findIndex(u => u.id === updatedUser.id)
      
      if (userIndex >= 0) {
        allUsers[userIndex] = updatedUser
        await storage.set('all-users', allUsers)
      }

      this.currentUser = updatedUser
      await storage.set('current-user', updatedUser)

      return updatedUser
    }

    // Use backend API to update user
    try {
      const response = await APIClient.put<{ user: User }>(
        ENDPOINTS.USERS.UPDATE_PROFILE,
        updates
      )

      const updatedUser = response.data.user
      this.currentUser = updatedUser
      await storage.set('current-user', updatedUser)

      return updatedUser
    } catch (error) {
      logger.error('Failed to update user', { error: error instanceof Error ? error : new Error(String(error)) })
      throw error
    }
  }

  async createDemoUsers(): Promise<void> {
    const existingUsers = await storage.get<User[]>('all-users') ?? []
    
    if (existingUsers.length > 0) return

    const { generateULID } = await import('./utils')
    const now = new Date().toISOString()
    const demoUsers: User[] = [
      {
        id: generateULID(),
        email: 'user@demo.com',
        displayName: 'Demo User',
        roles: ['user'],
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
        status: 'active',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            push: true,
            email: true,
            matches: true,
            messages: true,
            likes: true
          },
          quietHours: null
        }
      },
      {
        id: generateULID(),
        email: 'moderator@demo.com',
        displayName: 'Demo Moderator',
        roles: ['user', 'moderator'],
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
        status: 'active',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            push: true,
            email: true,
            matches: true,
            messages: true,
            likes: true
          },
          quietHours: null
        }
      },
      {
        id: generateULID(),
        email: 'admin@demo.com',
        displayName: 'Demo Admin',
        roles: ['user', 'moderator', 'admin'],
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
        status: 'active',
        preferences: {
          theme: 'light',
          language: 'en',
          notifications: {
            push: true,
            email: true,
            matches: true,
            messages: true,
            likes: true
          },
          quietHours: null
        }
      }
    ]

    await storage.set('all-users', demoUsers)
  }
}

export const authService = new AuthService()
