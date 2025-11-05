import type { APIConfig } from '@/components/admin/APIConfigView'
import { logger } from './logger'

export async function getAPIConfig(): Promise<APIConfig | null> {
  try {
    const config = await window.spark.kv.get<APIConfig>('admin-api-config')
    return config || null
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Error fetching API config', err, { action: 'getAPIConfig' })
    return null
  }
}

export async function getMapsConfig() {
  const config = await getAPIConfig()
  return config?.maps || null
}

export async function getAIConfig() {
  const config = await getAPIConfig()
  return config?.ai || null
}

export async function getKYCConfig() {
  const config = await getAPIConfig()
  return config?.kyc || null
}

export async function getPhotoModerationConfig() {
  const config = await getAPIConfig()
  return config?.photoModeration || null
}

export async function getSMSConfig() {
  const config = await getAPIConfig()
  return config?.sms || null
}

export async function getEmailConfig() {
  const config = await getAPIConfig()
  return config?.email || null
}

export async function getStorageConfig() {
  const config = await getAPIConfig()
  return config?.storage || null
}

export async function getAnalyticsConfig() {
  const config = await getAPIConfig()
  return config?.analytics || null
}

export function isServiceEnabled(service: keyof APIConfig, config: APIConfig | null): boolean {
  if (!config) return false
  return config[service]?.enabled ?? false
}

export function getAPIKey(service: keyof APIConfig, config: APIConfig | null): string {
  if (!config) return ''
  const serviceConfig = config[service]
  if (serviceConfig && typeof serviceConfig === 'object' && 'apiKey' in serviceConfig) {
    return String(serviceConfig.apiKey ?? '')
  }
  return ''
}
