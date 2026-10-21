let audioContext: AudioContext | null = null;

function getAudioContext() {
  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextCtor) return null;
  audioContext ??= new AudioContextCtor();
  return audioContext;
}

export async function playNotificationSound() {
  try {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === "suspended") {
      await context.resume();
    }

    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    gain.connect(context.destination);

    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(1174.66, now + 0.1);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
  } catch {
    // Browsers may block sound until the user has interacted with the page.
  }
}
