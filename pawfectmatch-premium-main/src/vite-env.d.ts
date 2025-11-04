/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

interface UserInfo {
  avatarUrl: string
  email: string
  id: string
  isOwner: boolean
  login: string
}

interface SparkKV {
  keys: () => Promise<string[]>
  get: <T>(key: string) => Promise<T | undefined>
  set: <T>(key: string, value: T) => Promise<void>
  delete: (key: string) => Promise<void>
}

interface Spark {
  llmPrompt: {
    (strings: TemplateStringsArray, ...values: any[]): string
    (strings: string[], ...values: any[]): string
  }
  llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>
  user: () => Promise<UserInfo>
  kv: SparkKV
}

declare global {
  interface Window {
    spark: Spark
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
    cancelIdleCallback?: (id: number) => void
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string
          scope: string
          redirectURI: string
          usePopup: boolean
        }) => Promise<void>
        signIn: () => Promise<{ authorization?: unknown }>
      }
    }
  }
  
  // Using var is the correct TypeScript syntax for declaring global variables
  // eslint-disable-next-line no-var
  var spark: Spark
}

export {}