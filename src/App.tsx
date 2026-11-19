/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { AppProvider, useApp } from './context/AppContext';
import { AdminPage } from './pages/AdminPage';
import { BarbersPage } from './pages/BarbersPage';
import { BookingPage } from './pages/BookingPage';
import { ContactsPage } from './pages/ContactsPage';
import { GalleryPage } from './pages/GalleryPage';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';

const AppShell: React.FC = () => {
  const { currentPath, toastMessage } = useApp();

  const renderPage = () => {
    switch (currentPath) {
      case '/services':
        return <ServicesPage />;
      case '/barbers':
        return <BarbersPage />;
      case '/gallery':
        return <GalleryPage />;
      case '/booking':
        return <BookingPage />;
      case '/contacts':
        return <ContactsPage />;
      case '/admin':
        return <AdminPage />;
      case '/':
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0B] text-[#F5F2EB]">
      <Navbar />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPath}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 right-5 z-50 rounded-lg border border-[#C8A45D]/50 bg-[#141417] px-4 py-3 text-xs font-medium text-[#F5F2EB] shadow-lg"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <AppShell />
      </AppProvider>
    </MotionConfig>
  );
}
