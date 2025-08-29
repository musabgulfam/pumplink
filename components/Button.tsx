import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

export function Button({
    title,
    onPress,
    viewStyle,
}: {
    title: string;
    onPress: () => void;
    viewStyle?: ViewStyle;
}) {
    return (
        <TouchableOpacity
            style={[
                styles.buttonStyle,
                {
                    backgroundColor: title === 'Logout' ? '#555' : '#FF8A00',
                    shadowColor:
                        title === 'Logout' || viewStyle?.backgroundColor === '#555'
                            ? '#444'
                            : !viewStyle?.backgroundColor
                              ? undefined
                              : '#FF8A00',
                },
                viewStyle,
            ]}
            onPress={onPress}
        >
            <Text
                style={[
                    styles.buttonTextStyle,
                    {
                        fontWeight:
                            title === 'Select Date' || title === 'Select Time' ? 'normal' : 'bold',
                    },
                ]}
            >
                {title}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    buttonStyle: {
        backgroundColor: '#FF8A00',
        borderRadius: 20,
        padding: 20,
        paddingHorizontal: 40,
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.29,
        shadowRadius: 4.65,

        elevation: 7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonTextStyle: {
        color: 'white',
        fontWeight: 'bold',
    },
});
