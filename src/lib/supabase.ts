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
}

export type CropFields = Pick<Photo, 'pos_x' | 'pos_y' | 'zoom' | 'orient'>

const PHOTO_COLS = 'id, order_index, image_url, title, caption, rotation, pos_x, pos_y, zoom, orient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function fetchPhotos(): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('picture_of_us')
    .select(PHOTO_COLS)
    .not('image_url', 'ilike', '%IMG_6.jpg')
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

export async function fetchPhotoByFile(filename: string): Promise<Photo | null> {
  const { data, error } = await supabase
    .from('picture_of_us')
    .select(PHOTO_COLS)
    .ilike('image_url', `%${filename}`)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updatePhotoCrop(id: number, fields: CropFields): Promise<void> {
  const { error } = await supabase.from('picture_of_us').update(fields).eq('id', id)
  if (error) throw error
}
