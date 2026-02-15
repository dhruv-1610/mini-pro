import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { HeroSection } from '../components/home/HeroSection';
import { ImpactStats } from '../components/home/ImpactStats';
import { HowItWorks } from '../components/home/HowItWorks';
import { FeaturedDrivesCarousel } from '../components/home/FeaturedDrivesCarousel';
import { MapPreview } from '../components/home/MapPreview';

export function HomePage(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ImpactStats />
        <HowItWorks />
        <FeaturedDrivesCarousel />
        <MapPreview />
      </main>
      <Footer />
    </div>
  );
}
