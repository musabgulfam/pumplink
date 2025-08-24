import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Place this at the top level of your app (not inside a component)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Show notification as an alert in foreground
    shouldPlaySound: true, // Play sound if notification has one
    shouldSetBadge: true, // Set app badge count
    shouldShowBanner: true, // Show banner for notification
    shouldShowList: true, // Show notification in notification list
  }),
});

export default function Index() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const token = await SecureStore.getItemAsync('authToken');
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
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <ActivityIndicator size="large" color={'#FF8A00'} />
            </View>
        );
    }
}
