// src/services/backup.ts
// Backup and restore user profile data

import type { UserProfile } from '../types';

/**
 * Export the entire user profile to a JSON string.
 * This can be saved to a file, copied to clipboard, or uploaded to cloud storage.
 */
export function exportProfile(profile: UserProfile): string {
  const exportData = {
    version: '1.0.0', // for future migration compatibility
    exportedAt: new Date().toISOString(),
    profile,
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import a profile from exported JSON.
 * Validates the data structure before returning.
 */
export function importProfile(jsonString: string): UserProfile {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate structure
    if (!data.profile) {
      throw new Error('Invalid backup file: missing profile data');
    }
    
    // Basic validation - ensure critical fields exist
    if (typeof data.profile.onboardingComplete !== 'boolean') {
      throw new Error('Invalid backup file: corrupted data');
    }
    
    // Return the profile (the store will handle merging with defaults for any missing fields)
    return data.profile as UserProfile;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid backup file: not valid JSON');
    }
    throw error;
  }
}

/**
 * Generate a shareable backup code (base64 encoded JSON).
 * Shorter than raw JSON, can be copied to clipboard.
 */
export function generateBackupCode(profile: UserProfile): string {
  const json = exportProfile(profile);
  // In React Native, use a base64 library like 'react-native-base64'
  // For now, using built-in btoa (works in web, needs polyfill for RN)
  if (typeof btoa !== 'undefined') {
    return btoa(json);
  }
  // Fallback: return raw JSON if btoa not available
  return json;
}

/**
 * Restore from backup code.
 */
export function restoreFromBackupCode(code: string): UserProfile {
  try {
    // Try to decode as base64 first
    let json = code;
    if (typeof atob !== 'undefined') {
      try {
        json = atob(code);
      } catch {
        // Not base64, assume it's raw JSON
      }
    }
    return importProfile(json);
  } catch (error) {
    throw new Error('Invalid backup code: ' + (error as Error).message);
  }
}

/**
 * Create a downloadable file blob for the backup.
 * For web: creates a download link
 * For React Native: use react-native-fs to save to device
 */
export function createBackupFile(profile: UserProfile): { filename: string; content: string } {
  const content = exportProfile(profile);
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `kingme-backup-${timestamp}.json`;
  
  return { filename, content };
}

/**
 * Validate a backup file before importing.
 * Returns validation result with details.
 */
export function validateBackup(jsonString: string): { 
  valid: boolean; 
  error?: string; 
  version?: string;
  exportedAt?: string;
  dataSize?: number;
} {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data.profile) {
      return { valid: false, error: 'Missing profile data' };
    }
    
    if (typeof data.profile.onboardingComplete !== 'boolean') {
      return { valid: false, error: 'Corrupted profile data' };
    }
    
    // Calculate approximate data size
    const dataSize = new Blob([jsonString]).size;
    
    return {
      valid: true,
      version: data.version || 'unknown',
      exportedAt: data.exportedAt,
      dataSize,
    };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof SyntaxError ? 'Invalid JSON format' : (error as Error).message 
    };
  }
}
