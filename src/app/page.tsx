"use client";

import { useState, useEffect } from 'react';
import { Hero } from '@/components/sections/Hero';
import { Features } from '@/components/sections/Features';
import { About } from '@/components/sections/About';
import { Contact } from '@/components/sections/Contact';
import { Footer } from '@/components/sections/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const [showGuestModal, setShowGuestModal] = useState(false);

  useEffect(() => {
    // Auto open after 1s
    const timer = setTimeout(() => setShowGuestModal(true), 1000);
    const openHandler = () => setShowGuestModal(true);
    window.addEventListener('open-guest-modal', openHandler as EventListener);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('open-guest-modal', openHandler as EventListener);
    };
  }, []);

  return (
    <>
      <Navbar />

      {showGuestModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5000,
          padding: 16
        }}>
          <div style={{
            width: '100%',
            maxWidth: 640,
            background: 'var(--color-surface, #0b0b0b)',
            color: 'var(--color-text, #e5e7eb)',
            border: '1px solid var(--color-border, #2a2a2a)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-2xl, 0 20px 45px rgba(0,0,0,0.35))',
            padding: 24
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Guest Access</h3>
              <button
                aria-label="Close"
                onClick={() => setShowGuestModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  fontSize: 18,
                  cursor: 'pointer'
                }}
              >✕</button>
            </div>

            <div style={{ marginTop: 12, lineHeight: 1.6 }}>
      
              <h2 style={{ margin: '8px 0 0 0', fontSize: '1.5rem' }}>✨ Welcome, SIH Evaluator</h2>
              <p style={{ margin: 0, color: 'var(--color-text-secondary, #a1a1aa)' }}>
                We know your time is valuable, and you have many teams to review.
              </p>
              <p style={{ margin: '8px 0 0 0', color: 'var(--color-text-secondary, #a1a1aa)' }}>
                A quick guest access has been provided so you can immediately explore Optimetro’s features — no sign-up required!
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginTop: 20, width: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                <a href="/admin/dashboard?guest=1" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
                  <Button variant="primary" size="lg" style={{ width: '100%', justifyContent: 'center' }}>
                    Admin Dashboard
                  </Button>
                </a>
                <span style={{ fontSize: 12, color: 'var(--color-text)' }}>
                  Explore full operations dashboard
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
                <a href="/commuter/dashboard?guest=1" style={{ textDecoration: 'none', display: 'block', width: '100%' }}>
                  <Button variant="outline" size="lg" style={{ width: '100%', justifyContent: 'center' }}>
                    Commuter Dashboard
                  </Button>
                </a>
                <span style={{ fontSize: 12, color: 'var(--color-text)' }}>
                  Explore our special add-on features for commuters
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Hero />
      <Features />
      <About />
      <Contact />
      <Footer />
    </>
  );
}
