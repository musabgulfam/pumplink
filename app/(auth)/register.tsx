import { api } from '@/api';
import { Button } from '@/components';
import { FontAwesome } from '@expo/vector-icons';
import { AxiosResponse } from 'axios';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

export default function Register() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const colorScheme = useColorScheme();
    const [visible, setVisible] = useState(false);
    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: colorScheme === 'dark' ? 'black' : 'white',
                },
            ]}
        >
            <Text style={styles.title}>Create Account</Text>
            <TextInput
                style={[styles.input, { color: colorScheme === 'dark' ? 'white' : 'black' }]}
                placeholder="Email"
                placeholderTextColor="#aaa"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
            />

            <View style={styles.passwordContainer}>
                <TextInput
                    style={{ flex: 1, color: colorScheme === 'dark' ? 'white' : 'black' }}
                    placeholder="Password"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!visible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="off"
                />
                <TouchableOpacity onPress={() => setVisible((v) => !v)}>
                    <FontAwesome name={visible ? 'eye' : 'eye-slash'} size={24} color="#888" />
                </TouchableOpacity>
            </View>

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
                        Login
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
                                    let message = 'Registration failed. Please try again.';
                                    if (error?.response?.data?.error) {
                                        message = error.response.data.error;
                                    }
                                    Alert.alert('Registration Error', message);
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#aaa',
        color: '#aaa',
    },
});
