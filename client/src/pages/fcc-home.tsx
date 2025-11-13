// client/src/pages/fcc-home.tsx
import * as React from "react";
import { FccHomeHero } from "../brands/fcc/FccHomeHero";

export default function FccHomePage() {
  return (
    <main data-brand="fcc">
      {/* DB-driven lifestyle hero */}
      <FccHomeHero />

      {/* TODO: add collection rails, card grids, etc. under here */}
      <section className="fcc-home-body">
        {/* Placeholder content for now */}
      </section>
    </main>
  );
}
