
import React from 'react';
import { motion } from 'framer-motion';
import { AppHeader } from '@/components/AppHeader';
import TweetClassifier from '@/components/TweetClassifier';
import { useTweetFetching } from '@/hooks/useTweetFetching';
import TweetToolbar from '@/components/TweetToolbar';

const TweetAnalyzer = () => {
  const {
    tweetData,
    isLoading,
    isHistoricalLoading,
    isFetchingUntilCutoff,
    isFetchingNew,
    searchTerm,
    setSearchTerm,
    fetchingMode,
    isPossiblyAtEnd,
    isSearching,
    batchSize,
    setBatchSize,
    tweetsPerRequest,
    setTweetsPerRequest,
    isAutoClickEnabled,
    setIsAutoClickEnabled,
    isUntilCutoffDialogOpen,
    setIsUntilCutoffDialogOpen,
    cutoffDate,
    isLatestDateLoading,
    continueButtonRef,
    toggleFetchingMode,
    handleSearchSubmit,
    handleRetryFetch,
    handleRetryHistorical,
    handleStartNewHistorical,
    fetchTweetsUntilCutoff,
    fetchNewTweets,
    fetchLatestTweetDate
  } = useTweetFetching();

  return (
    <div className="min-h-screen overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-4 flex flex-col min-h-screen"
      >
        <AppHeader />
        
        <TweetToolbar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          fetchingMode={fetchingMode}
          toggleFetchingMode={toggleFetchingMode}
          batchSize={batchSize}
          setBatchSize={setBatchSize}
          tweetsPerRequest={tweetsPerRequest}
          setTweetsPerRequest={setTweetsPerRequest}
          isAutoClickEnabled={isAutoClickEnabled}
          setIsAutoClickEnabled={setIsAutoClickEnabled}
          isLatestDateLoading={isLatestDateLoading}
          fetchLatestTweetDate={fetchLatestTweetDate}
          isPossiblyAtEnd={isPossiblyAtEnd}
          isHistoricalLoading={isHistoricalLoading}
          continueButtonRef={continueButtonRef}
          handleRetryHistorical={handleRetryHistorical}
          handleStartNewHistorical={handleStartNewHistorical}
          isUntilCutoffDialogOpen={isUntilCutoffDialogOpen}
          setIsUntilCutoffDialogOpen={setIsUntilCutoffDialogOpen}
          cutoffDate={cutoffDate}
          isFetchingUntilCutoff={isFetchingUntilCutoff}
          isFetchingNew={isFetchingNew}
          fetchTweetsUntilCutoff={fetchTweetsUntilCutoff}
          fetchNewTweets={fetchNewTweets}
          handleRetryFetch={handleRetryFetch}
          isLoading={isLoading}
        />
        
        <div className="flex-1 glass-card rounded-2xl p-4 lg:p-6 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
          <TweetClassifier 
            tweets={tweetData} 
            isLoading={isLoading} 
            isSearching={isSearching} 
            searchTerm={searchTerm} 
          />
        </div>
      </motion.div>
    </div>
  );
};

export default TweetAnalyzer;
