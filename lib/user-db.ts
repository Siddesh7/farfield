import { connectToDatabase } from "./mongodb";
import { USER_COLLECTION, USER_UNIQUE_FIELDS } from "./constants/user";
import { User } from "./types/user";
import { WithId, FindOneAndUpdateOptions } from "mongodb";

export async function upsertUser(user: any): Promise<WithId<User> | null> {
  const { db } = await connectToDatabase();
  const filter = {
    $or: [
      { [USER_UNIQUE_FIELDS.privyId]: user.id },
      { [USER_UNIQUE_FIELDS.farcasterFid]: user.farcaster?.fid },
    ],
  };
  const update = {
    $set: {
      privyId: user.id,
      fid: user.farcaster?.fid,
      farcaster: {
        username: user.farcaster?.username,
        pfp: user.farcaster?.pfp,
        displayName: user.farcaster?.displayName,
        ownerAddress: user.farcaster?.ownerAddress,
        fid: user.farcaster?.fid,
        bio: user.farcaster?.bio,
      },
      wallet: user.wallet,
    },
    $setOnInsert: {
      createdAt: new Date().toISOString(),
    },
  };
  const options: FindOneAndUpdateOptions = {
    upsert: true,
    returnDocument: "after",
  };
  const result = await db
    .collection<User>(USER_COLLECTION)
    .findOneAndUpdate(filter, update, options);
  return result;
}

export async function getUserByPrivyId(
  privyId: string
): Promise<WithId<User> | null> {
  const { db } = await connectToDatabase();
  return db.collection<User>(USER_COLLECTION).findOne({ privyId });
}
