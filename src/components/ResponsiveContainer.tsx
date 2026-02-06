import { View, StyleSheet, useWindowDimensions } from 'react-native';

export function ResponsiveContainer({ children, style }: any) {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;
  
  return (
    <View style={[
      styles.container,
      isWeb && styles.webContainer,
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webContainer: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
});