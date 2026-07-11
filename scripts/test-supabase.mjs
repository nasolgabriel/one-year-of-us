import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => {
      const i = line.indexOf('=')
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    })
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const { data, error } = await supabase
  .from('picture_of_us')
  .select('*')
  .order('order_index')

if (error) {
  console.error('FAILED:', error.message)
  process.exit(1)
}

console.log(`OK — ${data.length} rows fetched`)
console.table(data.map((r) => ({ id: r.id, order: r.order_index, title: r.title, url: r.image_url })))
