import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

type ConnectionContextType = {
    socket: WebSocket | null;
    state: 'on' | 'off';
    isConnected: boolean;
};

const ConnectionContext = createContext<ConnectionContextType>({
    socket: null,
    state: 'off',
    isConnected: false,
});

export const ConnectionProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [state, setState] = useState<'on' | 'off'>('off');
    const router = useRouter();

    useEffect(() => {
        const setupWebSocket = async () => {
            const token = await SecureStore.getItemAsync('accessToken');
            if (!token) {
                router.replace('/(auth)/login');
                return;
            }

            const ws = new WebSocket('wss://pumplink-backend-production.up.railway.app/api/v1/ws');
            socketRef.current = ws;

            ws.onopen = () => {
                console.log('[WebSocket] Connected');
                setIsConnected(true);
                ws.send(token); // Send token as first message
            };

            ws.onmessage = (event) => {
                const message = event.data as 'on' | 'off';
                setState(message || 'off');
            };

            ws.onerror = (error) => {
                console.error('[WebSocket] Error:', error);
            };

            ws.onclose = (msg) => {
                console.warn('[WebSocket] Closed:', msg.code, msg.reason);
                setIsConnected(false);

                if (msg.code === 1008) {
                    SecureStore.deleteItemAsync('accessToken');
                    router.replace('/(auth)/login');
                }
            };
        };

        setupWebSocket();

        return () => {
            socketRef.current?.close();
        };
    }, []);

    return (
        <ConnectionContext.Provider
            value={{
                socket: socketRef.current,
                state,
                isConnected,
            }}
        >
            {children}
        </ConnectionContext.Provider>
    );
};

export const useConnection = () => useContext(ConnectionContext);
