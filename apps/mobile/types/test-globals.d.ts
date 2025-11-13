import 'vitest'
import 'vitest/globals'
import type { React } from 'react'

declare global {
  namespace NodeJS {
    interface Timeout {
      ref(): Timeout
      unref(): Timeout
      hasRef(): boolean
    }
  }
}

export {}
