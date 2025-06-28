import { FC } from "react";
import IconWrapper from "../icon-wrapper";
import { IconProps } from "../icon.types";

const UserIcon: FC<IconProps> = ({ width, isActive = false, onClick }) => {
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
            <>
              <path
                d="M14 2.625C10.9394 2.625 8.45829 5.10609 8.45829 8.16667C8.45829 11.2272 10.9394 13.7083 14 13.7083C17.0605 13.7083 19.5416 11.2272 19.5416 8.16667C19.5416 5.10609 17.0605 2.625 14 2.625Z"
                fill="black"
                fill-opacity="0.88"
              />
              <path
                d="M11.7967 16.2354C7.77201 15.1197 3.79163 18.1467 3.79163 22.3232C3.79163 24.0087 5.15803 25.3751 6.84357 25.3751H21.1564C22.8419 25.3751 24.2083 24.0087 24.2083 22.3232C24.2083 18.1467 20.2279 15.1197 16.2032 16.2354L15.3913 16.4605C14.4809 16.7129 13.519 16.7129 12.6086 16.4605L11.7967 16.2354Z"
                fill="black"
                fill-opacity="0.88"
              />
            </>
          ) : (
            <>
              <path
                d="M18.6667 8.16667C18.6667 10.744 16.5773 12.8333 14 12.8333C11.4227 12.8333 9.33332 10.744 9.33332 8.16667C9.33332 5.58934 11.4227 3.5 14 3.5C16.5773 3.5 18.6667 5.58934 18.6667 8.16667Z"
                stroke="black"
                stroke-opacity="0.48"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M6.8436 24.5H21.1564C22.3587 24.5 23.3333 23.5254 23.3333 22.3231C23.3333 18.7251 19.9043 16.1173 16.437 17.0785L15.6251 17.3036C14.5617 17.5984 13.4382 17.5984 12.3749 17.3036L11.5629 17.0785C8.09572 16.1173 4.66666 18.7251 4.66666 22.3231C4.66666 23.5254 5.64131 24.5 6.8436 24.5Z"
                stroke="black"
                stroke-opacity="0.48"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </>
          )}
        </svg>
      }
    />
  );
};

export default UserIcon;
