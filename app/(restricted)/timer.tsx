import { api } from '@/api';
import { Button } from '@/components';
import Dial from '@/components/Dial';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, useColorScheme, View } from 'react-native';

export default function Timer() {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const progressText = useRef('');

    const sendPushTokenToBackend = useCallback(
        async (expoPushToken: string) => {
            try {
                const token = await SecureStore.getItemAsync('accessToken');
                if (!token) return;
                await api.post(
                    '/register-push-token',
                    { token: expoPushToken },
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                console.log('Push token registered successfully');
            } catch (error) {
                console.error('Failed to register push token:', error);
                await SecureStore.deleteItemAsync('accessToken');
                await SecureStore.deleteItemAsync('refreshToken');
                router.replace('/(auth)/login');
            }
        },
        [router],
    );

    const registerToken = useCallback(async () => {
        let isActive = true;
        const token = await registerForPushNotificationsAsync();
        console.log('Expo push token:', token);
        if (token && isActive) {
            try {
                await sendPushTokenToBackend(token);
            } catch (error: any) {
                if (error?.response?.status === 401) {
                    await SecureStore.deleteItemAsync('accessToken');
                    router.replace('/(auth)/login');
                } else {
                    console.error(error);
                }
            }
        }
    }, [sendPushTokenToBackend, router]);

    useEffect(() => {
        console.log('Registering push token...');
        registerToken();

        // Notification listeners
        const notificationListener = Notifications.addNotificationReceivedListener((n) => {});

        const responseListener = Notifications.addNotificationResponseReceivedListener((r) => {
            console.log('Notification response:', r);
        });

        return () => {
            notificationListener.remove();
            responseListener.remove();
        };
    }, [registerToken]);

    return (
        <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? 'black' : 'white' }}>
            <View
                style={{
                    flex: 1,
                }}
            >
                <Dial
                    strokeColor={'#FF8A00'}
                    onProgressChange={(progress) => (progressText.current = progress)}
                />
            </View>
            <View style={styles.buttonContainer}>
                {loading ? (
                    <View
                        style={{
                            width: '40%',
                            padding: 20,
                        }}
                    >
                        <ActivityIndicator />
                    </View>
                ) : (
                    <Button
                        title="GO"
                        onPress={async () => {
                            const token = await SecureStore.getItemAsync('accessToken');
                            if (!token) {
                                return;
                            }
                            setLoading(true);
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
                                    .then(() => {
                                        Alert.alert('Success', 'Device activated successfully');
                                    })
                                    .catch(async (error) => {
                                        if (error?.response?.status === 401) {
                                            await SecureStore.deleteItemAsync('accessToken');
                                            router.replace('/(auth)/login');
                                        } else {
                                            console.error(error);
                                        }
                                    })
                                    .finally(() => {
                                        setLoading(false);
                                    });
                            } catch (error: any) {
                                if (error?.response?.status === 401) {
                                    await SecureStore.deleteItemAsync('accessToken');
                                    router.replace('/(auth)/login');
                                } else {
                                    console.error(error);
                                }
                            }
                        }}
                        viewStyle={{ width: '40%', padding: 20 }}
                    />
                )}
                <Button
                    title="Logout"
                    onPress={async () => {
                        await SecureStore.deleteItemAsync('accessToken');
                        await SecureStore.deleteItemAsync('refreshToken');
                        router.replace('/(auth)/login');
                    }}
                    viewStyle={{ width: '40%', padding: 20 }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    buttonContainer: {
        justifyContent: 'space-evenly',
        alignItems: 'flex-end',
        paddingBottom: 20,
        flexDirection: 'row',
        alignContent: 'flex-end',
    },
});

// Move this function inside the Timer component to use the router instance directly

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
    } catch (e) {
        console.error('Error getting push token:', e);
    }

    return token;
}
