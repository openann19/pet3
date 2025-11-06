declare module 'react-native-reanimated' {
  // Minimal ambient declarations to satisfy web TS where RN types are unavailable
  export const useSharedValue: any
  export const useAnimatedStyle: any
  export const withSpring: any
  export const withTiming: any
  export const withRepeat: any
  export const withSequence: any
  export const withDelay: any
}
