import User from '@/models/user';

// Neynar API Types based on the response you provided
interface NeynarProStatus {
  status: string;
  subscribed_at: string;
  expires_at: string;
}

interface NeynarUser {
  object: "user";
  fid: number;
  username: string;
  display_name: string;
  custody_address: string;
  pro?: NeynarProStatus;
  pfp_url: string;
}

interface NeynarUsersResponse {
  users: NeynarUser[];
}

/**
 * Fetch user data from Neynar API
 * @param fid Farcaster FID
 * @returns Neynar user data or null if not found
 */
async function fetchUserFromNeynar(fid: number): Promise<NeynarUser | null> {
  const neynarApiKey = process.env.NEYNAR_API_KEY;
  
  if (!neynarApiKey) {
    console.warn("NEYNAR_API_KEY not configured, skipping verification check");
    return null;
  }

  try {
    const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api_key': neynarApiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status} ${response.statusText}`);
    }

    const data: NeynarUsersResponse = await response.json();
    
    return data.users.length > 0 ? data.users[0] : null;
  } catch (error) {
    console.error(`Error fetching user ${fid} from Neynar:`, error);
    throw error;
  }
}

/**
 * Extract verification status from Neynar user data
 * @param neynarUser User data from Neynar API
 * @returns true if user has active subscription, false otherwise
 */
function extractVerificationStatus(neynarUser: NeynarUser): boolean {
  // Check if pro object exists and status is "subscribed"
  return neynarUser.pro?.status === "subscribed";
}

/**
 * Check and update user verification status
 * @param farcasterFid User's Farcaster FID
 * @returns Updated verification status
 */
export async function checkAndUpdateUserVerification(farcasterFid: number): Promise<boolean> {
  try {
    // Fetch user data from Neynar
    const neynarUser = await fetchUserFromNeynar(farcasterFid);
    
    if (!neynarUser) {
      console.warn(`User with FID ${farcasterFid} not found in Neynar`);
      return false;
    }

    // Extract verification status
    const isVerified = extractVerificationStatus(neynarUser);

    // Update user in database
    const updateResult = await User.findOneAndUpdate(
      { farcasterFid },
      { 
        isVerified,
        verificationCheckedAt: new Date()
      },
      { new: true }
    );

    if (!updateResult) {
      console.warn(`User with FID ${farcasterFid} not found in database`);
      return false;
    }

    console.log(`Updated verification status for user ${farcasterFid}: ${isVerified}`);
    return isVerified;

  } catch (error) {
    console.error(`Error checking verification for user ${farcasterFid}:`, error);
    
    // Still update the timestamp to avoid repeated failed attempts
    try {
      await User.findOneAndUpdate(
        { farcasterFid },
        { verificationCheckedAt: new Date() }
      );
    } catch (updateError) {
      console.error(`Error updating timestamp for user ${farcasterFid}:`, updateError);
    }
    
    throw error;
  }
}

/**
 * Batch update verification status for multiple users
 * @param farcasterFids Array of Farcaster FIDs
 * @returns Object with successful and failed updates
 */
export async function batchUpdateVerificationStatus(farcasterFids: number[]): Promise<{
  successful: number[];
  failed: number[];
}> {
  const results = { successful: [] as number[], failed: [] as number[] };
  
  // Process in batches to avoid overwhelming the API
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < farcasterFids.length; i += BATCH_SIZE) {
    const batch = farcasterFids.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(async (fid) => {
      try {
        await checkAndUpdateUserVerification(fid);
        results.successful.push(fid);
      } catch (error) {
        results.failed.push(fid);
      }
    });
    
    await Promise.allSettled(promises);
    
    // Add small delay between batches to be respectful to the API
    if (i + BATCH_SIZE < farcasterFids.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Manually refresh verification status for a user
 * @param farcasterFid User's Farcaster FID
 * @returns Updated verification status
 */
export async function refreshUserVerification(farcasterFid: number): Promise<boolean> {
  return checkAndUpdateUserVerification(farcasterFid);
}
