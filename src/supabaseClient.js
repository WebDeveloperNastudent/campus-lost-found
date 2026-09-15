import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase env vars. Copy .env.example to .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

// Kunin muna kung galing ba tayo sa pag-click ng magic link BAGO ito
// i-clear/i-strip ng Supabase client sa URL pagkatapos ng auto-detect nito.
if (typeof window !== 'undefined') {
  const hash = window.location.hash
  if (hash.includes('access_token') && hash.includes('type=magiclink')) {
    sessionStorage.setItem('cw_magic_link_pending', '1')
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)