import { localApi } from './local';
import { makeSupabaseApi } from './supabase';
import type { Api } from './types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Con las variables de Supabase usa la base real; si no, modo local en el navegador. */
export const api: Api = url && key ? makeSupabaseApi(url, key) : localApi;
export * from './types';
