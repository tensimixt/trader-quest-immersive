// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://zzbftruhrjfmynhamypk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6YmZ0cnVocmpmbXluaGFteXBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5MzI2OTMsImV4cCI6MjA1MzUwODY5M30.v-Oz5lCbpoB9aQvq43WSaZ8DKy1wthSPQYeD8KzixKo";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);