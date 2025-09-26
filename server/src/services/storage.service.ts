import { supabase } from "../config/supabase";

export async function uploadFile(objectPath: string, fileBuffer: Buffer) {
  const BUCKET_NAME = process.env.SUPABASE_BUCKET!;
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(objectPath, fileBuffer);

  if (error) {
    throw new Error(`Failed to upload file: ${error?.message}`);
  } else {
    return data?.fullPath;
  }
}

export async function removeFile(objectPath: string) {
  const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME!;
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([objectPath])

  if (error) {
    throw new Error(`Failed to delete file: ${error?.message}`);
  }
}
