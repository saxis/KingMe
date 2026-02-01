// app/(tabs)/desires.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function DesiresScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Desires</Text>
      <Text style={styles.subtitle}>Coming soon...</Text>
      <Text style={styles.description}>
        Track your wants and let AI help you plan when to buy them.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f4c430',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#a0a0a0',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
