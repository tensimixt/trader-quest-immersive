
import React from 'react';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import TweetClassifier from '@/components/TweetClassifier';
import { WalletAuthButton } from '@/components/WalletAuthButton';

const TweetAnalytics = () => {
  return (
    <div className="min-h-screen overflow-hidden bat-grid">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-4 h-screen flex flex-col relative"
      >
        <WalletAuthButton />
        <AppHeader />
        
        <div className="flex flex-col gap-4 h-[90vh]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <TweetClassifier />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default TweetAnalytics;
