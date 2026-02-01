// app/(tabs)/profile.tsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useStore, useFreedomScore } from '../../src/store/useStore';
import { WalletConnect } from '../../src/components/WalletConnect';

export default function ProfileScreen() {
  const income = useStore((state) => state.income);
  const avatarType = useStore((state) => state.settings.avatarType);
  const assets = useStore((state) => state.assets);
  const obligations = useStore((state) => state.obligations);
  const resetStore = useStore((state) => state.resetStore);
  
  const freedom = useFreedomScore();

  const handleResetOnboarding = () => {
    if (confirm('Are you sure? This will clear all your data.')) {
      resetStore();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        {/* Wallet Connection */}
        <View style={styles.section}>
          <WalletConnect />
        </View>

        {/* Income Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Income</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Annual Salary</Text>
              <Text style={styles.value}>${income.salary.toLocaleString()}</Text>
            </View>
            {income.otherIncome > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Other Income</Text>
                <Text style={styles.value}>${income.otherIncome.toLocaleString()}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={styles.label}>Asset Income (Annual)</Text>
              <Text style={styles.valueGreen}>${(freedom.dailyAssetIncome * 365).toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.labelBold}>Total Annual Income</Text>
              <Text style={styles.valueBold}>
                ${(income.salary + income.otherIncome + (freedom.dailyAssetIncome * 365)).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Freedom Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Freedom Stats</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Freedom Days</Text>
              <Text style={styles.valueBold}>{freedom.formatted}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Current State</Text>
              <Text style={styles.value}>{freedom.state}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Assets</Text>
              <Text style={styles.value}>{assets.length}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Obligations</Text>
              <Text style={styles.value}>{obligations.length}</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Avatar</Text>
              <Text style={styles.value}>
                {avatarType === 'male-medium' ? 'Male' : 'Female'}
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleResetOnboarding}
          >
            <Text style={styles.dangerButtonText}>Reset All Data</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f4c430',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1a1f2e',
    padding: 16,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  labelBold: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
    color: '#ffffff',
  },
  valueGreen: {
    fontSize: 16,
    color: '#4ade80',
    fontWeight: '600',
  },
  valueBold: {
    fontSize: 16,
    color: '#f4c430',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2f3e',
    marginVertical: 8,
  },
  dangerButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
