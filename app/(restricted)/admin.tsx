import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminScreen() {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.bigButton}>
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
        backgroundColor: '#fff',
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