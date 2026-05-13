import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function AdminLayout() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await SecureStore.getItemAsync('adminAuth');
        if (!auth) {
          router.replace('/(admin)/login');
        }
      } catch (e) {
        router.replace('/(admin)/login');
      } finally {
        setChecked(true);
      }
    };
    checkAuth();
  }, []);

  if (!checked) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="login" options={{ animationEnabled: false }} />
      <Stack.Screen name="home" options={{ animationEnabled: false }} />
    </Stack>
  );
}
