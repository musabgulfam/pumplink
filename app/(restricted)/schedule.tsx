import { api } from '@/api';
import { Button } from '@/components';
import Dial from '@/components/Dial';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AxiosError } from 'axios';
import { formatISO } from 'date-fns';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, useColorScheme, View } from 'react-native';

const ScheduleScreen = () => {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const progressText = useRef('');

    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [dateTime, setDateTime] = useState('');

    const handleSchedule = useCallback(async () => {
        if (!progressText.current || parseInt(progressText.current) <= 0) {
            Alert.alert('Error', 'Select the duration');
            return;
        }

        if (!date || !time) {
            Alert.alert('Error', 'Select the date and time');
            return;
        }

        setLoading(true);

        try {
            const token = await SecureStore.getItemAsync('authToken');
            console.log('dateTime:', dateTime);
            console.log('duration:', parseInt(progressText.current));
            const response = await api.post(
                '/schedule',
                {
                    device_id: 1,
                    start_time: dateTime,
                    duration: parseInt(progressText.current),
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            Alert.alert('Success', response.data.status);
        } catch (error: unknown) {
            if (
                error instanceof AxiosError &&
                error.response &&
                error.response.data &&
                error.response.data.error
            ) {
                Alert.alert('Error', error.response.data.error);
            } else {
                Alert.alert('Error', 'An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    }, [progressText, dateTime]);

    const handleDateChange = (event: any, selectedDate: Date | undefined) => {
        const currentDate = selectedDate || date;
        setShowPicker(false);
        setDate(currentDate);
        const mergedDateTime = new Date(currentDate);
        mergedDateTime.setHours(time.getHours());
        mergedDateTime.setMinutes(time.getMinutes());
        setDateTime(formatISO(mergedDateTime));
    };

    const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
        const currentTime = selectedTime || time;
        setShowTimePicker(false);
        setTime(currentTime);
        const mergedDateTime = new Date(date);
        mergedDateTime.setHours(currentTime.getHours());
        mergedDateTime.setMinutes(currentTime.getMinutes());
        setDateTime(formatISO(mergedDateTime));
    };

    return (
        <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? 'black' : 'white' }}>
            <View
                style={{
                    position: 'absolute',
                    top: 100,
                    left: 20,
                    borderWidth: 2,
                    borderColor: '#FF8A00',
                    padding: 10,
                    borderRadius: 12,
                }}
            >
                <Text
                    style={{
                        color: colorScheme === 'dark' ? 'white' : 'black',
                        marginBottom: 10,
                        fontSize: 18,
                    }}
                >
                    Selected Date:{' '}
                    <Text style={{ color: '#FF8A00', fontWeight: 'bold' }}>
                        {date.toDateString()}
                    </Text>
                </Text>
                <Text
                    style={{
                        color: colorScheme === 'dark' ? 'white' : 'black',
                        fontSize: 18,
                    }}
                >
                    Selected Time:{' '}
                    <Text style={{ color: '#FF8A00', fontWeight: 'bold' }}>
                        {time.toLocaleTimeString()}
                    </Text>
                </Text>
            </View>
            <Dial
                strokeColor={'#555'}
                onProgressChange={(progress) => (progressText.current = progress)}
            />
            <View style={{ paddingBottom: 20 }}>
                <View>
                    <View
                        style={{
                            justifyContent: 'space-evenly',
                            alignItems: 'center',
                            flexDirection: 'row',
                        }}
                    >
                        <Button
                            title="Select Date"
                            onPress={() => setShowPicker(true)}
                            viewStyle={{
                                width: '40%',
                                padding: 20,
                                backgroundColor: undefined,
                                borderWidth: 1,
                                borderColor: colorScheme === 'dark' ? 'white' : 'black',
                            }}
                        />
                        <Button
                            title="Select Time"
                            onPress={() => setShowTimePicker(true)}
                            viewStyle={{
                                width: '40%',
                                padding: 20,
                                backgroundColor: undefined,
                                borderWidth: 1,
                                borderColor: colorScheme === 'dark' ? 'white' : 'black',
                            }}
                        />
                    </View>
                    {loading ? (
                        <View
                            style={{
                                padding: 20,
                            }}
                        >
                            <ActivityIndicator />
                        </View>
                    ) : (
                        <View
                            style={{
                                paddingHorizontal: 20,
                                paddingTop: 20,
                            }}
                        >
                            <Button title="Schedule" onPress={handleSchedule} />
                        </View>
                    )}
                </View>
                {showPicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        accentColor="#FF8A00"
                        textColor="#FF8A00"
                    />
                )}
                {showTimePicker && (
                    <DateTimePicker
                        value={time}
                        mode="time"
                        display="spinner"
                        onChange={handleTimeChange}
                        accentColor="#FF8A00"
                        textColor="#FF8A00"
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        padding: 8,
        marginBottom: 16,
    },
});

export default ScheduleScreen;
