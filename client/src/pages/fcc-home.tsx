import { FccHomeHero } from "../brands/fcc/FccHomeHero";
import { HeadHome } from "@/components/HeadHome";
import { useQuery } from "@tanstack/react-query";

export default function FabCardCoHomePage() {
  // Fetch SEO metadata for the FCC homepage
  const { data: seoData } = useQuery({
    queryKey: ['/api/seo/meta/section', '/fcc', 'home.lifestyle_ol1'],
    queryFn: async () => {
      const response = await fetch('/api/seo/meta/section?route=/fcc&section_key=home.lifestyle_ol1&locale=en');
      const json = await response.json();
      return json.seo;
    },
  });

  return (
    <main data-brand="fcc" className="min-h-screen bg-background">
      <HeadHome seo={seoData} />
      
      {/* Hero Banner - DB-driven lifestyle image */}
      <FccHomeHero />
      
      {/* Future sections below, e.g. collections, cards, etc. */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">
          Fab Card Co – Authentic Greeting Cards
        </h2>
        <p className="text-center text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover our collection of authentic, heartfelt greeting cards designed to celebrate life's moments.
        </p>
      </section>
    </main>
  );
}
