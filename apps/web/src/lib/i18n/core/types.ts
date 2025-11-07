/**
 * i18n Core Types
 */

export type Language = 
  | 'en'  // English
  | 'bg'  // Bulgarian
  | 'es'  // Spanish
  | 'fr'  // French
  | 'de'  // German
  | 'ja'  // Japanese
  | 'zh'  // Chinese (Simplified)
  | 'ar'  // Arabic
  | 'hi'  // Hindi
  | 'pt'  // Portuguese
  | 'ru'  // Russian
  | 'ko'  // Korean

export interface RegionalSettings {
  language: Language
  locale: string
  currency: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  numberFormat: {
    decimalSeparator: string
    thousandsSeparator: string
  }
  rtl: boolean
}

export type TranslationKey = string

export interface TranslationModule {
  readonly [key: string]: string | TranslationModule
}

export type Translations = Record<string, TranslationModule>
