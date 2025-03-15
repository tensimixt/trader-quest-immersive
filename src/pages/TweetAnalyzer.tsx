import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, ArrowLeft, History, AlertTriangle, Settings, Info, Download } from 'lucide-react';
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { fetchTweets, classifyTweet, fetchTweetsByTimestamp } from '@/integrations/twitter/client';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { CopyButton } from '@/components/copy-button';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from 'lucide-react';
import { useTheme } from "@/components/theme-provider"
import { ModeToggle } from '@/components/mode-toggle';
import { Github } from 'lucide-react';
import { Twitter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { enUS } from 'date-fns/locale'
import { DateRange } from "react-day-picker"
import { addDays } from 'date-fns';

const TweetAnalyzer: React.FC = () => {
  const [tweets, setTweets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [confidenceThreshold, setConfidenceThreshold] = useState(50);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60); // seconds
  const [isHistoricalMode, setIsHistoricalMode] = useState(false);
  const [historicalSince, setHistoricalSince] = useState<DateRange | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isHistoricalSettingsOpen, setIsHistoricalSettingsOpen] = useState(false);
  const [isHistoricalLoading, setIsHistoricalLoading] = useState(false);
  const [historicalStatus, setHistoricalStatus] = useState('Idle');
  const [isHistoricalComplete, setIsHistoricalComplete] = useState(false);
  const [isHistoricalError, setIsHistoricalError] = useState(false);
  const [historicalError, setHistoricalError] = useState('');
  const [isHistoricalModeNewer, setIsHistoricalModeNewer] = useState(false);
  const [isHistoricalModeOlder, setIsHistoricalModeOlder] = useState(false);
  const [isHistoricalModeRange, setIsHistoricalModeRange] = useState(false);
  const [isHistoricalModeNewerLoading, setIsHistoricalModeNewerLoading] = useState(false);
  const [isHistoricalModeOlderLoading, setIsHistoricalModeOlderLoading] = useState(false);
  const [isHistoricalModeRangeLoading, setIsHistoricalModeRangeLoading] = useState(false);
  const [isHistoricalModeNewerComplete, setIsHistoricalModeNewerComplete] = useState(false);
  const [isHistoricalModeOlderComplete, setIsHistoricalModeOlderComplete] = useState(false);
  const [isHistoricalModeRangeComplete, setIsHistoricalModeRangeComplete] = useState(false);
  const [isHistoricalModeNewerError, setIsHistoricalModeNewerError] = useState(false);
  const [isHistoricalModeOlderError, setIsHistoricalModeOlderError] = useState(false);
  const [isHistoricalModeRangeError, setIsHistoricalModeRangeError] = useState(false);
  const [historicalModeNewerError, setHistoricalModeNewerError] = useState('');
  const [historicalModeOlderError, setHistoricalModeOlderError] = useState('');
  const [historicalModeRangeError, setHistoricalModeRangeError] = useState('');
  const [historicalModeNewerStatus, setHistoricalModeNewerStatus] = useState('Idle');
  const [historicalModeOlderStatus, setHistoricalModeOlderStatus] = useState('Idle');
  const [historicalModeRangeStatus, setHistoricalModeRangeStatus] = useState('Idle');
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('json');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isHistoricalModeNewerRunning, setIsHistoricalModeNewerRunning] = useState(false);
  const [isHistoricalModeOlderRunning, setIsHistoricalModeOlderRunning] = useState(false);
  const [isHistoricalModeRangeRunning, setIsHistoricalModeRangeRunning] = useState(false);

  const autoRefreshIntervalRef = useRef<number | null>(null);

  const refreshTweets = async () => {
    try {
      setIsLoading(true);
      setStatus('Refreshing tweets...');
      const fetchedTweets = await fetchTweets();
      if (fetchedTweets && Array.isArray(fetchedTweets.tweets)) {
        const classifiedTweets = fetchedTweets.tweets.map(tweet => classifyTweet(tweet));
        setTweets(classifiedTweets);
        setStatus(`Successfully refreshed ${classifiedTweets.length} tweets.`);
        toast({
          title: "Tweets refreshed",
          description: `Successfully refreshed ${classifiedTweets.length} tweets.`,
        })
      } else {
        setStatus('Failed to refresh tweets: Invalid data format.');
        toast({
          variant: "destructive",
          title: "Refresh failed",
          description: "Failed to refresh tweets: Invalid data format.",
        })
      }
    } catch (error: any) {
      console.error('Error refreshing tweets:', error);
      setStatus(`Error: ${error.message}`);
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: error.message,
      })
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAutoRefresh) {
      if (!autoRefreshIntervalRef.current) {
        autoRefreshIntervalRef.current = window.setInterval(refreshTweets, refreshInterval * 1000);
        console.log(`Auto-refresh started. Interval: ${refreshInterval} seconds`);
      }
    } else {
      if (autoRefreshIntervalRef.current) {
        window.clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
        console.log('Auto-refresh stopped.');
      }
    }

    return () => {
      if (autoRefreshIntervalRef.current) {
        window.clearInterval(autoRefreshIntervalRef.current);
        console.log('Auto-refresh cleanup.');
      }
    };
  }, [isAutoRefresh, refreshInterval]);

  const handleConfidenceChange = (value: number[]) => {
    setConfidenceThreshold(value[0]);
  };

  const filteredTweets = tweets.filter(tweet => tweet.confidence >= confidenceThreshold);

  const clearTweets = () => {
    setTweets([]);
    setStatus('Tweets cleared.');
    toast({
      title: "Tweets cleared",
      description: "All tweets have been cleared from the display.",
    })
  };

  const fetchHistoricalTweetsNewer = async () => {
    setIsHistoricalModeNewerRunning(true);
    setIsHistoricalModeNewerComplete(false);
    setIsHistoricalModeNewerError(false);
    setHistoricalModeNewerStatus('Fetching historical tweets (newer)...');
    try {
      setIsHistoricalModeNewerLoading(true);
      const result = await fetchTweetsByTimestamp({ cursorType: 'newer', maxBatches: 5 });
      if (result.success) {
        setHistoricalModeNewerStatus(`Successfully fetched ${result.tweetsStored} historical tweets (newer).`);
        toast({
          title: "Historical tweets fetched (newer)",
          description: `Successfully fetched ${result.tweetsStored} historical tweets (newer).`,
        })
        setIsHistoricalModeNewerComplete(true);
        await refreshTweets();
      } else {
        setHistoricalModeNewerStatus(`Error: ${result.error}`);
        setHistoricalModeNewerError(result.error);
        setIsHistoricalModeNewerError(true);
        toast({
          variant: "destructive",
          title: "Historical tweets fetch failed (newer)",
          description: result.error,
        })
      }
    } catch (error: any) {
      console.error('Error fetching historical tweets (newer):', error);
      setHistoricalModeNewerStatus(`Error: ${error.message}`);
      setHistoricalModeNewerError(error.message);
      setIsHistoricalModeNewerError(true);
      toast({
        variant: "destructive",
        title: "Historical tweets fetch failed (newer)",
        description: error.message,
      })
    } finally {
      setIsHistoricalModeNewerLoading(false);
      setIsHistoricalModeNewerRunning(false);
    }
  };

  const fetchHistoricalTweetsOlder = async () => {
    setIsHistoricalModeOlderRunning(true);
    setIsHistoricalModeOlderComplete(false);
    setIsHistoricalModeOlderError(false);
    setHistoricalModeOlderStatus('Fetching historical tweets (older)...');
    try {
      setIsHistoricalModeOlderLoading(true);
      const result = await fetchTweetsByTimestamp({ cursorType: 'older', maxBatches: 5 });
      if (result.success) {
        setHistoricalModeOlderStatus(`Successfully fetched ${result.tweetsStored} historical tweets (older).`);
        toast({
          title: "Historical tweets fetched (older)",
          description: `Successfully fetched ${result.tweetsStored} historical tweets (older).`,
        })
        setIsHistoricalModeOlderComplete(true);
        await refreshTweets();
      } else {
        setHistoricalModeOlderStatus(`Error: ${result.error}`);
        setHistoricalModeOlderError(result.error);
        setIsHistoricalModeOlderError(true);
        toast({
          variant: "destructive",
          title: "Historical tweets fetch failed (older)",
          description: result.error,
        })
      }
    } catch (error: any) {
      console.error('Error fetching historical tweets (older):', error);
      setHistoricalModeOlderStatus(`Error: ${error.message}`);
      setHistoricalModeOlderError(error.message);
      setIsHistoricalModeOlderError(true);
      toast({
        variant: "destructive",
        title: "Historical tweets fetch failed (older)",
        description: error.message,
      })
    } finally {
      setIsHistoricalModeOlderLoading(false);
      setIsHistoricalModeOlderRunning(false);
    }
  };

  const fetchHistoricalTweetsRange = async () => {
    setIsHistoricalModeRangeRunning(true);
    setIsHistoricalModeRangeComplete(false);
    setIsHistoricalModeRangeError(false);
    setHistoricalModeRangeStatus('Fetching historical tweets (range)...');
    try {
      setIsHistoricalModeRangeLoading(true);
      // Implement range fetching logic here
      setHistoricalModeRangeStatus('Range fetching not implemented yet.');
      toast({
        title: "Historical tweets fetch (range)",
        description: "Range fetching not implemented yet.",
      })
      setIsHistoricalModeRangeComplete(true);
    } catch (error: any) {
      console.error('Error fetching historical tweets (range):', error);
      setHistoricalModeRangeStatus(`Error: ${error.message}`);
      setHistoricalModeRangeError(error.message);
      setIsHistoricalModeRangeError(true);
      toast({
        variant: "destructive",
        title: "Historical tweets fetch failed (range)",
        description: error.message,
      })
    } finally {
      setIsHistoricalModeRangeLoading(false);
      setIsHistoricalModeRangeRunning(false);
    }
  };

  const downloadTweets = async () => {
    setIsDownloading(true);
    try {
      const dataStr = downloadFormat === 'json' ?
        JSON.stringify(tweets, null, 2) :
        convertToCSV(tweets);

      const blob = new Blob([dataStr], { type: `text/${downloadFormat === 'json' ? 'json' : 'csv'}` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tweets.${downloadFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Download started",
        description: `Tweets downloaded successfully in ${downloadFormat} format.`,
      })
    } catch (error: any) {
      console.error('Error downloading tweets:', error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: error.message,
      })
    } finally {
      setIsDownloading(false);
      setIsDownloadModalOpen(false);
    }
  };

  const convertToCSV = (data: any[]) => {
    const csvRows = [];
    const headers = Object.keys(data[0] || {});
    csvRows.push(headers.join(','));

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return `"${value ? String(value).replace(/"/g, '""') : ''}"`;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  // Handler for fetching newer tweets
  const fetchNewerTweets = async () => {
    try {
      setIsLoading(true);
      setStatus('Fetching newer tweets...');
      
      console.log('Calling Twitter API client fetchTweetsByTimestamp with cutoff date');
      
      const result = await fetchTweetsByTimestamp({
        maxBatches: 5,
        cursorType: 'newer',
        cutoffDate: '2025-03-09T13:25:14.763946+00:00' // Your specified cutoff date
      });
      
      console.log('Result from fetchTweetsByTimestamp:', result);
      
      if (result.success) {
        if (result.tweetsStored > 0) {
          setStatus(`Successfully fetched ${result.tweetsStored} new tweets from ${result.batchesProcessed} pages.`);
          toast({
            title: "Tweets fetched successfully",
            description: `Stored ${result.tweetsStored} new tweets from ${result.batchesProcessed} pages`,
          });
        } else {
          setStatus('No new tweets found.');
          toast({
            title: "No new tweets",
            description: "No new tweets were found to store.",
          });
        }
        
        // Refresh tweets list after fetching
        if (result.tweetsStored > 0) {
          await refreshTweets();
        }
      } else {
        setStatus(`Error: ${result.error}`);
        toast({
          variant: "destructive",
          title: "Error fetching tweets",
          description: result.error,
        });
      }
    } catch (error) {
      console.error('Error fetching newer tweets:', error);
      setStatus(`Error: ${error.message}`);
      toast({
        variant: "destructive",
        title: "Error fetching tweets",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="flex flex-col h-screen bg-background text-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={() => window.history.back()} />
          <h1 className="text-xl font-semibold">Tweet Analyzer</h1>
        </div>
        <div className="flex items-center space-x-4">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open user menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={refreshTweets} disabled={isLoading}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isLoading ? 'Refreshing...' : 'Refresh Tweets'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={clearTweets}>
                Clear Tweets
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsAboutOpen(true)}>
                <Info className="mr-2 h-4 w-4" />
                About
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row h-full p-4 space-y-4 md:space-y-0 md:space-x-4">
        {/* Controls Section */}
        <div className="md:w-1/4 flex flex-col space-y-4">
          <div className="bg-card rounded-md p-4 shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Controls</h2>
            <Button variant="outline" className="w-full mb-4" onClick={refreshTweets} disabled={isLoading}>
              {isLoading ? <><RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Refreshing...</> : <><RefreshCcw className="mr-2 h-4 w-4" /> Refresh Tweets</>}
            </Button>
            <Button variant="outline" className="w-full mb-4" onClick={fetchNewerTweets} disabled={isLoading}>
              {isLoading ? <> Fetching Newer Tweets...</> : <> Fetch Newer Tweets</>}
            </Button>
            <Button variant="destructive" className="w-full mb-4" onClick={clearTweets}>
              Clear Tweets
            </Button>
            <Separator className="my-2" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="confidence">Confidence Threshold: {confidenceThreshold}%</Label>
              </div>
              <Slider
                id="confidence"
                defaultValue={[confidenceThreshold]}
                max={100}
                step={1}
                onValueChange={handleConfidenceChange}
                className="mb-4"
              />
            </div>
            <Separator className="my-2" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-refresh">Auto Refresh</Label>
                <Switch
                  id="auto-refresh"
                  checked={isAutoRefresh}
                  onCheckedChange={(checked) => setIsAutoRefresh(checked)}
                />
              </div>
              {isAutoRefresh && (
                <div>
                  <Label htmlFor="refresh-interval">Refresh Interval (seconds):</Label>
                  <Input
                    type="number"
                    id="refresh-interval"
                    value={refreshInterval.toString()}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                    min="10"
                    className="w-full"
                  />
                </div>
              )}
            </div>
            <Separator className="my-2" />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="historical-mode">Historical Mode</Label>
                <Switch
                  id="historical-mode"
                  checked={isHistoricalMode}
                  onCheckedChange={(checked) => setIsHistoricalMode(checked)}
                />
              </div>
              {isHistoricalMode && (
                <Button variant="secondary" className="w-full" onClick={() => setIsHistoricalSettingsOpen(true)}>
                  Historical Settings
                </Button>
              )}
            </div>
            <Separator className="my-2" />
            <Button className="w-full" onClick={() => setIsDownloadModalOpen(true)} disabled={tweets.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Download Tweets
            </Button>
            <Separator className="my-2" />
            <div className="text-sm text-muted-foreground">
              Status: {status}
            </div>
          </div>
        </div>

        {/* Tweets Display Section */}
        <div className="md:w-3/4 bg-card rounded-md p-4 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold mb-2">
            Tweets
            <Badge className="ml-2">{filteredTweets.length}</Badge>
          </h2>
          <ScrollArea className="rounded-md border h-full">
            <Table>
              <TableCaption>A list of tweets that meet the confidence threshold.</TableCaption>
              <TableHead>
                <TableRow>
                  <TableHead className="w-[100px]">Author</TableHead>
                  <TableHead>Tweet</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTweets.map((tweet) => (
                  <TableRow key={tweet.tweet.id}>
                    <TableCell className="font-medium">{tweet.tweet.author?.userName}</TableCell>
                    <TableCell>{tweet.tweet.text}</TableCell>
                    <TableCell>{tweet.market}</TableCell>
                    <TableCell>{tweet.direction}</TableCell>
                    <TableCell>{tweet.confidence}</TableCell>
                    <TableCell>
                      <CopyButton text={tweet.tweet.text} />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTweets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No tweets match the current criteria.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>

      {/* Settings Modal */}
      <AlertDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Adjust application settings to your preference.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Theme</div>
              <ModeToggle />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Auto Refresh</div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-refresh-modal"
                  checked={isAutoRefresh}
                  onCheckedChange={(checked) => setIsAutoRefresh(checked)}
                />
                <Label htmlFor="auto-refresh-modal">Enable Auto Refresh</Label>
              </div>
              {isAutoRefresh && (
                <div>
                  <Label htmlFor="refresh-interval-modal">Refresh Interval (seconds):</Label>
                  <Input
                    type="number"
                    id="refresh-interval-modal"
                    value={refreshInterval.toString()}
                    onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                    min="10"
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsSettingsOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setIsSettingsOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* About Modal */}
      <AlertDialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>About Tweet Analyzer</AlertDialogTitle>
            <AlertDialogDescription>
              Tweet Analyzer is a tool for analyzing tweets from a specific Twitter list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <p className="text-sm">
                This tool fetches tweets, classifies them based on market direction, and displays them in a table.
              </p>
              <p className="text-sm">
                It uses a simple heuristic approach to classify tweets and provides a confidence score for each classification.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Links</div>
              <div className="flex items-center space-x-2">
                <a href="https://github.com/whoisdsmith/twitter-analyzer" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1">
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </a>
                <a href="https://twitter.com/dsmithxyz" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1">
                  <Twitter className="h-4 w-4" />
                  <span>Twitter</span>
                </a>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsAboutOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Historical Settings Modal */}
      <AlertDialog open={isHistoricalSettingsOpen} onOpenChange={setIsHistoricalSettingsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Historical Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Fetch historical tweets based on different modes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Historical Mode</div>
              <div className="flex flex-col space-y-2">
                <Button
                  variant={isHistoricalModeNewer ? "default" : "outline"}
                  onClick={() => {
                    setIsHistoricalModeNewer(true);
                    setIsHistoricalModeOlder(false);
                    setIsHistoricalModeRange(false);
                  }}
                  disabled={isHistoricalModeNewerRunning}
                >
                  {isHistoricalModeNewerLoading ? <><RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Fetching Newer...</> : <><History className="mr-2 h-4 w-4" /> Fetch Newer Tweets</>}
                </Button>
                <Button
                  variant={isHistoricalModeOlder ? "default" : "outline"}
                  onClick={() => {
                    setIsHistoricalModeNewer(false);
                    setIsHistoricalModeOlder(true);
                    setIsHistoricalModeRange(false);
                  }}
                  disabled={isHistoricalModeOlderRunning}
                >
                  {isHistoricalModeOlderLoading ? <><RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Fetching Older...</> : <><History className="mr-2 h-4 w-4" /> Fetch Older Tweets</>}
                </Button>
                <Button
                  variant={isHistoricalModeRange ? "default" : "outline"}
                  onClick={() => {
                    setIsHistoricalModeNewer(false);
                    setIsHistoricalModeOlder(false);
                    setIsHistoricalModeRange(true);
                  }}
                  disabled={isHistoricalModeRangeRunning}
                >
                  {isHistoricalModeRangeLoading ? <><RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Fetching Range...</> : <><History className="mr-2 h-4 w-4" /> Fetch Tweets in Range</>}
                </Button>
              </div>
            </div>
            {isHistoricalModeNewer && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Newer Tweets Settings</div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={fetchHistoricalTweetsNewer}
                  disabled={isHistoricalModeNewerLoading}
                >
                  {isHistoricalModeNewerLoading ? <><RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Fetching...</> : <><History className="mr-2 h-4 w-4" /> Fetch Newer Tweets</>}
                </Button>
                {isHistoricalModeNewerError && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                {isHistoricalModeNewerComplete && (
                  <Badge variant="outline">Complete</Badge>
                )}
                <div className="text-sm text-muted-foreground">
                  Status: {historicalModeNewerStatus}
                </div>
              </div>
            )}
            {isHistoricalModeOlder && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Older Tweets Settings</div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={fetchHistoricalTweetsOlder}
                  disabled={isHistoricalModeOlderLoading}
                >
                  {isHistoricalModeOlderLoading ? <><RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Fetching...</> : <><History className="mr-2 h-4 w-4" /> Fetch Older Tweets</>}
                </Button>
                {isHistoricalModeOlderError && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                {isHistoricalModeOlderComplete && (
                  <Badge variant="outline">Complete</Badge>
                )}
                <div className="text-sm text-muted-foreground">
                  Status: {historicalModeOlderStatus}
                </div>
              </div>
            )}
            {isHistoricalModeRange && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Tweets in Range Settings</div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !historicalSince && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {historicalSince?.from ? (
                        historicalSince.to ? (
                          `${format(historicalSince.from, "LLL dd, y")} - ${format(historicalSince.to, "LLL dd, y")}`
                        ) : (
                          format(historicalSince.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center" side="bottom">
                    <Calendar
                      mode="range"
                      defaultMonth={historicalSince?.from}
                      selected={historicalSince}
                      onSelect={setHistoricalSince}
                      disabled={{ before: new Date('2023-01-01') }}
                      numberOfMonths={2}
                      pagedNavigation
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={fetchHistoricalTweetsRange}
                  disabled={isHistoricalModeRangeLoading || !historicalSince?.from || !historicalSince?.to}
                >
                  {isHistoricalModeRangeLoading ? <><RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> Fetching...</> : <><History className="mr-2 h-4 w-4" /> Fetch Tweets in Range</>}
                </Button>
                {isHistoricalModeRangeError && (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                {isHistoricalModeRangeComplete && (
                  <Badge variant="outline">Complete</Badge>
                )}
                <div className="text-sm text-muted-foreground">
                  Status: {historicalModeRangeStatus}
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsHistoricalSettingsOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => setIsHistoricalSettingsOpen(false)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Download Modal */}
      <AlertDialog open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Download Tweets</AlertDialogTitle>
            <AlertDialogDescription>
              Choose the format for downloading the tweets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Format</div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={downloadFormat === 'json' ? "default" : "outline"}
                  onClick={() => setDownloadFormat('json')}
                >
                  JSON
                </Button>
                <Button
                  variant={downloadFormat === 'csv' ? "default" : "outline"}
                  onClick={() => setDownloadFormat('csv')}
                >
                  CSV
                </Button>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDownloadModalOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick
