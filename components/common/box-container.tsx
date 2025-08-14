import React, { ReactNode, useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';

const BoxContainer = ({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string
}) => {
    const [insets, setInsets] = useState({ top: 0, bottom: 15, left: 0, right: 0 });

    useEffect(() => {
        (async () => {
            const { client } = await sdk.context;
            if (client.safeAreaInsets) {
                setInsets(client.safeAreaInsets);
            }
        })();
    }, []);

    return (
        <div
            style={{
                paddingBottom: insets.bottom,
                background: '#fff',
            }}
            className={`${className}`}

        >
            {children}
        </div>
    );
};

export { BoxContainer };