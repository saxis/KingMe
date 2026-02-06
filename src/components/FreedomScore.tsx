// components/FreedomScore.tsx
import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import type { AvatarType, FreedomState } from '../types';
import { AVATAR_IMAGES } from '../utils/constants';

interface FreedomScoreProps {
  days: number;
  formatted: string;
  state: FreedomState;
  avatarType: AvatarType;
  isKinged: boolean;
  /** 'hero' = full-width banner (mobile default). 'sidebar' = left panel (web default). */
  layout?: 'hero' | 'sidebar';
  /** Only used in sidebar mode: the dashboard content rendered to the right of the image. */
  children?: React.ReactNode;
}

const { width, height } = Dimensions.get('window');

// Auto-pick based on platform; caller can override.
function defaultLayout(): 'hero' | 'sidebar' {
  return Platform.OS === 'web' ? 'sidebar' : 'hero';
}

export function FreedomScore({ days, formatted, state, avatarType, isKinged, layout, children }: FreedomScoreProps) {
  const avatarImage = AVATAR_IMAGES[avatarType][state];
  const mode = layout ?? defaultLayout();

  // ── shared score circle ─────────────────────────────────────────────────
  const scoreCircle = (
    <View style={mode === 'sidebar' ? styles.scoreCircleSidebar : styles.scoreCircle}>
      <Text style={mode === 'sidebar' ? styles.scoreNumberSidebar : styles.scoreNumber}>
        {days === Infinity ? '∞' : formatted}
      </Text>
      {!isKinged && <Text style={styles.scoreLabel}>of freedom</Text>}
      {isKinged  && <Text style={styles.kingedLabel}>👑 KINGED</Text>}
    </View>
  );

  // ── HERO layout (mobile — identical to original) ────────────────────────
  if (mode === 'hero') {
    return (
      <View style={styles.heroContainer}>
        <Image source={avatarImage} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroOverlay}>
          {scoreCircle}
        </View>
      </View>
    );
  }

  // ── SIDEBAR layout (web) ─────────────────────────────────────────────────
  return (
    <View style={styles.sidebarRow}>
      {/* Left: avatar image + score circle overlay */}
      <View style={styles.sidebarImagePanel}>
        <Image source={avatarImage} style={styles.sidebarImage} resizeMode="cover" />
        <View style={styles.sidebarOverlay}>
          {scoreCircle}
        </View>
      </View>

      {/* Right: whatever the parent passes as children (the full dashboard) */}
      <View style={styles.sidebarContent}>
        {children}
      </View>
    </View>
  );
}

// ─── dimensions helpers ──────────────────────────────────────────────────────
const SIDEBAR_WIDTH = 420; // px — comfortable on 1440+ desktops

const styles = StyleSheet.create({
  // ── HERO (mobile) ─────────────────────────────────────────────────────────
  heroContainer: {
    width: width,
    height: height * 0.6,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
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

  // ── SIDEBAR (web) ─────────────────────────────────────────────────────────
  sidebarRow: {
    flexDirection: 'row',
    flex: 1,
  },
  sidebarImagePanel: {
    width: SIDEBAR_WIDTH,
    position: 'relative',
  },
  sidebarImage: {
    width: '100%',
    height: '100%',
  },
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreCircleSidebar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(10, 14, 26, 0.85)',
    borderWidth: 3,
    borderColor: '#f4c430',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f4c430',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  scoreNumberSidebar: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#f4c430',
    textAlign: 'center',
  },
  sidebarContent: {
    flex: 1,
    overflow: 'scroll',
  },

  // ── shared ────────────────────────────────────────────────────────────────
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
