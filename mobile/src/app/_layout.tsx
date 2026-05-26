import { Slot } from 'expo-router';
import { AuthProvider } from '@/context/auth';
import '../global.css';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Slot />
    </AuthProvider>
  );
}
