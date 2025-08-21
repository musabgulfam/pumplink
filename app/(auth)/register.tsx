import { api } from '@/api';
import { Button } from '@/components';
import { AxiosResponse } from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';

export default function Register() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const colorScheme = useColorScheme();

    return (
        <View style={[styles.container, {
            backgroundColor: colorScheme === 'dark' ? 'black' : 'white'
        }]}>
            <Text style={styles.title}>Create Account</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#aaa"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <View
                style={{
                    alignItems: 'center',
                }}
            >
                <Text style={styles.link}>
                    Already have an account?{' '}
                    <Text
                        onPress={() => router.push('/login')}
                        style={{
                            textDecorationLine: 'underline',
                            color: '#555',
                        }}
                    >
                        Register
                    </Text>
                </Text>
            </View>
            <View style={{
                marginTop: 20,
                alignItems: 'center',
            }}>
                {loading ? <ActivityIndicator /> : <Button
                    title="Register"
                    onPress={() => {
                        setLoading(true);
                        api.post('/register', { email, password })
                            .then(
                                (
                                    response: AxiosResponse<{
                                        message: string;
                                        user: {
                                            created_at: string;
                                            email: string;
                                            id: string;
                                            updated_at: string;
                                        };
                                    }>,
                                ) => {
                                    // Handle successful registration
                                    router.push('/(auth)/login');
                                    Alert.alert('Success', response.data.message);
                                },
                            )
                            .catch((error) => {
                                // Handle registration error
                                console.error(error);
                            })
                            .finally(() => {
                                setLoading(false);
                            });
                    }}
                />}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FF8A00',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        color: '#555',
    },
    input: {
        padding: 14,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#aaa',
        color: '#aaa',
        width: '100%',
    },
    link: {
        marginTop: 15,
        color: '#555',
        fontWeight: '600',
    },
});
