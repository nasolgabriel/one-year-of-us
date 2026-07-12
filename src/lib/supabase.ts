import { createClient } from '@supabase/supabase-js'

export type Photo = {
  id: number
  order_index: number
  image_url: string
  title: string
  caption: string | null
  rotation: number
  pos_x: number
  pos_y: number
  zoom: number
  orient: number
  featured: boolean
}

export type PhotoUpdate = Partial<Omit<Photo, 'id' | 'image_url'>>

const PHOTO_COLS =
  'id, order_index, image_url, title, caption, rotation, pos_x, pos_y, zoom, orient, featured'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// Album photos: order_index 0 means hidden; anything above shows, in order.
export async function fetchPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('picture_of_us')
    .select(PHOTO_COLS)
    .gt('order_index', 0)
    .order('order_index')
  if (error) throw error
  return data
}

export async function fetchAllPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('picture_of_us')
    .select(PHOTO_COLS)
    .order('order_index')
  if (error) throw error
  return data
}

// The single "first photo of us" frame in Before & Beginning.
export async function fetchFeaturedPhoto(): Promise<Photo | null> {
  const { data, error } = await supabase
    .from('picture_of_us')
    .select(PHOTO_COLS)
    .eq('featured', true)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updatePhoto(id: number, fields: PhotoUpdate): Promise<void> {
  const { error } = await supabase.from('picture_of_us').update(fields).eq('id', id)
  if (error) throw error
}

// Only one photo may be featured — clear the flag everywhere before setting it.
export async function clearFeatured(): Promise<void> {
  const { error } = await supabase
    .from('picture_of_us')
    .update({ featured: false })
    .eq('featured', true)
  if (error) throw error
}
