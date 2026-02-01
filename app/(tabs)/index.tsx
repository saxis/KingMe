// app/index.tsx
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { FreedomScore } from '../../src/components/FreedomScore';
import { useStore, useFreedomScore } from '../../src/store/useStore';

export default function HomeScreen() {
  const router = useRouter();
  const onboardingComplete = useStore((state) => state.onboardingComplete);
  const avatarType = useStore((state) => state.settings.avatarType);
  
  // Get real freedom score
  const freedom = useFreedomScore();

  useEffect(() => {
    // Redirect to onboarding if not complete
    if (!onboardingComplete) {
      const timer = setTimeout(() => {
        router.replace('/onboarding/welcome');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onboardingComplete]);

  // Show loading while checking onboarding status
  if (!onboardingComplete) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with logo at top */}
      <View style={styles.header}>
        <Text style={styles.logo}>👑 KingMe</Text>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <FreedomScore 
          days={freedom.days}
          formatted={freedom.formatted}
          state={freedom.state}
          avatarType={avatarType}
          isKinged={freedom.isKinged}
        />
        
        <View style={styles.content}>
          <Text style={styles.subtitle}>Your path to financial freedom</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Asset Income</Text>
              <Text style={styles.statValue}>
                ${(freedom.dailyAssetIncome * 365).toLocaleString()}/yr
              </Text>
              <Text style={styles.statSubtext}>
                ${(freedom.dailyAssetIncome * 30).toFixed(0)}/mo
              </Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Needs</Text>
              <Text style={styles.statValue}>
                ${(freedom.dailyNeeds * 365).toLocaleString()}/yr
              </Text>
              <Text style={styles.statSubtext}>
                ${(freedom.dailyNeeds * 30).toFixed(0)}/mo
              </Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Current State: {freedom.state}</Text>
            <Text style={styles.infoText}>
              {freedom.days === 0 && "You have no asset income. Build income-generating assets to achieve freedom!"}
              {freedom.days > 0 && freedom.days < 30 && "You're drowning. Focus on building assets and reducing obligations."}
              {freedom.days >= 30 && freedom.days < 180 && "You're making progress! Keep building your asset income."}
              {freedom.days >= 180 && freedom.days < 730 && "You're breaking through! Your assets are starting to work for you."}
              {freedom.days >= 730 && !freedom.isKinged && "You're rising! Financial independence is near."}
              {freedom.isKinged && "You're KINGED! Your assets cover your lifestyle forever. 👑"}
            </Text>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/assets')}
            >
              <Text style={styles.actionButtonText}>📊 View Assets</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/obligations')}
            >
              <Text style={styles.actionButtonText}>💰 View Obligations</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/desires')}
            >
              <Text style={styles.actionButtonText}>🎯 Add Desire</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#f4c430',
  },
  header: {
    backgroundColor: '#0a0e1a',
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f2e',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f4c430',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1a1f2e',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4ade80',
  },
  statLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ade80',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#1a1f2e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f4c430',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  infoText: {
    fontSize: 16,
    color: '#a0a0a0',
    lineHeight: 24,
  },
  quickActions: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#1a1f2e',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a2f3e',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
});
