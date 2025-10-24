import algosdk from 'algosdk';

const algodServer = import.meta.env.VITE_ALGOD_SERVER;
const algodPort = import.meta.env.VITE_ALGOD_PORT;
const algodToken = import.meta.env.VITE_ALGOD_TOKEN || '';

const indexerServer = import.meta.env.VITE_INDEXER_SERVER;
const indexerPort = import.meta.env.VITE_INDEXER_PORT;
const indexerToken = import.meta.env.VITE_INDEXER_TOKEN || '';

export const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
export const indexerClient = new algosdk.Indexer(indexerToken, indexerServer, indexerPort);

export interface AlgorandConfig {
  algodClient: algosdk.Algodv2;
  indexerClient: algosdk.Indexer;
}

export const getAlgorandConfig = (): AlgorandConfig => ({
  algodClient,
  indexerClient,
});

export const waitForConfirmation = async (txId: string, timeout: number = 4): Promise<any> => {
  const startRound = (await algodClient.status().do())['last-round'];
  let currentRound = startRound;

  while (currentRound < startRound + timeout) {
    try {
      const pending = await algodClient.pendingTransactionInformation(txId).do();
      if (pending['confirmed-round'] !== null && pending['confirmed-round'] > 0) {
        return pending;
      }
      if (pending['pool-error'] != null && pending['pool-error'].length > 0) {
        throw new Error(`Transaction rejected: ${pending['pool-error']}`);
      }
    } catch (err) {
      throw err;
    }
    currentRound++;
    await algodClient.statusAfterBlock(currentRound).do();
  }
  throw new Error(`Transaction not confirmed after ${timeout} rounds`);
};

export const microAlgosToAlgos = (microAlgos: number): number => {
  return microAlgos / 1000000;
};

export const algosToMicroAlgos = (algos: number): number => {
  return Math.round(algos * 1000000);
};

export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getAccountInfo = async (address: string) => {
  try {
    return await algodClient.accountInformation(address).do();
  } catch (error) {
    console.error('Error fetching account info:', error);
    throw error;
  }
};
