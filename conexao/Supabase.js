const SUPABASE_URL = "https://uefrkcupaijcrftkdfsz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_gy071tENk5RFSaAL2xfT2g_PXDhGgHd";

export const connSubaBase = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);  

