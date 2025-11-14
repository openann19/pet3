/**
 * React Native type augmentations
 * Fixes missing type exports and StyleSheet properties
 */

import 'react-native'

declare module 'react-native' {
  // Ensure these are properly exported
  export const Pressable: React.ComponentType<any>
  export const Modal: React.ComponentType<any>
  export const TouchableOpacity: React.ComponentType<any>
  export const ActivityIndicator: React.ComponentType<any>

  namespace StyleSheet {
    /**
     * A very thin line used as a border or divider.
     * Typically 0.5px on most devices.
     */
    export const hairlineWidth: number

    /**
     * A style object that positions an element absolutely
     * and fills its parent container.
     */
    export const absoluteFill: {
      position: 'absolute'
      left: 0
      right: 0
      top: 0
      bottom: 0
    }

    /**
     * A style object that positions an element absolutely
     * and fills its parent container, with a number type.
     */
    export const absoluteFillObject: {
      position: 'absolute'
      left: number
      right: number
      top: number
      bottom: number
    }
  }
}

