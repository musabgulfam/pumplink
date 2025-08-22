import { Stack } from 'expo-router';
import { StatusBar, useColorScheme } from 'react-native';
import 'react-native-reanimated';

export default function RootLayout() {
    const colorScheme = useColorScheme();
    return (
        <>
            <StatusBar
                barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={colorScheme === 'dark' ? '#000' : '#fff'}
            />
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            />
        </>
    );
}
