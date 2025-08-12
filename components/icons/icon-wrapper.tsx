import { FC, ReactNode } from "react";

type IconWrapperProps = {
  icon: ReactNode;
  width: number;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
};

const IconWrapper: FC<IconWrapperProps> = ({
  icon,
  width,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{ width: `${width}px` }}
    >
      {icon}
    </div>
  );
};

export default IconWrapper;
