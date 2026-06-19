import { useProfileStore } from '../store/profileStore';
import { useMemo } from 'react';

export const useCurrentProfile = () => {
  const { profiles, activeProfileId } = useProfileStore();

  return useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || null;
  }, [profiles, activeProfileId]);
};
