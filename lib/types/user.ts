export type User = {
  _id?: string; // DB id
  privyId: string; // e.g. did:privy:...
  farcasterFid: number;
  farcaster: {
    ownerAddress: string;
    displayName: string;
    username: string;
    bio?: string;
    pfp?: string;
  };
  wallet: {
    address: string;
    chainType: string;
    walletClientType: string;
    connectorType: string;
  };
  linkedAccounts: Array<{
    type: string;
    [key: string]: any;
  }>;
  createdAt: string;
  updatedAt: string;
  hasAcceptedTerms: boolean;
  isGuest: boolean;
  privyCreatedAt: string;
};
