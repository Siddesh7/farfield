import { FC } from "react";
import IconWrapper from "../icon-wrapper";
import { IconProps } from "../icon.types";

const ArrowRightUp: FC<IconProps> = ({ width, isActive = false, onClick, color = "#0B92F9" }) => {
    return (
        <IconWrapper
            width={width}
            onClick={onClick}
            icon={
                <svg
                    width="inherit"
                    height="inherit"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M5.83243 3.21776C7.34167 2.99178 8.87048 2.96211 10.3807 3.12899C10.5102 3.14331 10.6256 3.20111 10.7122 3.28771M10.7822 8.1675C11.0081 6.65826 11.0378 5.12945 10.8709 3.61928C10.8566 3.48973 10.7988 3.37432 10.7122 3.28771M10.7122 3.28771L3.2876 10.7123" stroke="black" strokeOpacity="0.48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

            }
        />
    );
};

export default ArrowRightUp;
