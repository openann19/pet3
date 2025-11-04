/**
 * LLM Service
 * 
 * Stub replacement for window.spark.llm()
 * Returns error messages since LLM functionality is not available client-side.
 */

import { createLogger } from './logger'

const logger = createLogger('LLMService')

export interface LLMOptions {
  model?: string
  jsonMode?: boolean
}

export type LLMPrompt = string | Record<string, unknown>

class LLMService {
  /**
   * Call LLM (stub - not implemented)
   * 
   * @param prompt - The prompt to send
   * @param model - Optional model name
   * @param jsonMode - Optional JSON mode flag
   * @returns Promise that rejects with error message
   */
  async llm(prompt: LLMPrompt, model?: string, jsonMode?: boolean): Promise<string> {
    const message = 'LLM service is not available in client-side mode. Please use a backend service for AI features.'
    
    // Debug only - expected fallback behavior
    logger.debug('LLM call attempted but service is not available (expected fallback)', {
      prompt: typeof prompt === 'string' ? prompt.substring(0, 100) : 'object',
      model,
      jsonMode,
    })

    throw new Error(message)
  }

  /**
   * Call LLM with options object
   */
  async call(prompt: LLMPrompt, options?: LLMOptions): Promise<string> {
    return this.llm(prompt, options?.model, options?.jsonMode)
  }
}

// Export singleton instance
export const llmService = new LLMService()

// Compatibility layer is now handled in spark-compat.ts

