// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://howkdvlrtgstielnrfiw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvd2tkdmxydGdzdGllbG5yZml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2MTc1NTAsImV4cCI6MjA1NjE5MzU1MH0.EFti52esjbVBbKtAoVA5OQX3ForcYLLRae4vSmHiT6w";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);