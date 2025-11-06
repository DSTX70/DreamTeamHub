import { useCmdK } from "@/hooks/useCmdK";
import CmdK from "@/components/CmdK";

type CmdKProviderProps = {
  scope?: {
    owner: "GLOBAL" | "BU" | "BRAND" | "PRODUCT";
    ownerId?: string;
  };
  children: React.ReactNode;
};

export default function CmdKProvider({ scope, children }: CmdKProviderProps) {
  const { open, setOpen } = useCmdK();

  return (
    <>
      <CmdK open={open} onClose={() => setOpen(false)} scope={scope} />
      {children}
    </>
  );
}
