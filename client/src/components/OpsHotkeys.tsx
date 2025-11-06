import { useLocation } from "wouter";
import { useHotkeys } from "@/hooks/useHotkeys";

type OpsHotkeysProps = {
  navigate?: (path: string) => void;
};

export default function OpsHotkeys({ navigate: customNavigate }: OpsHotkeysProps = {}) {
  const [, setLocation] = useLocation();
  const navigate = customNavigate || setLocation;

  useHotkeys({
    g: {
      o: () => navigate("/ops/overview"),
      i: () => navigate("/ops/inventory"),
      m: () => navigate("/ops/images"),
      a: () => navigate("/ops/affiliates"),
      s: () => navigate("/ops/settings"),
    },
  });

  return null;
}
