import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useUnifiedWallet } from './useUnifiedWallet';
import env from '../config/env';

const API_BASE = env.apiUrl.replace(/\/$/, '');
const buildUrl = (path: string) => `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

function buildAdminHeaders(address: string, opts?: { json?: boolean }): Record<string, string> {
  const headers: Record<string, string> = {
    'x-wallet-address': address,
    'x-wallet-chain': 'base',
  };
  if (opts?.json !== false) headers['Content-Type'] = 'application/json';
  return headers;
}

export enum RoleId {
  Admin = 0,
  MarketCreator = 1,
  Resolver = 2,
  OracleManager = 3,
  Pauser = 4,
}

interface RoleState {
  loading: boolean;
  hasRole: boolean;
  error: string | null;
}

export interface UserRolesResult {
  roles: string[];
  lastSynced: Date | null;
  synced: boolean;
}

export const ROLE_CANONICAL_BY_ID: Record<RoleId, string> = {
  [RoleId.Admin]: 'ROLE_ADMIN',
  [RoleId.MarketCreator]: 'ROLE_MARKET_CREATOR',
  [RoleId.Resolver]: 'ROLE_RESOLVER',
  [RoleId.OracleManager]: 'ROLE_ORACLE_MANAGER',
  [RoleId.Pauser]: 'ROLE_PAUSER',
};

export const ROLE_LABEL_BY_CANONICAL: Record<string, string> = {
  ROLE_ADMIN: 'Admin',
  ROLE_MARKET_CREATOR: 'Market Creator',
  ROLE_RESOLVER: 'Resolver',
  ROLE_ORACLE_MANAGER: 'Oracle Manager',
  ROLE_PAUSER: 'Pauser',
};

const parseUserRolesResponse = (data: any): UserRolesResult => {
  const roles = Array.isArray(data?.roles) ? data.roles.map((role: any) => String(role)) : [];
  const lastSyncedRaw = data?.lastRoleSync ?? data?.syncedAt ?? null;
  const parsedDate = lastSyncedRaw ? new Date(lastSyncedRaw) : null;
  const lastSynced = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
  return { roles, lastSynced, synced: Boolean(data?.onChainRolesSynced ?? data?.syncedAt) };
};

const useRoleCheck = (role: RoleId): RoleState => {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<RoleState>({
    loading: false,
    hasRole: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!address || !isConnected) {
        setState({ loading: false, hasRole: false, error: null });
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await fetch(buildUrl(`/roles/${address}`), {
          headers: buildAdminHeaders(address, { json: false }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch roles: ${response.statusText}`);
        }

        const data = await response.json();
        const userRoles: string[] = Array.isArray(data.roles) ? data.roles : [];
        const roleName = ROLE_CANONICAL_BY_ID[role];

        if (!cancelled) {
          setState({ loading: false, hasRole: userRoles.includes(roleName), error: null });
        }
      } catch (error: any) {
        if (!cancelled) {
          setState({ loading: false, hasRole: false, error: error?.message ?? 'Unknown error' });
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [address, isConnected, role]);

  return state;
};

export const useHasMarketCreatorRole = () => useRoleCheck(RoleId.MarketCreator);
export const useIsAdmin = () => useRoleCheck(RoleId.Admin);

export const useRoleManagement = () => {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const syncRoles = useCallback(async (targetAddress: string): Promise<UserRolesResult> => {
    if (!address) throw new Error('Connect an admin wallet before syncing roles');

    const response = await fetch(buildUrl('/roles/sync'), {
      method: 'POST',
      headers: buildAdminHeaders(address),
      body: JSON.stringify({ walletAddress: targetAddress.trim(), chain: 'base' }),
    });

    if (!response.ok) throw new Error(`Failed to sync roles: ${response.statusText}`);
    return parseUserRolesResponse(await response.json());
  }, [address]);

  const getUserRoles = useCallback(async (targetAddress: string, options?: { sync?: boolean }): Promise<UserRolesResult> => {
    if (!address) throw new Error('Connect an admin wallet before fetching roles');

    if (options?.sync) await syncRoles(targetAddress);

    const response = await fetch(buildUrl(`/roles/${targetAddress.trim()}`), {
      headers: buildAdminHeaders(address, { json: false }),
    });

    if (!response.ok) throw new Error(`Failed to fetch roles: ${response.statusText}`);
    return parseUserRolesResponse(await response.json());
  }, [address, syncRoles]);

  const grantRole = useCallback(async (targetAddress: string, role: RoleId): Promise<string | null> => {
    if (!address) throw new Error('Connect wallet');
    setIsProcessing(true);
    setError(null);

    try {
      await fetch(buildUrl('/roles/grant'), {
        method: 'POST',
        headers: buildAdminHeaders(address),
        body: JSON.stringify({ walletAddress: targetAddress.trim(), role: ROLE_CANONICAL_BY_ID[role], chain: 'base' }),
      });
      await syncRoles(targetAddress);
      return null;
    } catch (err: any) {
      const wrapped = err instanceof Error ? err : new Error('Grant role failed');
      setError(wrapped);
      throw wrapped;
    } finally {
      setIsProcessing(false);
    }
  }, [address, syncRoles]);

  const revokeRole = useCallback(async (targetAddress: string, role: RoleId): Promise<string | null> => {
    if (!address) throw new Error('Connect wallet');
    setIsProcessing(true);
    setError(null);

    try {
      await fetch(buildUrl('/roles/revoke'), {
        method: 'POST',
        headers: buildAdminHeaders(address),
        body: JSON.stringify({ walletAddress: targetAddress.trim(), role: ROLE_CANONICAL_BY_ID[role], chain: 'base' }),
      });
      await syncRoles(targetAddress);
      return null;
    } catch (err: any) {
      const wrapped = err instanceof Error ? err : new Error('Revoke role failed');
      setError(wrapped);
      throw wrapped;
    } finally {
      setIsProcessing(false);
    }
  }, [address, syncRoles]);

  return { grantRole, revokeRole, getUserRoles, syncRoles, isProcessing, error };
};
