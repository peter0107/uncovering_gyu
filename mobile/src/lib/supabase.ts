import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const ls = typeof window !== 'undefined' ? window.localStorage : null;

const storage = Platform.OS === 'web'
  ? {
      getItem: (key: string) => Promise.resolve(ls?.getItem(key) ?? null),
      setItem: (key: string, value: string) => Promise.resolve(ls?.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(ls?.removeItem(key)),
    }
  : {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
