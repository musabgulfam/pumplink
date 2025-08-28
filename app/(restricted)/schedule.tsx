import { api } from '@/api';
import Dial from '@/components/Dial';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ScheduleScreen = () => {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const progressText = useRef('');

    const [loading, setLoading] = useState(false);

    const handleSchedule = async () => {
        if (!progressText.current) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        setLoading(true);

        try {
            const token = await SecureStore.getItemAsync('authToken');
            const response = await api.post(
                '/api/v1/schedule',
                {
                    // device_id: parseInt(deviceId, 10),
                    // start_time: startTime,
                    // duration: parseInt(duration, 10),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            Alert.alert('Success', response.data.status);
            router.back();
        } catch (error) {
            Alert.alert('Error', 'Failed to create schedule. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colorScheme === 'dark' ? 'black' : 'white' }]}>
            <View style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }}>
                <Dial
                    strokeColor={'#555'}
                    onProgressChange={(progress) => (progressText.current = progress)}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginBottom: 16,
    },
});

export default ScheduleScreen;
