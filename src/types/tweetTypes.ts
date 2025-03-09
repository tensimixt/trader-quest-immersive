
export interface TweetAuthor {
  userName: string;
  name: string;
  profilePicture: string;
}

export interface TweetMedia {
  type: string;
  url: string;
  expandedUrl: string;
}

export interface QuotedTweet {
  text: string;
  author?: TweetAuthor;
  entities?: {
    media?: {
      type: string;
      media_url_https: string;
      expanded_url: string;
    }[];
  };
  extendedEntities?: {
    media?: {
      type: string;
      media_url_https: string;
      expanded_url: string;
    }[];
  };
}

export interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  author: TweetAuthor;
  isReply: boolean;
  isQuote: boolean;
  inReplyToId?: string;
  quoted_tweet?: QuotedTweet;
  entities?: {
    media?: {
      type: string;
      media_url_https: string;
      expanded_url: string;
    }[];
  };
  extendedEntities?: {
    media?: {
      type: string;
      media_url_https: string;
      expanded_url: string;
    }[];
  };
  classification?: TweetClassification;
}

export interface TweetClassification {
  market: string;
  direction: string;
  confidence: number;
  explanation: string;
}

export interface ClassifiedTweet {
  id: string;
  market: string;
  direction: string;
  confidence: number;
  explanation: string;
  tweetText: string;
  screenName: string;
  isQuote: boolean;
  isReply: boolean;
  quoteTweetText?: string;
  quoteAuthor?: string;
  replyTweetText?: string;
  timestamp: string;
  media?: TweetMedia[];
}

export interface HistoricalTweetBatch {
  success: boolean;
  totalFetched: number;
  nextCursor: string | null;
  pagesProcessed: number; // Added this property to match the API response
  message: string;
  error?: string;
}

export interface HistoricalTweetResponse {
  tweets: Tweet[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
