import { ConnectionProvider } from '@/providers';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <ConnectionProvider>
            <Tabs
                screenOptions={{
                    tabBarActiveTintColor: '#FF8A00',
                    headerShown: false,
                    tabBarStyle: { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' },
                }}
            >
                <Tabs.Screen
                    name="timer"
                    options={{
                        title: 'Timer',
                        tabBarIcon: ({ color }) => (
                            <FontAwesome size={28} name="clock-o" color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="schedule"
                    options={{
                        title: 'Schedule',
                        tabBarIcon: ({ color }) => (
                            <FontAwesome size={28} name="calendar" color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="admin"
                    options={{
                        title: 'Admin',
                        tabBarIcon: ({ color }) => (
                            <FontAwesome size={28} name="user-secret" color={color} />
                        ),
                    }}
                />
            </Tabs>
        </ConnectionProvider>
    );
}
