import Hero from '@/components/home/hero';
import FeaturedArticles from '@/components/home/featured-articles';
import Categories from '@/components/home/categories';
import Newsletter from '@/components/newsletter';
import PremiumPreview from '@/components/home/premium-preview';
import AdBanner from '@/components/ads/ad-banner';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Hero />
      
      {/* Top ad banner */}
      <div className="my-8">
        <AdBanner position="top" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <FeaturedArticles />
          <Categories />
        </div>
        
        <div className="space-y-8">
          <PremiumPreview />
          <AdBanner position="sidebar" />
          <Newsletter />
        </div>
      </div>
    </div>
  );
}