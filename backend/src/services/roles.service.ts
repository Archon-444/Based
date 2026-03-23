import { prisma } from '../database/prismaClient.js';
import { canonicalizeRoles } from '../utils/roleNormalization.js';

const devRoleAllowlist = (process.env.DEV_ROLE_ALLOWLIST || '')
  .split(',')
  .map((addr) => addr.trim().toLowerCase())
  .filter(Boolean);

const getDevRoles = (address: string) => {
  if (process.env.NODE_ENV === 'production') return [];
  if (devRoleAllowlist.length === 0) return [];
  return devRoleAllowlist.includes(address.toLowerCase()) ? ['DaoAdmin', 'MarketCreator'] : [];
};

export const rolesService = {
  async getUserRoles(address: string) {
    const devRoles = getDevRoles(address);
    const user = await prisma.user.findUnique({ where: { walletAddress: address } });
    if (!user) {
      return { walletAddress: address, roles: devRoles, onChainRolesSynced: false };
    }
    const mergedRoles = Array.from(new Set([...user.roles, ...devRoles]));

    if (mergedRoles.length !== user.roles.length) {
      await prisma.user.update({
        where: { walletAddress: address },
        data: { roles: { set: mergedRoles } },
      });
    }

    return {
      walletAddress: user.walletAddress,
      roles: mergedRoles,
      onChainRolesSynced: user.onChainRolesSynced,
      lastRoleSync: user.lastRoleSync,
    };
  },

  async grantRole(params: {
    walletAddress: string;
    role: string;
    actor: string;
    transactionHash?: string;
    chain: 'aptos' | 'sui' | 'movement' | 'base';
  }) {
    const existing = await prisma.user.findUnique({
      where: { walletAddress: params.walletAddress },
    });
    const roles = new Set(existing?.roles ?? []);
    roles.add(params.role);

    await prisma.roleChange.create({
      data: {
        walletAddress: params.walletAddress,
        role: params.role,
        action: 'grant',
        grantedBy: params.actor,
        transactionHash: params.transactionHash,
        chain: params.chain,
      },
    });

    await prisma.user.upsert({
      where: { walletAddress: params.walletAddress },
      update: {
        roles: { set: Array.from(roles) },
        onChainRolesSynced: Boolean(params.transactionHash),
        lastRoleSync: params.transactionHash ? new Date() : (existing?.lastRoleSync ?? undefined),
      },
      create: {
        walletAddress: params.walletAddress,
        roles: Array.from(roles),
        onChainRolesSynced: Boolean(params.transactionHash),
        lastRoleSync: params.transactionHash ? new Date() : undefined,
      },
    });

    return { success: true };
  },

  async revokeRole(params: {
    walletAddress: string;
    role: string;
    actor: string;
    transactionHash?: string;
    chain: 'aptos' | 'sui' | 'movement' | 'base';
  }) {
    await prisma.roleChange.create({
      data: {
        walletAddress: params.walletAddress,
        role: params.role,
        action: 'revoke',
        grantedBy: params.actor,
        transactionHash: params.transactionHash,
        chain: params.chain,
      },
    });

    const existing = await prisma.user.findUnique({
      where: { walletAddress: params.walletAddress },
    });
    if (existing) {
      const roles = existing.roles.filter((role) => role !== params.role);
      await prisma.user.update({
        where: { walletAddress: params.walletAddress },
        data: {
          roles: { set: roles },
          onChainRolesSynced: Boolean(params.transactionHash),
          lastRoleSync: params.transactionHash ? new Date() : existing.lastRoleSync,
        },
      });
    }

    return { success: true };
  },

  async syncRoles(params: {
    walletAddress: string;
    chain: 'aptos' | 'sui' | 'movement' | 'base';
    actor: string;
  }) {
    // On-chain role sync for Base uses the MarketFactory AccessControl contract
    // For now, roles are managed via the database and synced on grant/revoke events
    const user = await prisma.user.findUnique({
      where: { walletAddress: params.walletAddress },
    });

    const roles = user?.roles ?? [];
    const normalizedRoles = canonicalizeRoles(roles);
    const now = new Date();

    const updatedUser = await prisma.user.upsert({
      where: { walletAddress: params.walletAddress },
      update: {
        roles: { set: normalizedRoles },
        onChainRolesSynced: true,
        lastRoleSync: now,
      },
      create: {
        walletAddress: params.walletAddress,
        roles: normalizedRoles,
        onChainRolesSynced: true,
        lastRoleSync: now,
      },
    });

    return {
      walletAddress: updatedUser.walletAddress,
      roles: normalizedRoles,
      chain: params.chain,
      syncedAt: updatedUser.lastRoleSync ?? now,
    };
  },
};
