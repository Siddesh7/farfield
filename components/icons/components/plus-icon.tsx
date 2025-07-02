import { FC } from "react";
import IconWrapper from "../icon-wrapper";
import { IconProps } from "../icon.types";

const PlusIcon: FC<IconProps> = ({ width, isActive = false, onClick }) => {
  return (
    <IconWrapper
      width={width}
      onClick={onClick}
      icon={
        <svg
          width="inherit"
          height="inherit"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isActive ? (
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2.15845 14.0001C2.15845 7.46014 7.46014 2.15845 14.0001 2.15845C20.5401 2.15845 25.8418 7.46014 25.8418 14.0001C25.8418 20.5401 20.5401 25.8418 14.0001 25.8418C7.46014 25.8418 2.15845 20.5401 2.15845 14.0001ZM15.1666 10.3834C15.1666 9.73903 14.6442 9.21669 13.9999 9.21669C13.3556 9.21669 12.8332 9.73903 12.8332 10.3834V12.8334H10.3832C9.73889 12.8334 9.21655 13.3557 9.21655 14C9.21655 14.6444 9.73889 15.1667 10.3832 15.1667H12.8332V17.6167C12.8332 18.261 13.3556 18.7834 13.9999 18.7834C14.6442 18.7834 15.1666 18.261 15.1666 17.6167V15.1667H17.6166C18.2609 15.1667 18.7832 14.6444 18.7832 14C18.7832 13.3557 18.2609 12.8334 17.6166 12.8334H15.1666V10.3834Z"
              fill="black"
              fillOpacity="0.88"
            />
          ) : (
            <path
              d="M14.0001 17.5001V14.0001M14.0001 14.0001V10.5001M14.0001 14.0001H10.5001M14.0001 14.0001H17.5001M24.6751 14.0002C24.6751 19.8958 19.8957 24.6752 14.0001 24.6752C8.10443 24.6752 3.32507 19.8958 3.32507 14.0002C3.32507 8.10456 8.10443 3.3252 14.0001 3.3252C19.8957 3.3252 24.6751 8.10456 24.6751 14.0002Z"
              stroke="black"
              strokeOpacity="0.48"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      }
    />
  );
};

export default PlusIcon;
