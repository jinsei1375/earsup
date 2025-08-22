import { Text, View, TextProps, ViewProps } from 'react-native';
import { APP_COLORS } from './FeatureIcon';

// Styled Text Component
interface AppTextProps extends TextProps {
  color?: keyof typeof APP_COLORS;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({ color, style, children, ...props }) => {
  const colorValue = color ? APP_COLORS[color] : undefined;

  return (
    <Text style={[colorValue ? { color: colorValue } : {}, style]} {...props}>
      {children}
    </Text>
  );
};

// Styled View Component
interface AppViewProps extends ViewProps {
  backgroundColor?: keyof typeof APP_COLORS;
  borderColor?: keyof typeof APP_COLORS;
  children?: React.ReactNode;
}

export const AppView: React.FC<AppViewProps> = ({
  backgroundColor,
  borderColor,
  style,
  children,
  ...props
}) => {
  const bgColor = backgroundColor ? APP_COLORS[backgroundColor] : undefined;
  const bColor = borderColor ? APP_COLORS[borderColor] : undefined;

  return (
    <View
      style={[
        bgColor ? { backgroundColor: bgColor } : {},
        bColor ? { borderColor: bColor } : {},
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};
