import { useQuery } from '@tanstack/react-query';
import { fetchAccountStatuses, type AccountStatusPayload } from '../lib/adminAccountApi';

const emptyNoLogin: AccountStatusPayload = {
  status: 'no_login',
  email: null,
  lastSignInAt: null,
};

export function useAccountStatus(profileId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['account-status', profileId],
    queryFn: async () => {
      const map = await fetchAccountStatuses([profileId!]);
      return map[profileId!] ?? emptyNoLogin;
    },
    enabled: Boolean(profileId && enabled),
  });
}

export function useAccountStatusesMap(profileIds: string[], enabled: boolean) {
  const sortedKey = [...profileIds].sort().join(',');
  return useQuery({
    queryKey: ['account-statuses', sortedKey],
    queryFn: () => fetchAccountStatuses([...profileIds]),
    enabled: enabled && profileIds.length > 0,
  });
}
