import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Set notification handler at the top level (this is fine)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export default function Index() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Set up notification channel (must be inside useEffect)
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'notification.wav',
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF8A00',
        });

        (async () => {
            const token = await SecureStore.getItemAsync('accessToken');
            if (token) {
                router.replace('/(restricted)/timer');
            } else {
                setLoading(false);
                router.replace('/(auth)/login');
            }
        })();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={'#FF8A00'} />
            </View>
        );
    }
}
