import React, { FC, ReactNode } from "react";

type IconWrapperProps = {
  icon: ReactNode;
  width: number;
  onClick?: () => void;
};

const IconWrapper: FC<IconWrapperProps> = ({ icon, width, onClick }) => {
  return (
    <div onClick={onClick} style={{ width: `${width}px` }}>
      {icon}
    </div>
  );
};

export default IconWrapper;
