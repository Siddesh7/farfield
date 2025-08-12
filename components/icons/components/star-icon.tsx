import { FC } from "react";
import IconWrapper from "../icon-wrapper";
import { IconProps } from "../icon.types";

type StarIconProps = IconProps & {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
};

const StarIcon: FC<StarIconProps> = ({
  width,
  isActive = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
}) => {
  const fillColor = isActive ? "#F6B51E" : "#E5E7EB"; // active gold vs gray-200
  const strokeColor = isActive ? "#F6B51E" : "#9CA3AF"; // outline for inactive

  return (
    <IconWrapper
      width={width}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={className}
      icon={
        <svg
          width="inherit"
          height="inherit"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.1884 7.15862C15.8074 6.57742 15.4661 5.53802 14.6231 5.43679L11.1505 5.01974C10.804 4.97813 10.5042 4.75883 10.3596 4.44116L8.90686 1.24954C8.55139 0.468585 7.44204 0.468585 7.08657 1.24954L5.63378 4.44123C5.4892 4.75887 5.18949 4.97815 4.84299 5.0198L1.37649 5.43656C0.533588 5.5379 0.192435 6.57722 0.811311 7.15838L3.39474 9.58437C3.64539 9.81975 3.75754 10.1674 3.69168 10.5049L3.01195 13.988C2.84821 14.827 3.74454 15.4714 4.48768 15.0489L7.50276 13.3346C7.80907 13.1605 8.18442 13.1604 8.49081 13.3344L11.5131 15.0506C12.2562 15.4726 13.152 14.8283 12.9883 13.9895L12.3083 10.5049C12.2425 10.1674 12.3546 9.81975 12.6053 9.58437L15.1884 7.15862Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="0.5"
          />
        </svg>
      }
    />
  );
};

export default StarIcon;
