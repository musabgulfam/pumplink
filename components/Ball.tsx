import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

const BALL_SIZE = 50;

export default function DialKnob({
    animatedStyles,
    colorScheme,
}: {
    animatedStyles: any;
    colorScheme: string | null;
}) {
    return (
        <Animated.View
            style={[
                styles.ballStyle,
                { borderColor: colorScheme === 'dark' ? 'white' : 'black' },
                animatedStyles,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    ballStyle: {
        borderWidth: 2,
        width: BALL_SIZE,
        height: BALL_SIZE,
        borderRadius: BALL_SIZE / 2,
        position: 'absolute',
        zIndex: 10,
    },
});
