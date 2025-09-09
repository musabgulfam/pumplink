import { api } from '@/api';
import { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

export default function AdminScreen() {
    const colorScheme = useColorScheme();
    const [disabled, setDisabled] = useState(false);
    // TODO: Replace with dynamic device selection logic as needed
    const deviceId = 1;
    const handleForceOff = useCallback(async () => {
        const token = await SecureStore.getItemAsync('authToken');
        api.post(
            `device/${deviceId}/force-shutdown`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            },
        )
            .then((data) => {
                console.log('Success:', data);
            })
            .catch((error: unknown) => {
                if (
                    error instanceof AxiosError &&
                    error.response &&
                    error.response.data &&
                    error.response.data.error
                ) {
                    const status = error.response.status;
                    if (status === 403) {
                        setDisabled(true);
                    }
                }
                console.error('Error:', error);
            });
    }, []);
    return (
        <View
            style={[
                styles.container,
                { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' },
            ]}
        >
            <TouchableOpacity
                style={[styles.bigButton, { backgroundColor: disabled ? '#555' : '#FF8A00' }]}
                onPress={handleForceOff}
                disabled={disabled}
            >
                <Text style={styles.buttonText}>OFF</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bigButton: {
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: '#FF8A00',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#FF8A00',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    buttonText: {
        fontSize: 48,
        color: '#fff',
        fontWeight: 'bold',
        letterSpacing: 4,
    },
});
