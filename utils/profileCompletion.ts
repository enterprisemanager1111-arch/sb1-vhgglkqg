/**
 * Profile completion utility functions
 * Determines if a user's profile is complete based on required and important fields
 */

export interface Profile {
  id: string;
  name: string;
  birth_date?: string;
  avatar_url?: string;
  role?: string;
  interests?: string[];
  company_ID?: string;
  phone_num?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Check if a user's profile is complete
 * A profile is considered complete if it has:
 * - name (required)
 * - birth_date (required)
 * - role/position (required)
 * 
 * If any of these fields are missing, the profile is incomplete.
 */
export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) {
    return false;
  }

  // Check required fields - all must be present for profile to be complete
  const hasName = profile.name && profile.name.trim() !== '';
  const hasBirthDate = profile.birth_date && profile.birth_date.trim() !== '';
  const hasRole = profile.role && profile.role.trim() !== '';

  // Profile is complete only if ALL required fields are present
  return hasName && hasBirthDate && hasRole;
}

/**
 * Get profile completion percentage
 * Returns a number between 0 and 100
 * Based on the 3 required fields: name, birth_date, role
 */
export function getProfileCompletionPercentage(profile: Profile | null): number {
  if (!profile) {
    return 0;
  }

  const requiredFields = [
    profile.name && profile.name.trim() !== '', // Required
    profile.birth_date && profile.birth_date.trim() !== '', // Required
    profile.role && profile.role.trim() !== '', // Required
  ];

  const completedFields = requiredFields.filter(Boolean).length;
  return Math.round((completedFields / requiredFields.length) * 100);
}

/**
 * Get missing profile fields
 * Returns an array of field names that are missing or incomplete
 * Only includes the 3 required fields: name, birth_date, role
 */
export function getMissingProfileFields(profile: Profile | null): string[] {
  if (!profile) {
    return ['name', 'birth_date', 'role'];
  }

  const missing: string[] = [];

  if (!profile.name || profile.name.trim() === '') {
    missing.push('name');
  }
  if (!profile.birth_date || profile.birth_date.trim() === '') {
    missing.push('birth_date');
  }
  if (!profile.role || profile.role.trim() === '') {
    missing.push('role');
  }

  return missing;
}
