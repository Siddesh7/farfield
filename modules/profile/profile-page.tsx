import { usePrivy } from "@privy-io/react-auth";
import React from "react";

const ProfilePage = () => {
  const { ready, authenticated, logout, login, user, linkWallet } = usePrivy();

  return (
    <div>
      {user && (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 p-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mb-2">
            {user.farcaster?.pfp ? (
              <img
                src={user.farcaster.pfp}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl text-gray-400">👤</span>
            )}
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {user.farcaster?.displayName ||
              user.google?.name ||
              user.twitter?.name ||
              "Anonymous"}
          </div>
          {user.farcaster?.username && (
            <div className="text-xs text-purple-600">
              @{user.farcaster.username}
            </div>
          )}
          {user.email?.address && (
            <div className="text-xs text-gray-600">{user.email.address}</div>
          )}
          {user.wallet?.address && (
            <div className="text-xs font-mono text-blue-700 break-all">
              {user.wallet.address}
            </div>
          )}
          {user.farcaster?.bio && (
            <div className="text-xs text-gray-500 text-center mt-2">
              {user.farcaster.bio}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { ProfilePage };
