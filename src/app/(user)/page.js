// src/app/(user)/page.js
import HeroSection from "./HeroPage/HeroSection";
import Features from "./HeroPage/Features";
import Testimonials from "./HeroPage/Testimonials";
import Pricing from "./HeroPage/NewArrival";
import CatalogPage from '@/app/(user)/ProductsCatalogue/page';
export default function Home() {
  return (
    <div>
      <HeroSection />
      <Features />
      <Pricing />
      <Testimonials />
      {/* <CatalogPage/> */}
    </div>
  );
}
