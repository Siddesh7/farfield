import { FC } from "react";
import IconWrapper from "../icon-wrapper";
import { IconProps } from "../icon.types";

const HistoryIcon: FC<IconProps> = ({ width, isActive = false, onClick }) => {
  return (
    <IconWrapper
      width={width}
      onClick={onClick}
      icon={
        <svg
          width="inherit"
          height="inherit"
          viewBox="0 0 29 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isActive ? (
            <path d="M22.5844 3.96167C22.9671 5.42481 23.1583 6.93078 23.1538 8.4419C23.1527 8.83651 22.8225 8.9641 22.501 9.03528L22.4984 9.03584M18.2294 9.44197C19.6645 9.48214 21.0983 9.34553 22.4984 9.03584M22.4984 9.03584C21.0987 6.81508 18.7755 5.19466 15.9754 4.77753C10.877 4.01802 6.12827 7.53538 5.36876 12.6338C4.60924 17.7322 8.1266 22.4809 13.225 23.2405C18.1399 23.9726 22.7299 20.7302 23.7344 15.9284M16.8332 17.5L14.8415 15.5083C14.6228 15.2895 14.4998 14.9928 14.4998 14.6834V10.5" stroke="black" stroke-opacity="0.88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          ) : (
            <path
              d="M22.5846 3.96167C22.9673 5.42481 23.1585 6.93078 23.154 8.4419C23.1528 8.83651 22.8227 8.9641 22.5011 9.03528L22.4986 9.03584M18.2296 9.44197C19.6647 9.48214 21.0984 9.34553 22.4986 9.03584M22.4986 9.03584C21.0989 6.81508 18.7757 5.19466 15.9756 4.77753C10.8772 4.01802 6.12844 7.53538 5.36892 12.6338C4.60941 17.7322 8.12677 22.4809 13.2252 23.2405C18.1401 23.9726 22.7301 20.7302 23.7345 15.9284M16.8333 17.5L14.8417 15.5083C14.6229 15.2895 14.5 14.9928 14.5 14.6834V10.5"
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

export default HistoryIcon;
