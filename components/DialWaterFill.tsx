import Animated from 'react-native-reanimated';
import { Rect } from 'react-native-svg';

export default function DialWaterFill({
    centerX,
    centerY,
    radius,
    dynamicHeight,
}: {
    centerX: number;
    centerY: number;
    radius: number;
    dynamicHeight: any;
}) {
    const WaterContainerComponent = Animated.createAnimatedComponent(Rect);
    return (
        <WaterContainerComponent
            fill={'#00BFFF'}
            x={centerX - radius}
            y={centerY - radius}
            height={100}
            width={radius * 2}
            clipPath="url(#clip)"
            transform={`rotate(180, ${centerX}, ${centerY})`}
            animatedProps={dynamicHeight}
        />
    );
}
