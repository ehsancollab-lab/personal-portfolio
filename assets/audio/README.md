# Click sound reference

The owner supplied `sounds-BL9XApyC.zip`, containing the JavaScript from `eduardoalba.com`, on November 5, 2026. The JavaScript's SHA-256 is `be246db4692942cf56cdf70974ca0779fbbe9c2c27f84fa6711f92f7c00e8a86`.

The reference synthesizes the sound with Web Audio rather than loading a sound file. `click-sound.js` reproduces its sound graph and parameters:

- 170→110Hz sine sweep over 40ms, randomized by ±6% per click; gain rises from 0.0001 to 0.4 in 4ms and falls to 0.0001 at 60ms; oscillator stops at 80ms.
- Cached 30ms mono white noise, with the same pitch variation, a 1200Hz low-pass filter (Q 0.8), and gain 0.12→0.0001 over 15ms.
- Shared compressor at −18dB threshold and 6:1 ratio; stereo pan clamped to ±0.8; minimum 30ms between sounds. Public clicks use volume 1 and centered pan.

Initialization happens on the first real user click; one audio context and noise buffer are reused. Finished nodes disconnect. Missing/blocked audio leaves navigation usable. A sound-only excerpt is retained in `tests/fixtures/click-sound-reference.txt` for deterministic offline waveform comparison at 44.1kHz and 48kHz.

The superseded `tap.wav` excerpt from `Rec 0042.mp4` is removed. No external audio file or runtime request to the reference site is needed.
