// app/onboarding/welcome.tsx
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import type { AvatarType } from '../../src/types';
import { AVATAR_PREVIEWS } from '../../src/utils/constants';
import { useStore } from '../../src/store/useStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const avatarType = useStore((state) => state.settings.avatarType);
  const setAvatarType = useStore((state) => state.setAvatarType);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType>(avatarType);

  const handleContinue = () => {
    setAvatarType(selectedAvatar);
    router.push('/onboarding/bank-accounts');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👑 Welcome to KingMe</Text>
      <Text style={styles.subtitle}>Track your path to financial freedom</Text>

      <Text style={styles.sectionTitle}>Choose Your Avatar</Text>
      
      <View style={styles.avatarContainer}>
        <TouchableOpacity
          style={[
            styles.avatarOption,
            selectedAvatar === 'male-medium' && styles.avatarSelected,
          ]}
          onPress={() => setSelectedAvatar('male-medium')}
        >
          <Image
            source={AVATAR_PREVIEWS['male-medium']}
            style={styles.avatarPreview}
            resizeMode="cover"
          />
          <Text style={styles.avatarLabel}>Male</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.avatarOption,
            selectedAvatar === 'female-medium' && styles.avatarSelected,
          ]}
          onPress={() => setSelectedAvatar('female-medium')}
        >
          <Image
            source={AVATAR_PREVIEWS['female-medium']}
            style={styles.avatarPreview}
            resizeMode="cover"
          />
          <Text style={styles.avatarLabel}>Female</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.description}>
        KingMe calculates your "days of freedom" - how long your assets can sustain your lifestyle.
        {'\n\n'}
        When your asset income covers all your needs, you're <Text style={styles.highlight}>KINGED 👑</Text>
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f4c430',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f4c430',
    marginBottom: 20,
    textAlign: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
  },
  avatarOption: {
    width: 140,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#1a1f2e',
  },
  avatarSelected: {
    borderColor: '#f4c430',
    shadowColor: '#f4c430',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  avatarPreview: {
    width: '100%',
    height: 140,
  },
  avatarLabel: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#1a1f2e',
  },
  description: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
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
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a0e1a',
  },
});
