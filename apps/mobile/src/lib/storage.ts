import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * Storage abstraction layer for mobile
 * Provides consistent interface for storing/retrieving data
 */
export const storage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key)
    } catch (error) {
      console.error(`Failed to get item from storage: ${key}`, error)
      return null
    }
  },

  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (error) {
      console.error(`Failed to set item in storage: ${key}`, error)
    }
  },

  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to remove item from storage: ${key}`, error)
    }
  },

  clear: async () => {
    try {
      await AsyncStorage.clear()
    } catch (error) {
      console.error('Failed to clear storage', error)
    }
  },
}
