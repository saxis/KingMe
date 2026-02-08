// app/components/AssetSectionSettings.tsx - Toggle for asset section expansion preference
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useStore } from '../../src/store/useStore';

export default function AssetSectionSettings() {
  const defaultExpanded = useStore((s) => s.settings?.defaultExpandAssetSections ?? false);
  const updateSettings = useStore((s) => s.updateSettings);

  const handleToggle = (value: boolean) => {
    updateSettings({ defaultExpandAssetSections: value });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Asset Sections</Text>
      </View>
      
      <View style={styles.setting}>
        <View style={styles.settingLeft}>
          <Text style={styles.settingLabel}>Expand sections by default</Text>
          <Text style={styles.settingDescription}>
            When enabled, all asset categories and cash flow will be expanded when you open the Assets tab
          </Text>
        </View>
        <Switch
          value={defaultExpanded}
          onValueChange={handleToggle}
          trackColor={{ false: '#2a2f3e', true: '#4ade80' }}
          thumbColor={defaultExpanded ? '#ffffff' : '#666'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1f2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  settingLeft: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
