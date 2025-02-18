
// These values represent position changes relative to previous rankings
// Positive numbers mean the trader moved up (improved rank)
// Negative numbers mean the trader moved down (worse rank)
export const demoRankChanges = [
  0,    // BLOCKWIZARD - Rank unchanged
  +2,   // BLOCKSMITH - Moved up 2 positions
  -1,   // SATSSTACK - Moved down 1 position
  +3,   // BITLORD - Moved up 3 positions
  -2,   // CRYPTOKING - Moved down 2 positions
  // Additional rank changes for remaining positions
  +1, -3, 0, +4, -2,
  +2, -1, +3, 0, -2, 
  +1, -1, +2, -3, +1,
  0, +2, -1, +3, -2
];

export const demoROI = [
  -3.21,  // BLOCKWIZARD
  12.54,  // BLOCKSMITH
  5.67,   // SATSSTACK
  -2.18,  // BITLORD
  15.32,  // CRYPTOKING
  // Additional ROI values for remaining traders
  7.89, -4.56, 9.23, 3.45, -1.98,
  6.78, 11.23, -5.43, 4.56, 8.90,
  -2.34, 13.45, 6.78, -3.21, 8.42
];
