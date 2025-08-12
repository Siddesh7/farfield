interface NeynarUser {
    fid: number;
    username: string;
    display_name: string;
    custody_address: string;
    pro?: {
      status: "subscribed" | "unsubscribed";
      subscribed_at?: string;
      expires_at?: string;
    };
    pfp_url?: string;
    // ... other fields from the API response
  }
  
  interface NeynarUsersResponse {
    users: NeynarUser[];
  }
  
  /**
   * Fetch user subscription status from Neynar API
   * @param fids Array of Farcaster FIDs to fetch
   * @returns Promise with user data including subscription status
   */
  export async function fetchUsersFromNeynar(fids: number[]): Promise<NeynarUser[]> {
    const neynarApiKey = process.env.NEYNAR_API_KEY;
    
    if (!neynarApiKey) {
      console.warn("NEYNAR_API_KEY not configured, skipping Neynar API call");
      return [];
    }
  
    if (fids.length === 0) {
      return [];
    }
  
    try {
      const fidsParam = fids.join(',');
      const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fidsParam}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'api_key': neynarApiKey,
        },
      });
  
      if (!response.ok) {
        console.error(`Neynar API error: ${response.status} ${response.statusText}`);
        return [];
      }
  
      const data: NeynarUsersResponse = await response.json();
      return data.users || [];
    } catch (error) {
      console.error('Error fetching users from Neynar:', error);
      return [];
    }
  }
  
  /**
   * Extract subscription status from Neynar user data
   * @param neynarUser User data from Neynar API
   * @returns boolean indicating if user is subscribed to Farcaster Pro
   */
  export function extractSubscriptionStatus(neynarUser: NeynarUser): boolean {
    return neynarUser.pro?.status === "subscribed";
  }
  
  /**
   * Update users' subscription status in the database
   * @param neynarUsers Array of users from Neynar API
   */
  export async function updateUsersSubscriptionStatus(neynarUsers: NeynarUser[]): Promise<void> {
    const { User } = await import("@/models/user");
    
    for (const neynarUser of neynarUsers) {
      const isSubscribed = extractSubscriptionStatus(neynarUser);
      
      try {
        await User.updateOne(
          { farcasterFid: neynarUser.fid },
          { 
            $set: { isSubscribed } 
          }
        );
      } catch (error) {
        console.error(`Error updating subscription status for FID ${neynarUser.fid}:`, error);
      }
    }
  }