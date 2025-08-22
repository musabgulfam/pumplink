import { api } from '@/api';
import { Button } from '@/components';
import Dial from '@/components/Dial';
import { AxiosResponse } from 'axios';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';

export default function Timer() {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const [state, setState] = useState<'on' | 'off'>('off');
    const [isDeviceActivated, setIsDeviceActivated] = useState(false);
    const [activeUntilTime, setActiveUntilTime] = useState<Date | null>(null);
    const [remainingTime, setRemainingTime] = useState<string>('');
    const [loading, setLoading] = useState(true);
    // Countdown timer effect
    useEffect(() => {
        if (!activeUntilTime) {
            setRemainingTime('');
            setIsDeviceActivated(false);
            return;
        }
        if (activeUntilTime.getTime() > Date.now()) {
            setIsDeviceActivated(true);
        } else {
            setIsDeviceActivated(false);
            setRemainingTime('');
            return;
        }
        const interval = setInterval(() => {
            const now = new Date();
            const diff = activeUntilTime.getTime() - now.getTime();
            if (diff <= 0) {
                setRemainingTime('00:00');
                clearInterval(interval);
                setIsDeviceActivated(false);
                setActiveUntilTime(null);
                return;
            }
            const totalSeconds = Math.floor(diff / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            setRemainingTime(
                `${minutes.toString().padStart(2, '0')}:` +
                    `${seconds.toString().padStart(2, '0')}`,
            );
        }, 1000);
        return () => clearInterval(interval);
    }, [activeUntilTime]);
    // On mount, check if activeUntilTime is in the future and restore timer if needed
    useEffect(() => {
        const checkDeviceStatus = async () => {
            const token = await SecureStore.getItemAsync('authToken');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const statusRes: AxiosResponse<{
                    device_id: number;
                    status: string;
                    active_until?: string;
                }> = await api.get('/device/1/status', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (statusRes.data && statusRes.data.active_until) {
                    const untilDate = new Date(statusRes.data.active_until);
                    if (!isNaN(untilDate.getTime()) && untilDate.getTime() > Date.now()) {
                        setActiveUntilTime(untilDate);
                        setIsDeviceActivated(true);
                    }
                }
            } catch (error) {
                if ((error as any)?.response?.status === 401) {
                    await SecureStore.deleteItemAsync('authToken');
                    router.replace('/(auth)/login');
                } else {
                    console.error(error);
                }
            } finally {
                setLoading(false);
            }
        };
        checkDeviceStatus();
    }, []);
    const progressText = useRef('');

    useEffect(() => {
        let isActive = true;

        const registerToken = async () => {
            const token = await registerForPushNotificationsAsync();
            console.log('Expo push token:', token);
            if (token && isActive) {
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
        const notificationListener = Notifications.addNotificationReceivedListener((n) => {});

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

            const ws = new WebSocket(`wss://pumplink-backend-production.up.railway.app/api/v1/ws`);

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
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: '#FF8A00', fontSize: 30 }}>Loading...</Text>
                </View>
            ) : !isDeviceActivated && !activeUntilTime ? (
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
                                const duration = parseInt(progressText.current.split(' ')[0]);
                                try {
                                    // Activate device
                                    await api
                                        .post(
                                            '/activate',
                                            {
                                                device_id: 1,
                                                duration,
                                            },
                                            { headers: { Authorization: `Bearer ${token}` } },
                                        )
                                        .catch((error) => {
                                            Alert.alert('Error', error.message);
                                        });
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
                                        const untilRaw = statusRes.data.active_until;
                                        let untilDate: Date | null = null;
                                        if (untilRaw) {
                                            const d = new Date(untilRaw);
                                            if (!isNaN(d.getTime())) {
                                                untilDate = d;
                                            }
                                        }
                                        setActiveUntilTime(untilDate);
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
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Text
                        style={{
                            color: '#FF8A00',
                            fontSize: 100,
                            fontWeight: 'bold',
                            fontStyle: 'italic',
                        }}
                    >
                        {remainingTime}
                    </Text>
                </View>
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
