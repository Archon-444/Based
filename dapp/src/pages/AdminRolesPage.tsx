import { FormEvent, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw } from 'react-icons/fi';
import toast from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import {
  RoleId,
  ROLE_CANONICAL_BY_ID,
  ROLE_LABEL_BY_CANONICAL,
  useIsAdmin,
  useRoleManagement,
  type UserRolesResult,
} from '../hooks/useRoles';
import { useUnifiedWallet } from '../hooks/useUnifiedWallet';
import { useChain } from '../contexts/ChainContext';
import { Container } from '../components/layout/Container';

const ROLE_METADATA = [
  {
    id: RoleId.Admin,
    label: 'Admin',
    canonical: ROLE_CANONICAL_BY_ID[RoleId.Admin],
    description: 'Full access to DAO tooling, including role management',
  },
  {
    id: RoleId.MarketCreator,
    label: 'Market Creator',
    canonical: ROLE_CANONICAL_BY_ID[RoleId.MarketCreator],
    description: 'Publish markets directly without curation queue',
  },
  {
    id: RoleId.Resolver,
    label: 'Resolver',
    canonical: ROLE_CANONICAL_BY_ID[RoleId.Resolver],
    description: 'Resolve markets and submit outcomes',
  },
  {
    id: RoleId.OracleManager,
    label: 'Oracle Manager',
    canonical: ROLE_CANONICAL_BY_ID[RoleId.OracleManager],
    description: 'Manage oracle registry and data sources',
  },
  {
    id: RoleId.Pauser,
    label: 'Pauser',
    canonical: ROLE_CANONICAL_BY_ID[RoleId.Pauser],
    description: 'Pause critical contracts in emergencies',
  },
];

const AdminRolesPage: React.FC = () => {
  const wallet = useUnifiedWallet();
  const { activeChain } = useChain();
  const { hasRole: isAdmin, loading: adminLoading } = useIsAdmin();
  const { grantRole, revokeRole, getUserRoles, syncRoles, isProcessing } = useRoleManagement();

  const [targetAddress, setTargetAddress] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isFetchingRoles, setIsFetchingRoles] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const roleLabelMap = useMemo(() => ROLE_LABEL_BY_CANONICAL, []);
  const canManage = wallet.connected && isAdmin;

  const applyRolesResult = (result: UserRolesResult) => {
    setRoles(result.roles);
    setLastSynced(result.lastSynced ?? null);
  };

  const handleLookup = async (event: FormEvent) => {
    event.preventDefault();

    if (!targetAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    try {
      setIsFetchingRoles(true);
      const fetched = await getUserRoles(targetAddress.trim());
      applyRolesResult(fetched);
    } catch (error: any) {
      console.error('[AdminRolesPage] Failed to fetch user roles:', error);
      toast.error(error?.message ?? 'Unable to fetch roles');
      setRoles([]);
      setLastSynced(null);
    } finally {
      setIsFetchingRoles(false);
    }
  };

  const handleGrant = async (roleId: RoleId) => {
    try {
      const hash = await grantRole(targetAddress.trim(), roleId);
      toast.success('Role granted');
      const fetched = await getUserRoles(targetAddress.trim(), { sync: true });
      applyRolesResult(fetched);
      if (hash) {
        console.log('Grant role transaction hash:', hash);
      }
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to grant role');
    }
  };

  const handleRevoke = async (roleId: RoleId) => {
    try {
      const hash = await revokeRole(targetAddress.trim(), roleId);
      toast.success('Role revoked');
      const fetched = await getUserRoles(targetAddress.trim(), { sync: true });
      applyRolesResult(fetched);
      if (hash) {
        console.log('Revoke role transaction hash:', hash);
      }
    } catch (error: any) {
      toast.error(error?.message ?? 'Failed to revoke role');
    }
  };

  const handleSync = async () => {
    if (!targetAddress.trim()) {
      toast.error('Enter a wallet address before syncing');
      return;
    }

    try {
      setIsSyncing(true);
      const result = await syncRoles(targetAddress.trim());
      applyRolesResult(result);
      toast.success('Roles synced from chain');
    } catch (error: any) {
      console.error('[AdminRolesPage] Failed to sync roles:', error);
      toast.error(error?.message ?? 'Failed to sync roles');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30">
        <Container size="sm">
          <div className="bg-warning-900/20 border border-warning-500/30 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-warning-200 mb-2">
              Wallet Connection Required
            </h2>
            <p className="text-warning-100/80">
              Connect a DAO admin wallet to manage protocol roles.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30">
        <Container size="sm">
          <div className="bg-error-900/20 border border-error-500/30 rounded-xl p-6 text-center">
            <h2 className="text-xl font-semibold text-error-200 mb-2">
              Admin Role Required
            </h2>
            <p className="text-error-100/80">
              Only DAO admins can grant or revoke protocol roles.
            </p>
            {adminLoading && (
              <p className="mt-2 text-sm text-error-300">Checking admin permissions...</p>
            )}
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B18] text-white selection:bg-primary-500/30">
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">
              DAO Role Management
            </h1>
            <p className="text-slate-500 mt-2">
              Grant or revoke on-chain roles for DAO contributors. These permissions are enforced by the
              `access_control` module and require on-chain transactions.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary-500/20 px-3 py-2 text-sm text-primary-200 border border-primary-500/30">
              Managing roles on <span className="font-semibold uppercase">{activeChain}</span>. Use the Sync button after on-chain updates to refresh backend state.
            </p>
          </div>

          <form onSubmit={handleLookup} className="mb-6 space-y-3">
            <label htmlFor="address" className="block text-sm font-medium text-slate-300">
              Wallet Address
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="address"
                type="text"
                value={targetAddress}
                onChange={(event) => setTargetAddress(event.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-3 border border-white/10 bg-white/5 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white"
              />
              <div className="flex flex-col sm:flex-row gap-3 sm:w-auto">
                <Button type="submit" variant="primary" loading={isFetchingRoles} className="sm:min-w-[140px]">
                  Check Roles
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSync}
                  loading={isSyncing}
                  disabled={!targetAddress.trim()}
                  className="flex items-center justify-center gap-2 sm:min-w-[140px] bg-white/10 text-white hover:bg-white/20 border-transparent"
                >
                  <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
                  Sync Roles
                </Button>
              </div>
            </div>
          </form>

          {targetAddress && (
            <div className="space-y-6">
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Active Roles
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="uppercase tracking-wide font-semibold">
                    Base network
                  </span>
                  {lastSynced && (
                    <span>
                      Last synced {lastSynced.toLocaleString()}
                    </span>
                  )}
                </div>
                {roles.length === 0 ? (
                  <p className="text-slate-500 text-sm">
                    This address currently has no protocol roles.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <li
                        key={role}
                        className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-200 text-sm font-medium border border-primary-500/30"
                      >
                        {roleLabelMap[role] ?? role}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ROLE_METADATA.map((role) => {
                  const hasRole = roles.includes(role.canonical);
                  return (
                    <div
                      key={role.id}
                      className="border border-white/10 rounded-xl p-4 bg-white/5 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">{role.label}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasRole ? 'bg-success-500/20 text-success-200' : 'bg-white/10 text-slate-500'}`}>
                          {hasRole ? 'Assigned' : 'Not Assigned'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-4">{role.description}</p>
                      <div className="flex gap-3">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleGrant(role.id)}
                          disabled={hasRole || isProcessing}
                        >
                          Grant Role
                        </Button>
                        <Button
                          variant="error"
                          size="sm"
                          onClick={() => handleRevoke(role.id)}
                          disabled={!hasRole || isProcessing}
                        >
                          Revoke Role
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-10 p-4 bg-primary-900/20 border border-primary-500/20 rounded-xl">
            <h3 className="font-semibold text-primary-200 mb-2">Best Practices</h3>
            <ul className="text-sm text-primary-100/80 space-y-1">
              <li>• Require multi-sig approval for Admin role assignments.</li>
              <li>• Grant Market Creator to proven contributors whose suggestions are consistently approved.</li>
              <li>• Log all role changes in governance minutes for transparency.</li>
              <li>• Rotate Admin keys periodically and remove stale permissions.</li>
            </ul>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default AdminRolesPage;
