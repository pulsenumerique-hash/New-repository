// Audio and Browser Alert Utility for Stock Threshold Alerts

export function playStockAlertChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First tone (Alert Warning)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second tone (Urgent high accent)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch {
    // Ignore audio context autoplay errors if blocked by browser policy
  }
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  return await Notification.requestPermission();
}

export function sendStockAlertNotification(productName: string, currentStock: number, threshold: number): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const title = currentStock <= 0 
      ? `🚨 Rupture de Stock : ${productName}`
      : `⚠️ Alerte Stock Bas : ${productName}`;
    const body = currentStock <= 0
      ? `Le produit "${productName}" est en rupture totale (0 unité). Réapprovisionnement urgent requis !`
      : `Le produit "${productName}" n'a plus que ${currentStock} unités (Seuil de sécurité : ${threshold}).`;

    new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `stock-alert-${productName}`,
    });
  } catch {
    // Ignore notification errors in iframe/sandboxed environments
  }
}

export function getSoundAlertSetting(): boolean {
  try {
    const val = localStorage.getItem('boutiquepro_sound_alerts');
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setSoundAlertSetting(enabled: boolean): void {
  try {
    localStorage.setItem('boutiquepro_sound_alerts', enabled ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}
