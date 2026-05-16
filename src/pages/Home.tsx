import React, { useEffect } from 'react';
import Banner from '../components/Banner';
import Categories from '../components/Categories';
import FeaturedProducts from '../components/FeaturedProducts';
import Features from '../components/Features';

const Home: React.FC = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <main>
      <Banner />
      <Categories />
      <FeaturedProducts />
      <Features />
    </main>
  );
};

export default Home;


