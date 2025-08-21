import { api } from '@/api';
import { Button } from '@/components';
import { AxiosResponse } from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Register() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our cute little community</Text>

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

            <Button
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
            />

            <TouchableOpacity onPress={() => router.push('/')}>
                <Text style={styles.link}>
                    Already have an account?{' '}
                    <Text
                        style={{
                            textDecorationLine: 'underline',
                        }}
                    >
                        Login
                    </Text>
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 5,
        color: '#FF8A00',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        color: '#555',
    },
    input: {
        width: '100%',
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#555',
    },
    link: {
        marginTop: 15,
        color: '#555',
        fontWeight: '600',
    },
});
