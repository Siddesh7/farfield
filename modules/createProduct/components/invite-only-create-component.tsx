import { BoxContainer } from "@/components/common/box-container";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useGrantSellerAccess } from "@/query/use-seller-access";
import { useUserProfile } from "@/query/use-user-profile";
import React, { useState } from "react";

const InviteCodeComponent = () => {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const { data: userProfile } = useUserProfile();
  const grantSellerAccess = useGrantSellerAccess();

  const handleInviteCode = async () => {
    setError("");

    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }

    if (inviteCode.trim().length < 3) {
      setError("Invite code must be at least 3 characters long");
      return;
    }

    if (!userProfile?.farcasterFid) {
      setError("Unable to get your Farcaster ID");
      return;
    }

    try {
      await grantSellerAccess.mutateAsync({
        fid: userProfile.farcasterFid,
        code: inviteCode.trim()
      });
      
      // If successful, the seller access query will be invalidated and refetched
      // The parent component will automatically show the add product form
    } catch (error: any) {
      setError(error.message || "Invalid invite code");
    }
  };

  const handleRequestInvite = () => {
    window.open('https://t.me/+torthfG5NCNkY2Nl', '_blank');
  };

  return (
    <BoxContainer className="flex flex-col gap-8 pt-5 px-5.5 flex-1 h-[100vh] justify-center items-center">
      <div className="flex flex-col gap-2 items-center">
        <h1 className="font-awesome font-medium text-2xl leading-[120%] tracking-tight align-middle">
          Start with an invite.
        </h1>
        <p className="text-[#00000052] text-sm">
          You need an invite code to create your first product.
        </p>
      </div>

      <div className="flex flex-col gap-3 min-w-[250px]">
        <div className="flex flex-col gap-1">
          <Input
            value={inviteCode}
            onChange={(e) => {
              e.preventDefault();
              setInviteCode(e.target.value);
              if (error) setError("");
            }}
            placeholder="Enter invite code"
            className={`px-3 py-3 text-sm bg-[#0000000A] min-h-[40px] rounded-lg ${
              error ? "border-red-500 focus:border-red-500" : ""
            }`}
          />
          {error && <p className="text-red-500 text-xs px-1">{error}</p>}
        </div>
        <Button
          className="rounded-lg min-h-[40px]"
          size="default"
          onClick={handleInviteCode}
          disabled={!inviteCode.trim() || grantSellerAccess.isPending}
        >
          {grantSellerAccess.isPending ? (
            <div className="flex gap-1 items-center">
              <LoadingSpinner size="sm" color="secondary" />
              Verifying Code...
            </div>
          ) : (
            "Start Selling"
          )}
        </Button>
      </div>

      <div
        className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent border-t border-dashed border-gray-300"
        style={{
          borderStyle: "dashed",
          borderWidth: "1px 0 0 0",
          borderColor: "#d1d5db",
          borderImage:
            "repeating-linear-gradient(to right, #d1d5db 0, #d1d5db 8px, transparent 8px, transparent 12px) 1",
        }}
      ></div>

      <div className="text-sm">
        <p className="text-[#00000052]">
          Want an invite?{" "}
          <span
            onClick={handleRequestInvite}
            className="underline underline-offset-2 text-black cursor-pointer"
          >
            {" "}
            Request one here{" "}
          </span>
        </p>
      </div>
    </BoxContainer>
  );
};

export default InviteCodeComponent;
