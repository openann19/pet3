import { UploadAndEditScreen } from '@mobile/components/media-editor/UploadAndEditScreen'
import { EnhancedTabNavigator } from '@mobile/navigation/EnhancedTabNavigator'
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import { useColorScheme } from 'react-native'
import { linking } from './linking'

export type RootStackParamList = {
  MainTabs: undefined
  UploadAndEdit: { onDone: (uri: string) => void; onCancel?: () => void }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export function AppNavigator(): React.JSX.Element {
  const colorScheme = useColorScheme()

  return (
    <NavigationContainer 
      linking={linking}
      theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={EnhancedTabNavigator} />
        <Stack.Screen 
          name="UploadAndEdit" 
          component={UploadAndEditScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Upload & Edit',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
