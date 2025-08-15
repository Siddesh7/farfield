import React, { ReactNode } from 'react';

const BoxContainer = ({
    children,
    className = ''
}: {
    children: ReactNode;
    className?: string
}) => {
    return (
        <div
            className={`${className}`}

        >
            {children}
        </div>
    );
};

export { BoxContainer };