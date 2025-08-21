import { Text, View } from 'react-native';
import { cartesian2Canvas } from 'react-native-redash';

export default function DialLabels({
    angles,
    radius,
    centerX,
    centerY,
    colorScheme,
}: {
    angles: number[];
    radius: number;
    centerX: number;
    centerY: number;
    colorScheme: string | null;
}) {
    return (
        <>
            {angles.map((angle) => (
                <View
                    key={angle}
                    style={{
                        position: 'absolute',
                        top: cartesian2Canvas(
                            { x: 0, y: radius * Math.cos((angle * 10 * Math.PI) / 180) + 10 },
                            { x: centerX, y: centerY },
                        ).y,
                        left: cartesian2Canvas(
                            { x: radius * Math.sin((angle * 10 * Math.PI) / 180) - 10, y: 0 },
                            { x: angle === 0 ? centerX + 5 : centerX, y: centerY },
                        ).x,
                        zIndex: 2,
                    }}
                >
                    <Text
                        style={{
                            color: colorScheme === 'dark' ? 'white' : 'black',
                            textAlign: 'center',
                        }}
                    >
                        {angle}
                    </Text>
                </View>
            ))}
        </>
    );
}
