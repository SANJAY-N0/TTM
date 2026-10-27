export const playNotificationSound = (type: 'order_placed' | 'order_ready' | 'error' = 'order_placed') => {
  try {
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch((err) => console.warn('Audio playback prevented:', err));
  } catch (e) {
    console.warn('Audio not supported', e);
  }
};
