import { FC } from "react";
import IconWrapper from "../icon-wrapper";
import { IconProps } from "../icon.types";

const SwapIcon: FC<IconProps> = ({ width, isActive = false, onClick, color = "#0B92F9" }) => {
    return (
        <IconWrapper
            width={width}
            onClick={onClick}
            icon={
                <svg
                    width="inherit"
                    height="inherit"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M7.99984 11.4087C8.6912 12.3436 9.49885 13.1832 10.4024 13.9069C10.4799 13.969 10.5732 14 10.6665 14M13.3332 11.4087C12.6418 12.3436 11.8342 13.1832 10.9306 13.9069C10.8531 13.969 10.7598 14 10.6665 14M10.6665 14V4.66667M2.6665 4.59129C3.35787 3.65645 4.16552 2.81681 5.06903 2.09312C5.14654 2.03104 5.23985 2 5.33317 2M7.99984 4.59129C7.30848 3.65645 6.50082 2.81681 5.59731 2.09312C5.51981 2.03104 5.42649 2 5.33317 2M5.33317 2V11.3333" stroke="black" strokeOpacity="0.32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            }
        />
    );
};

export default SwapIcon;
