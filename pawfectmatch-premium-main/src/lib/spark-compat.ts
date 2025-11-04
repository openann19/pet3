/**
 * Spark Compatibility Layer
 * 
 * Initializes window.spark API compatibility shims for migration.
 * This ensures any remaining direct window.spark calls work with our new services.
 */

import { storage } from './storage'
import { userService } from './user-service'
import { llmService } from './llm-service'

if (typeof window !== 'undefined') {
  // Initialize window.spark if it doesn't exist
  if (!(window as any).spark) {
    (window as any).spark = {}
  }

  // Expose KV storage
  if (!(window as any).spark.kv) {
    (window as any).spark.kv = {
      get: (key: string) => storage.get(key),
      set: (key: string, value: any) => storage.set(key, value),
      delete: (key: string) => storage.delete(key),
      keys: () => storage.keys(),
    }
  }

  // Expose user service
  if (!(window as any).spark.user) {
    (window as any).spark.user = () => userService.user()
  }

  // Expose LLM service
  if (!(window as any).spark.llm) {
    (window as any).spark.llm = (prompt: string | any, model?: string, jsonMode?: boolean) => 
      llmService.llm(prompt, model, jsonMode)
  }

  // Expose llmPrompt template tag
  if (!(window as any).spark.llmPrompt) {
    (window as any).spark.llmPrompt = (strings: TemplateStringsArray, ...values: any[]) => {
      return strings.reduce((result, str, i) => {
        return result + str + (values[i] ?? '')
      }, '')
    }
  }
}

