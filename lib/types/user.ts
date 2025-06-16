export type User = {
  _id?: string;
  privyId: string;
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
  createdAt: string;
  updatedAt: string;
};
