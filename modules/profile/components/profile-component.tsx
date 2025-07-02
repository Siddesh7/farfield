import { trimAddress } from '@/lib/utils';
import { User } from '@privy-io/react-auth';
import Image from 'next/image';
import React from 'react';

const ProfileComponent = ({ user }: { user: User }) => {
    const displayName =
        user.farcaster?.displayName ||
        user.google?.name ||
        user.twitter?.name ||
        "Anonymous";

    return (
        <div className=" flex flex-col gap-4 items-center">
            <div className='relative h-[110px] w-[110px]'>
                {user.farcaster?.pfp ? (
                    <Image
                        src={user.farcaster.pfp}
                        alt="Profile"
                        fill
                        className="rounded-full"
                        objectFit='cover'
                    />
                ) : (
                    <Image
                        src="/Profile_Image.png"
                        alt="Profile"
                        fill
                        className="rounded-full"
                        objectFit='cover'
                    />
                )}
            </div>

            <div className="flex flex-col gap-3 items-center justify-center">
                <div className='flex flex-col justify-center items-center'>
                    <p className="text-lg font-semibold">{displayName}</p>
                    <p className="text-sm text-fade font-semibold"> @{user.farcaster?.username}</p>
                </div>
                {user.wallet?.address && (
                    <p className="text-fade">
                        {trimAddress(user.wallet.address, 6)}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ProfileComponent;