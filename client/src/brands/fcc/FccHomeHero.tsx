import * as React from "react";
import PictureBanner from "../../components/fcc/PictureBanner"; 

type HomeHeroState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; baseKey: string; label?: string | null };

export function FccHomeHero() {
  const [state, setState] = React.useState<HomeHeroState>({ status: "loading" });

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/fcc/home-hero");
        if (!res.ok) throw new Error("bad status");

        const data = await res.json();
        if (!data.ok || !data.baseKey) throw new Error("no baseKey");

        if (!cancelled) {
          setState({
            status: "ready",
            baseKey: data.baseKey as string,
            label: (data.label as string | null) ?? undefined,
          });
        }
      } catch (err) {
        console.error("Failed to load FCC home hero", err);
        if (!cancelled) {
          setState({ status: "error" });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Soft placeholder while loading
  if (state.status === "loading") {
    return (
      <div
        data-brand="fcc"
        className="fcc-home-hero-placeholder"
        aria-hidden="true"
      >
        {/* subtle gradient / skeleton; purely visual */}
      </div>
    );
  }

  // Fallback: use a known-good static key if the API fails
  if (state.status === "error") {
    return (
      <PictureBanner
        baseKey="fcc/lifestyle/OL-1_Brunch_Banter_SKU-OL-PRIDE-001"
        className="fcc-home-hero-fallback"
      />
    );
  }

  // Happy path: DB-driven baseKey
  return (
    <PictureBanner
      baseKey={state.baseKey}
      className="fcc-home-hero"
    />
  );
}
