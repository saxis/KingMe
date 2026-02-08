// app/expenses.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { DailyExpenseTracker } from '../src/components/DailyExpenseTracker';

export default function ExpensesScreen() {
  const router = useRouter();
  const obligations = useStore((state) => state.obligations);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Daily Expenses</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Daily Expense Tracker Component */}
      <DailyExpenseTracker obligations={obligations} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0e1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#0a0e1a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1f2e',
  },
  backButton: {
    fontSize: 32,
    color: '#f4c430',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});
