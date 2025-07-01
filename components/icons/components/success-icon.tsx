

import { FC } from "react";
import IconWrapper from "../icon-wrapper";
import { IconProps } from "../icon.types";

const SuccessIcon: FC<IconProps> = ({ width, isActive = false, onClick }) => {
    return (
        <IconWrapper
            width={width}
            onClick={onClick}
            icon={
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M0.0834961 17.0002C0.0834961 7.65735 7.65735 0.0834961 17.0002 0.0834961C26.343 0.0834961 33.9168 7.65735 33.9168 17.0002C33.9168 26.343 26.343 33.9168 17.0002 33.9168C7.65735 33.9168 0.0834961 26.343 0.0834961 17.0002ZM23.7732 14.7867C24.5334 14.2676 24.7288 13.2306 24.2097 12.4704C23.6906 11.7103 22.6536 11.5149 21.8935 12.0339L21.7246 12.1492C18.9898 14.0167 16.6325 16.374 14.7682 19.0959L12.3445 16.6748C11.6933 16.0243 10.6381 16.0248 9.98753 16.676C9.337 17.3273 9.33756 18.3825 9.98878 19.0331L13.8908 22.9309C14.2581 23.2978 14.7754 23.4726 15.29 23.4036C15.8046 23.3347 16.2577 23.0298 16.5154 22.5791C18.2669 19.5165 20.6908 16.8915 23.6044 14.902L23.7732 14.7867Z" fill="#02B151" />
                </svg>
            }
        />
    );
};

export default SuccessIcon;
