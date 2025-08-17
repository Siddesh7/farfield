import Image from "next/image";
import React from "react";
import { Button } from "../ui";
import { ArrowUpRight } from "lucide-react";

const DesktopLayout = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center justify-center gap-15 z-50">
        <div className="font-awesome flex flex-col items-center gap-2">
          <p className="text-3xl text-[#00000066]">
            Desktop version coming soon
          </p>
          <p className="text-5xl ">Please open this app in Farcaster</p>
        </div>
        <Button
          size="lg"
          className="min-w-md"
          onClick={() => {
            window.open(
              "https://farcaster.xyz/miniapps/9OlQm7ZO9S_M/farfield",
              "_blank"
            );
          }}
        >
          {" "}
          Open In Farcaster <ArrowUpRight />
        </Button>
      </div>
      <div className="fixed bottom-0">
        <Image
          src="/desktop-logo.png"
          alt="Desktop Logo"
          width={1400}
          height={140}
        />
      </div>
    </div>
  );
};

export default DesktopLayout;
