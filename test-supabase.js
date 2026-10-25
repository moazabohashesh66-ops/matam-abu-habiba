import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bdbmlqecqso.supabase.co'
const supabaseAnonKey = 'sb_publishable_Ra2fHtKw-QLjFGA7FPU_Yw_9GadlJW_'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase.from('categories').select('*')
  console.log('Data:', data)
  console.log('Error:', error)
}

test()