export interface WalletBrandInfo {
  icon?: string;
  brandColor: string;
  website?: string;
  initials: string;
}

interface WalletBrandSpec {
  ids: string[];
  info: WalletBrandInfo;
}

const walletBrandSpecs: WalletBrandSpec[] = [
  {
    ids: ['coinbase wallet', 'coinbase smart wallet', 'coinbase'],
    info: {
      icon: '/assets/wallets/coinbase.svg',
      brandColor: '#0052FF',
      website: 'https://wallet.coinbase.com',
      initials: 'C',
    },
  },
  {
    ids: ['metamask', 'metamask wallet', 'io.metamask'],
    info: {
      icon: '/assets/wallets/metamask.svg',
      brandColor: '#F6851B',
      website: 'https://metamask.io',
      initials: 'M',
    },
  },
  {
    ids: ['rainbow', 'rainbow wallet'],
    info: {
      icon: '/assets/wallets/rainbow.svg',
      brandColor: '#001E59',
      website: 'https://rainbow.me',
      initials: 'R',
    },
  },
  {
    ids: ['walletconnect', 'wallet connect'],
    info: {
      icon: '/assets/wallets/walletconnect.svg',
      brandColor: '#3B99FC',
      website: 'https://walletconnect.com',
      initials: 'W',
    },
  },
  {
    ids: ['rabby', 'rabby wallet'],
    info: {
      icon: '/assets/wallets/rabby.svg',
      brandColor: '#8697FF',
      website: 'https://rabby.io',
      initials: 'R',
    },
  },
  {
    ids: ['okx wallet', 'okx'],
    info: {
      brandColor: '#000000',
      website: 'https://okx.com/web3',
      initials: 'O',
    },
  },
  {
    ids: ['trust', 'trust wallet'],
    info: {
      brandColor: '#0500FF',
      website: 'https://trustwallet.com',
      initials: 'T',
    },
  },
];

const walletBrandMap = walletBrandSpecs.reduce<Record<string, WalletBrandInfo>>((acc, spec) => {
  spec.ids.forEach((id) => {
    acc[id.toLowerCase()] = spec.info;
  });
  return acc;
}, {});

const DEFAULT_BRAND_COLOR = '#3B82F6';
const DEFAULT_INITIAL = 'W';

export const WALLET_BRAND_FALLBACK: WalletBrandInfo = {
  brandColor: DEFAULT_BRAND_COLOR,
  initials: DEFAULT_INITIAL,
};

export function resolveWalletBrand(walletName?: string | null): WalletBrandInfo {
  if (!walletName) {
    return { ...WALLET_BRAND_FALLBACK };
  }

  const brand = walletBrandMap[walletName.trim().toLowerCase()];
  if (brand) {
    return brand;
  }

  const firstLetter = walletName.trim().charAt(0).toUpperCase() || WALLET_BRAND_FALLBACK.initials;
  return {
    brandColor: DEFAULT_BRAND_COLOR,
    initials: firstLetter,
  };
}

export function getWalletWebsite(walletName: string): string | undefined {
  const brand = resolveWalletBrand(walletName);
  return brand.website;
}

export const walletBrandRegistry = walletBrandMap;
