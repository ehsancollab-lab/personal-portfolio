// Sound settings from the owner's supplied sounds-BL9XApyC.js reference.
// A short sine transient and filtered noise share a compressor and stereo pan.
export function createClickSound(Context = globalThis.AudioContext || globalThis.webkitAudioContext) {
  let context, compressor, noise, resuming = false, lastClick = -Infinity;

  function initialize() {
    if (context && context.state !== 'closed') return context;
    if (!Context) return null;
    context = new Context();
    compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.ratio.value = 6;
    compressor.connect(context.destination);
    noise = context.createBuffer(1, Math.floor(context.sampleRate * .03), context.sampleRate);
    const samples = noise.getChannelData(0);
    for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
    lastClick = -Infinity;
    return context;
  }

  function play({ volume = 1, pan = 0 } = {}) {
    try {
      const audio = initialize();
      if (!audio) return;
      if (audio.state === 'suspended' || audio.state === 'interrupted') {
        if (resuming) return;
        resuming = true;
        audio.resume().then(() => {
          resuming = false;
          if (audio.state === 'running') play({ volume, pan });
        }, () => { resuming = false; });
        return;
      }
      if (audio.state !== 'running' || audio.currentTime - lastClick < .03 || volume <= 0) return;
      const at = audio.currentTime;
      lastClick = at;
      const pitch = 1 + (Math.random() - .5) * .12;
      const panner = audio.createStereoPanner();
      panner.pan.value = Math.max(-.8, Math.min(.8, pan));
      panner.connect(compressor);

      const tone = audio.createOscillator();
      tone.type = 'sine';
      tone.frequency.setValueAtTime(170 * pitch, at);
      tone.frequency.exponentialRampToValueAtTime(110 * pitch, at + .04);
      const toneGain = audio.createGain();
      toneGain.gain.setValueAtTime(.0001, at);
      toneGain.gain.exponentialRampToValueAtTime(.4 * volume, at + .004);
      toneGain.gain.exponentialRampToValueAtTime(.0001, at + .06);
      tone.connect(toneGain).connect(panner);

      const texture = audio.createBufferSource();
      texture.buffer = noise;
      texture.playbackRate.value = pitch;
      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200 * pitch;
      filter.Q.value = .8;
      const textureGain = audio.createGain();
      textureGain.gain.setValueAtTime(.12 * volume, at);
      textureGain.gain.exponentialRampToValueAtTime(.0001, at + .015);
      texture.connect(filter).connect(textureGain).connect(panner);

      tone.onended = () => {
        for (const node of [tone, toneGain, texture, filter, textureGain, panner]) node.disconnect();
      };
      tone.start(at);
      tone.stop(at + .08);
      texture.start(at);
    } catch {
      // Audio support or output-device failures must not interrupt navigation.
    }
  }
  return play;
}
