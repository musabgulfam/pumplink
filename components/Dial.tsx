import { useConnection } from '@/providers';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Dimensions, StyleSheet, useColorScheme, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    interpolate,
    runOnJS,
    useAnimatedProps,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
} from 'react-native-reanimated';
import { cartesian2Canvas, ReText } from 'react-native-redash';
import Svg, { Circle, ClipPath, Defs } from 'react-native-svg';
import Ball from './Ball';
import DialLabels from './DialLabels';

const { width, height } = Dimensions.get('window');

const BALL_SIZE = 50;

const CIRCLE_LENGTH = 1000;

const RADIUS = CIRCLE_LENGTH / (2 * Math.PI);

const CENTER_X = width / 2;

const CENTER_Y = height / 2;

// Adjust the AnimatedCircle definition to ensure compatibility with animatedProps
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function Dial({
    strokeColor,
    onProgressChange,
}: {
    strokeColor: string;
    onProgressChange: (progress: string) => void;
}) {
    const { state, isConnected } = useConnection();

    const colorScheme = useColorScheme();

    const ANGLES_DEGREES: number[] = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];

    const progress = useSharedValue(0);
    const translationX = useSharedValue(
        cartesian2Canvas({ x: -25, y: 0 }, { x: CENTER_X, y: CENTER_Y }).x,
    );
    const translationY = useSharedValue(
        cartesian2Canvas({ x: 0, y: RADIUS + 25 }, { x: CENTER_X, y: CENTER_Y }).y,
    );
    const prevTranslationX = useSharedValue(
        cartesian2Canvas({ x: 0, y: 0 }, { x: CENTER_X, y: CENTER_Y }).x,
    );
    const prevTranslationY = useSharedValue(
        cartesian2Canvas({ x: 0, y: 0 }, { x: CENTER_X, y: CENTER_Y }).y,
    );
    const prevTriggerredAngle = useSharedValue(0);

    // Replace direct access to shared values with derived values
    const derivedTranslationX = useDerivedValue(() => translationX.value);
    const derivedTranslationY = useDerivedValue(() => translationY.value);
    const derivedProgress = useDerivedValue(() => progress.value);
    const derivedPrevTriggerredAngle = useDerivedValue(() => prevTriggerredAngle.value);

    // Update animated styles and logic to use derived values
    const animatedStyles = useAnimatedStyle(() => ({
        transform: [
            { translateX: derivedTranslationX.value },
            { translateY: derivedTranslationY.value },
        ],
    }));

    // Update progressText to use derivedProgress
    const progressText = useDerivedValue(() => {
        let _progress = Math.floor(derivedProgress.value);
        const text = `${(_progress / 10).toFixed(0)} ${Math.floor(_progress / 10) < 2 ? 'minute' : 'minutes'}`;
        runOnJS(onProgressChange)(text);
        return text;
    });

    // Function to trigger haptics safely
    function triggerHaptic() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const pan = Gesture.Pan()
        .minDistance(1)
        .minPointers(1)
        .maxPointers(1)
        .shouldCancelWhenOutside(true)
        .onStart(() => {
            prevTranslationX.value = derivedTranslationX.value;
            prevTranslationY.value = derivedTranslationY.value;
        })
        .onUpdate((event) => {
            const deltaX = event.translationX + prevTranslationX.value - CENTER_X;
            const deltaY = event.translationY + prevTranslationY.value - CENTER_Y;

            let angle = Math.atan2(deltaY, deltaX);
            let angleDeg = ((angle * 180) / Math.PI + 90 + 360) % 360;

            if (angleDeg > 300) return;

            progress.value = angleDeg;

            if (Math.abs(angleDeg - derivedPrevTriggerredAngle.value) >= 20) {
                runOnJS(triggerHaptic)();
                prevTriggerredAngle.value = angleDeg;
            }

            const newX = CENTER_X + RADIUS * Math.cos(angle);
            const newY = CENTER_Y + RADIUS * Math.sin(angle);

            translationX.value = newX - 25;
            translationY.value = newY - 25;
        });

    // Use a shared value to store the stroke offset and derive animatedProps from it
    const strokeOffset = useSharedValue(CIRCLE_LENGTH);

    // Replace direct access to shared values in render phase
    const derivedStrokeDasharray = useDerivedValue(() => strokeOffset.value);

    // Update the strokeOffset shared value whenever progress changes
    useDerivedValue(() => {
        strokeOffset.value = CIRCLE_LENGTH * (1 - progress.value / 360);
    });

    const waterLevel = useDerivedValue(() => Math.max(1, progress.value), [progress]);

    const dynamicHeight = useAnimatedProps(() => ({
        height: interpolate(waterLevel.value, [1, 330], [1, RADIUS * 2]),
    }));

    return (
        <GestureHandlerRootView>
            <DialLabels
                angles={ANGLES_DEGREES}
                radius={RADIUS}
                centerX={CENTER_X}
                centerY={CENTER_Y}
                colorScheme={colorScheme ?? 'white'}
            />
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    left: cartesian2Canvas(
                        { x: -0.5 * width * 0.6, y: 0 },
                        { x: CENTER_X, y: CENTER_Y },
                    ).x,
                    top: cartesian2Canvas({ x: 0, y: 0.5 * 60 }, { x: CENTER_X, y: CENTER_Y }).y,
                    width: width * 0.6,
                    height: 60,
                    elevation: 200,
                }}
            >
                {state && isConnected && (
                    <MaterialIcons
                        name="fiber-manual-record"
                        size={30}
                        color={state === 'on' ? 'green' : 'red'}
                        style={{
                            textShadowColor: state === 'on' ? '#00ff00' : '#ff0000',
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 10,
                            margin: 5,
                        }}
                    />
                )}
                {(!isConnected || !state) && (
                    <ActivityIndicator
                        style={{
                            margin: 10,
                        }}
                    />
                )}
                <ReText
                    style={{
                        ...styles.animatedButtonTextStyle,
                        color: colorScheme === 'dark' ? 'white' : 'black',
                        justifyContent: 'center',
                    }}
                    text={progressText}
                />
            </View>
            <GestureDetector gesture={pan}>
                <Svg>
                    <AnimatedCircle
                        cx={CENTER_X}
                        cy={CENTER_Y}
                        stroke={strokeColor}
                        strokeWidth={50}
                        r={RADIUS}
                        fill={'none'}
                        strokeDasharray={CIRCLE_LENGTH}
                        strokeLinecap={'round'}
                        transform={`rotate(271, ${CENTER_X}, ${CENTER_Y})`}
                        animatedProps={useAnimatedProps(() => ({
                            strokeDashoffset: derivedStrokeDasharray.value,
                        }))}
                    />
                    <Ball animatedStyles={animatedStyles} colorScheme={colorScheme ?? 'white'} />
                    <Defs>
                        <ClipPath id="clip">
                            <Circle cx={CENTER_X} cy={CENTER_Y} r={RADIUS - 25} />
                        </ClipPath>
                    </Defs>
                    <Circle
                        cx={CENTER_X}
                        cy={CENTER_Y}
                        r={RADIUS - 25}
                        fill={'none'}
                        strokeWidth={2}
                        stroke={colorScheme === 'dark' ? 'white' : 'black'}
                    />
                    <Circle
                        cx={CENTER_X}
                        cy={CENTER_Y}
                        r={RADIUS + 25}
                        fill={'none'}
                        strokeWidth={2}
                        stroke={colorScheme === 'dark' ? 'white' : 'black'}
                    />
                    {/* <DialWaterFill
                            centerX={CENTER_X}
                            centerY={CENTER_Y}
                            radius={RADIUS}
                            dynamicHeight={dynamicHeight}
                        /> */}
                </Svg>
            </GestureDetector>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ballStyle: {
        borderColor: 'white',
        borderWidth: 2,
        width: BALL_SIZE,
        height: BALL_SIZE,
        borderRadius: BALL_SIZE / 2,
    },
    buttonStyle: {
        position: 'absolute',
        top: CENTER_Y,
        width: 170,
        height: 70,
        left: CENTER_X - 170 / 2,
        borderWidth: 3,
        borderRadius: 30,
        zIndex: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    animatedButtonTextStyle: {
        fontSize: 30,
        textAlign: 'center',
    },
    dialContainer: {
        borderWidth: 1,
        height,
        width,
    },
    buttonContainerStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20,
    },
});
