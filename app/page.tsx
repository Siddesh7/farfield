"use client";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

export default function Home() {
  const { ready, authenticated, logout, login } = usePrivy();
  const { address } = useAccount();
  if (!ready) return <div>Loading...</div>;

  return (
    <div>
      {authenticated ? (
        <div>
          <p>Address: {address}</p>
          <Button onClick={() => logout()}>Logout</Button>
        </div>
      ) : (
        <Button onClick={() => login()}>Login</Button>
      )}
    </div>
  );
}
