import { api } from '@/api';
import { Button } from '@/components';
import Dial from '@/components/Dial';
import { AxiosResponse } from 'axios';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function Timer() {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const [state, setState] = useState<'on' | 'off'>('off');
    const [isDeviceActivated, setIsDeviceActivated] = useState(false);
    const [activeUntilTime, setActiveUntilTime] = useState<Date | null>(null);
    const progressText = useRef('');

    const [expoPushToken, setExpoPushToken] = useState<string>('');
    const [notification, setNotification] = useState<Notifications.Notification | undefined>();

    useEffect(() => {
        let isActive = true;

        const registerToken = async () => {
            const token = await registerForPushNotificationsAsync();
            console.log('Expo push token:', token);
            if (token && isActive) {
                setExpoPushToken(token);
                try {
                    await sendPushTokenToBackend(token);
                } catch (error: any) {
                    if (error?.response?.status === 401) {
                        await SecureStore.deleteItemAsync('authToken');
                        router.replace('/(auth)/login');
                    } else {
                        console.error(error);
                    }
                }
            }
        };
        console.log('Registering push token...');
        registerToken();

        // Notification listeners
        const notificationListener = Notifications.addNotificationReceivedListener((n) => {
            if (isActive) setNotification(n);
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener((r) => {
            console.log('Notification response:', r);
        });

        return () => {
            isActive = false;
            notificationListener.remove();
            responseListener.remove();
        };
    }, []);

    useEffect(() => {
        const setupWebSocket = async () => {
            const token = await SecureStore.getItemAsync('authToken');
            if (!token) {
                router.replace('/(auth)/login');
                return;
            }

            const ws = new WebSocket(
                `ws://${Platform.OS === 'android' ? '10.0.2.2:8080' : 'localhost:8080'}/api/v1/ws`,
            );

            ws.onopen = () => {
                console.log('WebSocket connected!');
                ws.send(token);
            };

            ws.onmessage = (event: { data: 'on' | 'off' }) => {
                setState(event.data || 'off');
            };

            ws.onerror = (error) => console.error('WebSocket error:', error);

            ws.onclose = (msg) => {
                console.log('WebSocket closed:', msg.code, msg.reason);
                if (msg.code === 1008) {
                    SecureStore.deleteItemAsync('authToken');
                    router.replace('/(auth)/login');
                }
            };
        };

        setupWebSocket();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? 'black' : 'white' }}>
            {!isDeviceActivated && !activeUntilTime ? (
                <>
                    <Dial
                        state={state}
                        onProgressChange={(progress) => (progressText.current = progress)}
                    />
                    <View style={styles.buttonContainer}>
                        <Button
                            title="GO"
                            onPress={async () => {
                                const token = await SecureStore.getItemAsync('authToken');
                                if (!token) return;
                                console.log('Activating device with token:', token);
                                const duration = parseInt(progressText.current.split(' ')[0]);
                                console.log(duration);
                                try {
                                    // Activate device
                                    await api.post(
                                        '/activate',
                                        {
                                            device_id: 1,
                                            duration,
                                        },
                                        { headers: { Authorization: `Bearer ${token}` } },
                                    );
                                    setIsDeviceActivated(true);
                                    // Fetch device status
                                    const statusRes: AxiosResponse<{
                                        device_id: number;
                                        status: string;
                                        active_until?: string;
                                    }> = await api.get('/device/1/status', {
                                        headers: { Authorization: `Bearer ${token}` },
                                    });
                                    if (statusRes.data) {
                                        setActiveUntilTime(
                                            new Date(statusRes.data.active_until ?? '') || null,
                                        );
                                    }
                                } catch (error: any) {
                                    if (error?.response?.status === 401) {
                                        await SecureStore.deleteItemAsync('authToken');
                                        router.replace('/(auth)/login');
                                    } else {
                                        console.error(error);
                                    }
                                }
                            }}
                            viewStyle={{ width: '40%', padding: 20 }}
                        />
                        <Button
                            title="Logout"
                            onPress={async () => {
                                await SecureStore.deleteItemAsync('authToken');
                                router.replace('/(auth)/login');
                            }}
                            viewStyle={{ width: '40%', padding: 20 }}
                        />
                    </View>
                </>
            ) : (
                <Text>{activeUntilTime?.toString()}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingBottom: 20,
        flexDirection: 'row',
    },
});

async function sendPushTokenToBackend(expoPushToken: string) {
    console.log('Sending push token to backend:', expoPushToken);
    try {
        console.log('Sending push token to backend:', expoPushToken);
        const token = await SecureStore.getItemAsync('authToken');
        if (!token) return;

        await api.post(
            '/register-push-token',
            { token: expoPushToken },
            { headers: { Authorization: `Bearer ${token}` } },
        );

        console.log('Push token registered successfully');
    } catch (error) {
        console.error('Failed to register push token:', error);
    }
}

async function registerForPushNotificationsAsync() {
    console.log('Registering for push notifications...');
    let token;
    if (Platform.OS === 'android') {
        console.log('Setting up Android notification channel...');
        await Notifications.setNotificationChannelAsync('myNotificationChannel', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        })
            .then(() => {
                console.log('Android notification channel set up.');
            })
            .catch((error) => {
                console.error('Error setting up Android notification channel:', error);
            });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    console.log('Final notification status:', finalStatus);
    if (finalStatus !== 'granted') {
        alert('Failed to get push token!');
        return;
    }

    try {
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) throw new Error('Project ID not found');

        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Expo push token:', token);
    } catch (e) {
        console.error('Error getting push token:', e);
    }

    return token;
}
