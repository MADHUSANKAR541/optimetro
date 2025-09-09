import { Hero } from '@/components/sections/Hero';
import { Features } from '@/components/sections/Features';
import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';
import { Navbar } from '@/components/layout/Navbar';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <About />
      <Contact />
    </>
  );
}
