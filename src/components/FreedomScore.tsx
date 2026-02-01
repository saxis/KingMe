// components/FreedomScore.tsx
import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import type { AvatarType, FreedomState } from '../types';
import { AVATAR_IMAGES } from '../utils/constants';

interface FreedomScoreProps {
  days: number;
  formatted: string;
  state: FreedomState;
  avatarType: AvatarType;
  isKinged: boolean;
}

const { width } = Dimensions.get('window');

export function FreedomScore({ days, formatted, state, avatarType, isKinged }: FreedomScoreProps) {
  const avatarImage = AVATAR_IMAGES[avatarType][state];

  return (
    <View style={styles.container}>
      {/* Background avatar image */}
      <Image source={avatarImage} style={styles.avatarImage} resizeMode="cover" />

      {/* Overlay with freedom score */}
      <View style={styles.overlay}>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNumber}>{days === Infinity ? '∞' : formatted}</Text>
          {!isKinged && <Text style={styles.scoreLabel}>of freedom</Text>}
          {isKinged && <Text style={styles.kingedLabel}>👑 KINGED</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width,
    height: width * 1.2, // Back to original proportions
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 300, // More space at top to show person's head
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(10, 14, 26, 0.85)',
    borderWidth: 3,
    borderColor: '#f4c430',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f4c430',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#f4c430',
    textAlign: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 4,
  },
  kingedLabel: {
    fontSize: 14,
    color: '#f4c430',
    marginTop: 4,
    fontWeight: 'bold',
  },
});
