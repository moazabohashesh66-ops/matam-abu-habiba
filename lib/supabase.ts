import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bdbmlqecqso.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_Ra2fHtKw-QLjFGA7FPU_Yw_9GadlJW_'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)