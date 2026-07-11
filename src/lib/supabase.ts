import { createClient } from '@supabase/supabase-js'

export type Photo = {
  id: number
  order_index: number
  image_url: string
  title: string
  caption: string | null
  rotation: number
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function fetchPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('picture_of_us')
    .select('id, order_index, image_url, title, caption, rotation')
    .not('image_url', 'ilike', '%IMG_6.jpg')
    .order('order_index')
  if (error) throw error
  return data
}
