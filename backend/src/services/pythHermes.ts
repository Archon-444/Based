/**
 * Pyth Hermes API Client
 *
 * Fetches price update data from Pyth Hermes for on-chain updatePriceFeeds() calls.
 * The Hermes API returns binary VAA data that the Pyth contract can verify.
 *
 * Endpoint: https://hermes.pyth.network/v2/updates/price/latest
 */

const HERMES_BASE_URL = 'https://hermes.pyth.network';

export interface HermesPrice {
  feedId: string;
  price: string;
  conf: string;
  expo: number;
  publishTime: number;
}

interface HermesPriceResponse {
  binary: {
    encoding: string;
    data: string[];
  };
  parsed: Array<{
    id: string;
    price: {
      price: string;
      conf: string;
      expo: number;
      publish_time: number;
    };
  }>;
}

/**
 * Fetch binary price update data for on-chain updatePriceFeeds().
 * Returns hex-encoded VAA bytes ready to pass to the Pyth contract.
 */
export async function fetchPriceUpdateData(feedIds: string[]): Promise<`0x${string}`[]> {
  const params = new URLSearchParams();
  for (const id of feedIds) {
    params.append('ids[]', id);
  }
  params.append('encoding', 'hex');

  const url = `${HERMES_BASE_URL}/v2/updates/price/latest?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Hermes API error: ${response.status} ${response.statusText}`);
  }

  const data: HermesPriceResponse = await response.json();

  // Each entry in binary.data is a hex-encoded price update
  return data.binary.data.map((hex) => `0x${hex}` as `0x${string}`);
}

/**
 * Fetch parsed latest prices (for logging/monitoring, not on-chain).
 */
export async function fetchLatestPrices(feedIds: string[]): Promise<HermesPrice[]> {
  const params = new URLSearchParams();
  for (const id of feedIds) {
    params.append('ids[]', id);
  }

  const url = `${HERMES_BASE_URL}/v2/updates/price/latest?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Hermes API error: ${response.status} ${response.statusText}`);
  }

  const data: HermesPriceResponse = await response.json();

  return data.parsed.map((entry) => ({
    feedId: entry.id,
    price: entry.price.price,
    conf: entry.price.conf,
    expo: entry.price.expo,
    publishTime: entry.price.publish_time,
  }));
}
