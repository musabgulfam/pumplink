import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

type ConnectionContextType = {
    socket: WebSocket | null;
    state: 'on' | 'off' | null;
    isConnected: boolean;
};

const ConnectionContext = createContext<ConnectionContextType>({
    socket: null,
    state: null,
    isConnected: false,
});

export const ConnectionProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [state, setState] = useState<'on' | 'off' | null>(null);
    const router = useRouter();

    // Helper to setup websocket
    const setupWebSocket = async () => {
        const token = await SecureStore.getItemAsync('accessToken');
        if (!token) {
            router.replace('/(auth)/login');
            return;
        }

        // Close previous socket if any
        if (socketRef.current) {
            socketRef.current.close();
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

        ws.onclose = async (msg) => {
            console.warn('[WebSocket] Closed:', msg.code, msg.reason);
            setIsConnected(false);

            if (msg.code === 1008) {
                await SecureStore.deleteItemAsync('accessToken');
                router.replace('/(auth)/login');
            }
        };
    };

    useEffect(() => {
        setupWebSocket();

        // Listen for app state changes
        const handleAppStateChange = (nextAppState: string) => {
            if (nextAppState === 'active') {
                // Reconnect if socket is closed
                if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
                    setupWebSocket();
                }
            } else if (nextAppState === 'background' || nextAppState === 'inactive') {
                // Optionally close socket when app goes to background
                if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                    socketRef.current.close();
                }
            }
        };
        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            socketRef.current?.close();
            subscription.remove();
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
