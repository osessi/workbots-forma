// Client Supabase (browser only - safe for "use client" components)
export { createBrowserClient, getSupabaseBrowserClient } from "./client";

// NOTE: Server functions must be imported directly from:
// - "./server" for createSupabaseServerClient, createSupabaseAdminClient
// - "./storage" for server-side storage functions
// These use "next/headers" which is not available in Client Components

// Storage (client-side functions only)
export {
  STORAGE_BUCKET,
  generateStoragePath,
  uploadFileClient,
  uploadFilesClient,
  uploadAvatarClient,
} from "./storage-client";
export type { UploadResult, FileUploadOptions, AvatarUploadResult } from "./storage-client";
