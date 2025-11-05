/**
 * Admin API Service
 * 
 * Handles admin-only endpoints for system management and analytics.
 */

import { APIClient } from '@/lib/api-client'
import { ENDPOINTS } from '@/lib/endpoints'
import { createLogger } from '@/lib/logger'

const logger = createLogger('AdminApi')

export interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalPets: number
  totalMatches: number
  totalMessages: number
  pendingReports: number
  pendingVerifications: number
  resolvedReports: number
}

export interface AuditLogEntry {
  id: string
  adminId: string
  action: string
  targetType: string
  targetId: string
  details?: string
  timestamp: string
  ipAddress?: string
}

class AdminApiImpl {
  /**
   * Get system statistics for admin dashboard
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await APIClient.get<SystemStats>(
        ENDPOINTS.ADMIN.ANALYTICS
      )
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get system stats', err)
      // Return default stats on error
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalPets: 0,
        totalMatches: 0,
        totalMessages: 0,
        pendingReports: 0,
        pendingVerifications: 0,
        resolvedReports: 0
      }
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      await APIClient.post(
        `${ENDPOINTS.ADMIN.SETTINGS}/audit`,
        {
          ...entry,
          timestamp: new Date().toISOString()
        }
      )
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create audit log', err, { action: entry.action })
      // Don't throw - audit logging failures shouldn't break the app
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(limit: number = 100): Promise<AuditLogEntry[]> {
    try {
      const response = await APIClient.get<AuditLogEntry[]>(
        `${ENDPOINTS.ADMIN.SETTINGS}/audit?limit=${limit}`
      )
      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to get audit logs', err)
      return []
    }
  }
  /**
   * Moderate photo/content
   */
  async moderatePhoto(
    taskId: string,
    action: string,
    reason?: string
  ): Promise<void> {
    try {
      await APIClient.post(
        `${ENDPOINTS.ADMIN.SETTINGS}/moderate`,
        {
          taskId,
          action,
          reason: reason || undefined
        }
      )
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to moderate photo', err, { taskId, action })
      throw err
    }
  }
}

export const adminApi = new AdminApiImpl()

