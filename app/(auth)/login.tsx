import { api } from '@/api';
import { Button } from '@/components';
import { AxiosResponse } from 'axios';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from 'react-native';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const colorScheme = useColorScheme();
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(true);

    // Try biometric + silent refresh on mount
    useEffect(() => {
        const tryBiometricRefresh = async () => {
            setLoading(true);
            try {
                const storedRefreshToken = await SecureStore.getItemAsync('refreshToken');
                if (!storedRefreshToken) {
                    setShowForm(true);
                    setLoading(false);
                    return;
                }
                // Prompt for biometrics
                const biometricResult = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Verify your identity to continue',
                });
                if (!biometricResult.success) {
                    setShowForm(true);
                    setLoading(false);
                    return;
                }
                // Attempt refresh
                const response = await api.post('/refresh-token', { refresh_token: storedRefreshToken });
                await SecureStore.setItemAsync('accessToken', response.data.access_token);
                router.replace('/(restricted)/timer');
            } catch (err) {
                setShowForm(true);
            } finally {
                setLoading(false);
            }
        };
        tryBiometricRefresh();
    }, [router]);

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
                },
            ]}
        >
            <Text style={styles.title}>Welcome Back 👋</Text>
            {showForm && (
                <>
                    <TextInput
                        style={[styles.input, { color: colorScheme === 'dark' ? 'white' : 'black' }]}
                        placeholder="Email"
                        placeholderTextColor="#aaa"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="off"
                    />
                    <TextInput
                        style={[styles.input, { color: colorScheme === 'dark' ? 'white' : 'black' }]}
                        placeholder="Password"
                        placeholderTextColor="#aaa"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="off"
                    />
                    <View style={{ alignItems: 'center' }}>
                        <Text style={styles.link}>
                            Don't have an account yet?{' '}
                            <Text
                                onPress={() => router.push('/register')}
                                style={{ textDecorationLine: 'underline', color: '#555' }}
                            >
                                Register
                            </Text>
                        </Text>
                    </View>
                    <View style={{ marginTop: 20, alignItems: 'center' }}>
                        {loading ? (
                            <ActivityIndicator />
                        ) : (
                            <Button
                                title="Login"
                                onPress={() => {
                                    setLoading(true);
                                    api.post('/login', { email, password })
                                        .then(
                                            async (
                                                response: AxiosResponse<{
                                                    message: string;
                                                    token: string;
                                                    refreshToken: string;
                                                    user: {
                                                        created_at: string;
                                                        email: string;
                                                        id: string;
                                                        updated_at: string;
                                                    };
                                                }>,
                                            ) => {
                                                await SecureStore.setItemAsync('accessToken', response.data.token);
                                                await SecureStore.setItemAsync('refreshToken', response.data.refreshToken);
                                                router.replace('/(restricted)/timer');
                                            },
                                        )
                                        .catch((error) => {
                                            let message = 'Login failed. Please try again.';
                                            if (error?.response?.data?.error) {
                                                message = error.response.data.error;
                                            }
                                            Alert.alert('Login Error', message);
                                            console.error(error);
                                        })
                                        .finally(() => {
                                            setLoading(false);
                                        });
                                }}
                            />
                        )}
                    </View>
                </>
            )}
            {!showForm && loading && <ActivityIndicator />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FF8A00',
        marginBottom: 20,
    },
    input: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#aaa',
        color: '#aaa',
    },
    link: {
        marginTop: 15,
        color: '#555',
        fontWeight: '600',
    },
});
