import { FC } from "react";
import IconWrapper from "../icon-wrapper";
import { IconProps } from "../icon.types";

const DoubleTickIcon: FC<IconProps> = ({ width, isActive = false, onClick }) => {
    return (
        <IconWrapper
            width={width}
            onClick={onClick}
            icon={
                <svg
                    width="inherit"
                    height="inherit"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M1.30273 5.89062L3.5646 8.50242L3.75166 8.17533C3.9868 7.76416 4.24311 7.36676 4.51924 6.9846C5.42084 5.73677 6.53373 4.65136 7.81094 3.77921L8.22341 3.49756M10.7765 3.80439L10.3416 4.04993C8.58234 5.04312 7.07151 6.42274 5.92302 8.08477L5.70882 8.39476L5.56012 8.21849" stroke="#0B92F9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            }
        />
    );
};

export default DoubleTickIcon;
