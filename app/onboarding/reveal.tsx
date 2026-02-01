// app/onboarding/reveal.tsx
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { FreedomScore } from '../../src/components/FreedomScore';
import { useStore, useFreedomScore } from '../../src/store/useStore';

export default function RevealScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  
  const avatarType = useStore((state) => state.settings.avatarType);
  const completeOnboarding = useStore((state) => state.completeOnboarding);
  
  // Get real freedom calculation
  const freedom = useFreedomScore();

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleFinish = () => {
    completeOnboarding();
    router.replace('/(tabs)'); // Go to tabs, not root
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.title}>Your Freedom Score</Text>
        
        <FreedomScore 
          days={freedom.days}
          formatted={freedom.formatted}
          state={freedom.state}
          avatarType={avatarType}
          isKinged={freedom.isKinged}
        />

        <View style={styles.explanation}>
          <Text style={styles.explanationTitle}>What does this mean?</Text>
          <Text style={styles.explanationText}>
            You have <Text style={styles.highlight}>{freedom.formatted}</Text> of financial freedom.
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleFinish}>
          <Text style={styles.buttonText}>Enter Your Kingdom 👑</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Go Back & Edit</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f4c430',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  explanation: {
    backgroundColor: '#1a1f2e',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f4c430',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#a0a0a0',
    lineHeight: 20,
  },
  highlight: {
    color: '#f4c430',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#f4c430',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0e1a',
  },
  secondaryButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2f3e',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#a0a0a0',
  },
});
