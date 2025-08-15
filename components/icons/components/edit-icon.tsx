


import { FC } from "react";
import IconWrapper from "../icon-wrapper";
import { IconProps } from "../icon.types";

const EditIcon: FC<IconProps> = ({ width, isActive = false, onClick, color = "#0B92F9" }) => {
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
                    <path d="M7 12.25C9.34383 10.3399 9.38531 14.2085 12.25 11.0833M1.75 12.2474L3.34055 12.2499C3.56771 12.2503 3.6813 12.2505 3.7882 12.2248C3.88298 12.2021 3.97359 12.1645 4.05671 12.1134C4.15045 12.0557 4.23076 11.9751 4.3914 11.8137L11.9592 4.2127C12.2683 3.90215 12.3452 3.42201 12.1097 3.04256C11.8249 2.58386 11.4355 2.18943 10.9822 1.8966C10.619 1.66189 10.1419 1.7133 9.83652 2.02006L2.22244 9.6676C2.06759 9.82313 1.99016 9.9009 1.93401 9.99142C1.88421 10.0717 1.84688 10.1591 1.82331 10.2507C1.79673 10.354 1.79402 10.4639 1.78859 10.6838L1.75 12.2474Z" stroke="black" strokeOpacity="0.48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            }
        />
    );
};

export default EditIcon;
