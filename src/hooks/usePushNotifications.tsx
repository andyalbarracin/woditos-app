/**
 * Archivo: usePushNotifications.tsx
 * Ruta: src/hooks/usePushNotifications.tsx
 * Última modificación: 2026-03-09
 * Descripción: Hook para gestionar suscripción a push notifications.
 *   - Registra service worker
 *   - Solicita permisos de notificación
 *   - Suscribe al usuario a push notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// VAPID public key - se genera junto con la private key
// La private key debe estar en los secrets del backend
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Verificar soporte
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  // Verificar si ya está suscrito
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  };

  // Suscribir a push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || !user?.id) {
      toast.error('Tu navegador no soporta notificaciones push');
      return false;
    }

    setIsLoading(true);

    try {
      // 1. Solicitar permiso
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        toast.error('Necesitamos tu permiso para enviarte notificaciones');
        setIsLoading(false);
        return false;
      }

      // 2. Registrar service worker si no está registrado
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
      }

      // 3. Suscribir a push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // 4. Enviar suscripción al backend
      const { error } = await supabase.functions.invoke('push-subscribe', {
        body: {
          user_id: user.id,
          subscription: subscription.toJSON(),
        },
      });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('¡Notificaciones activadas! Recibirás alertas de tus sesiones.');
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Error subscribing to push:', err);
      toast.error('No se pudieron activar las notificaciones');
      setIsLoading(false);
      return false;
    }
  }, [isSupported, user?.id]);

  // Desuscribir
  const unsubscribe = useCallback(async () => {
    if (!user?.id) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Notificar al backend
        await supabase.functions.invoke('push-unsubscribe', {
          body: { user_id: user.id },
        });
      }

      setIsSubscribed(false);
      toast.success('Notificaciones desactivadas');
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error unsubscribing:', err);
      toast.error('Error al desactivar notificaciones');
      setIsLoading(false);
      return false;
    }
  }, [user?.id]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  };
}
