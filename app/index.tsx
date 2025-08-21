import { useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const token = await SecureStore.getItemAsync('authToken');
            if (token) {
                router.replace('/(restricted)/timer');
            } else {
                setLoading(false);
                router.replace('/(auth)/login');
            }
        })();
    }, []);

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <ActivityIndicator size="large" color={'#FF8A00'} />
            </View>
        );
    }
}
