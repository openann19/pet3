import { generateCorrelationId } from './utils'
import { createLogger } from './logger'

const logger = createLogger('offline-sync')

export type SyncAction = 
  | 'create_pet'
  | 'update_pet'
  | 'like_pet'
  | 'pass_pet'
  | 'send_message'
  | 'create_story'
  | 'react_to_message'
  | 'update_profile'
  | 'upload_photo'

export interface PendingSyncAction {
  id: string
  action: SyncAction
  data: unknown
  timestamp: string
  retries: number
  maxRetries: number
  correlationId: string
  status: 'pending' | 'syncing' | 'failed' | 'completed'
  error?: string
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingActions: number
  lastSyncTime?: string
  failedActions: number
}

class OfflineSyncManager {
  private isOnline: boolean = navigator.onLine
  private isSyncing: boolean = false
  private syncQueue: PendingSyncAction[] = []
  private listeners: Set<(status: SyncStatus) => void> = new Set()

  constructor() {
    this.initializeEventListeners()
    this.loadQueueFromStorage()
  }

  private initializeEventListeners() {
    window.addEventListener('online', () => {
      logger.info('Online - starting sync')
      this.isOnline = true
      this.notifyListeners()
      this.syncPendingActions()
    })

    window.addEventListener('offline', () => {
      logger.info('Offline - queuing future actions')
      this.isOnline = false
      this.notifyListeners()
    })
  }

  private async loadQueueFromStorage() {
    try {
      const stored = await window.spark.kv.get<PendingSyncAction[]>('offline-sync-queue')
      if (stored && Array.isArray(stored)) {
        this.syncQueue = stored
        logger.info('Loaded pending actions from storage', { count: this.syncQueue.length })
        
        if (this.isOnline && this.syncQueue.length > 0) {
          this.syncPendingActions()
        }
      }
    } catch (error) {
      logger.error('Failed to load queue from storage', error instanceof Error ? error : new Error(String(error)))
    }
  }

  private async saveQueueToStorage() {
    try {
      await window.spark.kv.set('offline-sync-queue', this.syncQueue)
    } catch (error) {
      logger.error('Failed to save queue to storage', error instanceof Error ? error : new Error(String(error)))
    }
  }

  async queueAction(action: SyncAction, data: unknown): Promise<string> {
    const pendingAction: PendingSyncAction = {
      id: generateCorrelationId(),
      action,
      data,
      timestamp: new Date().toISOString(),
      retries: 0,
      maxRetries: 3,
      correlationId: generateCorrelationId(),
      status: 'pending'
    }

    this.syncQueue.push(pendingAction)
    await this.saveQueueToStorage()
    this.notifyListeners()

    logger.debug('Queued action', { action, actionId: pendingAction.id })

    if (this.isOnline) {
      this.syncPendingActions()
    }

    return pendingAction.id
  }

  private async syncPendingActions() {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return
    }

    this.isSyncing = true
    this.notifyListeners()

    logger.info('Starting sync', { actionCount: this.syncQueue.length })

    const actionsToSync = this.syncQueue.filter(a => a.status === 'pending' || a.status === 'failed')

    for (const action of actionsToSync) {
      if (!this.isOnline) {
        logger.info('Went offline during sync, pausing')
        break
      }

      try {
        action.status = 'syncing'
        await this.executeAction(action)
        action.status = 'completed'
        logger.debug('Completed action', { action: action.action, actionId: action.id })
        
        this.syncQueue = this.syncQueue.filter(a => a.id !== action.id)
      } catch (error) {
        action.retries++
        
        if (action.retries >= action.maxRetries) {
          action.status = 'failed'
          action.error = error instanceof Error ? error.message : 'Unknown error'
          logger.error('Action failed after max retries', error instanceof Error ? error : new Error(String(error)), { action: action.action, actionId: action.id })
        } else {
          action.status = 'pending'
          logger.warn('Action failed, will retry', { action: action.action, actionId: action.id, retries: action.retries, maxRetries: action.maxRetries })
        }
      }
    }

    await this.saveQueueToStorage()
    this.isSyncing = false
    this.notifyListeners()

    await window.spark.kv.set('last-sync-time', new Date().toISOString())

    logger.info('Sync completed', { remaining: this.syncQueue.length })
  }

  private async executeAction(action: PendingSyncAction): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    switch (action.action) {
      case 'send_message':
        logger.debug('Executing: send_message', { actionId: action.id })
        break
      case 'like_pet':
        logger.debug('Executing: like_pet', { actionId: action.id })
        break
      case 'pass_pet':
        logger.debug('Executing: pass_pet', { actionId: action.id })
        break
      case 'create_story':
        logger.debug('Executing: create_story', { actionId: action.id })
        break
      case 'create_pet':
        logger.debug('Executing: create_pet', { actionId: action.id })
        break
      case 'update_pet':
        logger.debug('Executing: update_pet', { actionId: action.id })
        break
      case 'react_to_message':
        logger.debug('Executing: react_to_message', { actionId: action.id })
        break
      case 'update_profile':
        logger.debug('Executing: update_profile', { actionId: action.id })
        break
      case 'upload_photo':
        logger.debug('Executing: upload_photo', { actionId: action.id })
        break
      default:
        throw new Error(`Unknown action type: ${action.action}`)
    }
  }

  getStatus(): SyncStatus {
    const failedActions = this.syncQueue.filter(a => a.status === 'failed').length                                                                              
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingActions: this.syncQueue.length,
      failedActions,
    }
  }

  async getLastSyncTime(): Promise<string | undefined> {
    return await window.spark.kv.get<string>('last-sync-time')
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    const status = this.getStatus()
    this.listeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        logger.error('Error in listener', error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  async retryFailedActions(): Promise<void> {
    const failedActions = this.syncQueue.filter(a => a.status === 'failed')
    failedActions.forEach(action => {
      action.status = 'pending'
      action.retries = 0
      delete action.error
    })

    await this.saveQueueToStorage()
    this.notifyListeners()

    if (this.isOnline) {
      this.syncPendingActions()
    }
  }

  async clearFailedActions(): Promise<void> {
    this.syncQueue = this.syncQueue.filter(a => a.status !== 'failed')
    await this.saveQueueToStorage()
    this.notifyListeners()
  }

  async clearAllActions(): Promise<void> {
    this.syncQueue = []
    await this.saveQueueToStorage()
    this.notifyListeners()
  }

  getPendingActions(): PendingSyncAction[] {
    return [...this.syncQueue]
  }

  getFailedActions(): PendingSyncAction[] {
    return this.syncQueue.filter(a => a.status === 'failed')
  }
}

let syncManagerInstance: OfflineSyncManager | null = null

export function getOfflineSyncManager(): OfflineSyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new OfflineSyncManager()
  }
  return syncManagerInstance
}

export async function queueOfflineAction(action: SyncAction, data: unknown): Promise<string> {
  return getOfflineSyncManager().queueAction(action, data)
}

export function getSyncStatus(): SyncStatus {
  return getOfflineSyncManager().getStatus()
}

export function subscribeToSyncStatus(listener: (status: SyncStatus) => void): () => void {
  return getOfflineSyncManager().subscribe(listener)
}
