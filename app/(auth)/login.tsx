import { api } from '@/api';
import { Button } from '@/components';
import { AxiosResponse } from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const colorScheme = useColorScheme();
    const [loading, setLoading] = useState(false);
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
            <View
                style={{
                    alignItems: 'center',
                }}
            >
                <Text style={styles.link}>
                    Don't have an account yet?{' '}
                    <Text
                        onPress={() => router.push('/register')}
                        style={{
                            textDecorationLine: 'underline',
                            color: '#555',
                        }}
                    >
                        Register
                    </Text>
                </Text>
            </View>
            <View
                style={{
                    marginTop: 20,
                    alignItems: 'center',
                }}
            >
                {loading ? (
                    <ActivityIndicator />
                ) : (
                    <Button
                        title="Login"
                        onPress={() => {
                            setLoading(true);
                            // Normally you’d validate credentials with an API
                            api.post('/login', { email, password })
                                .then(
                                    (
                                        response: AxiosResponse<{
                                            message: string;
                                            token: string;
                                            user: {
                                                created_at: string;
                                                email: string;
                                                id: string;
                                                updated_at: string;
                                            };
                                        }>,
                                    ) => {
                                        // Handle successful login
                                        SecureStore.setItemAsync('authToken', response.data.token);
                                        router.replace('/(restricted)/timer');
                                    },
                                )
                                .catch((error) => {
                                    // Handle login error
                                    console.error(error);
                                })
                                .finally(() => {
                                    setLoading(false);
                                });
                        }}
                    />
                )}
            </View>
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
