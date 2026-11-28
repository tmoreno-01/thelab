# Stochastic Ink — LifeAfterLogic Lab

**Current version: v.05**

Live experiment: https://tmoreno-01.github.io/thelab/stochastic-ink/

## Visual target

The target is the supplied 33-second, 720 × 1280 portrait reference: a dense, irregular ink nucleus with a constantly changing perimeter; thousands of fine particles; tangled looping filaments; translucent smoke; and long, soft wisps. The composition behaves like a living fluid cloud. It must not collapse into evenly spaced spokes or a static radial burst.

## v.05 — GPU fluid particle advection

- Replaces the v.04 radial family/strand construction with a genuine time-stepped particle simulation.
- 524,288 GPU particle slots are stored in floating-point ping-pong textures. A slider controls how many are rendered, from 65,536 to 524,288.
- Each particle carries its current and previous position. A multi-scale curl field, central vortex and secondary counter-rotating eddies continuously advect the particles.
- The renderer accumulates fine particle marks and their movement segments into ping-pong trail buffers. Trail decay creates persistent hairline filaments and smoky density without pre-drawn radial rays.
- Particles are seeded in overlapping irregular clusters with a small diffuse population, creating an asymmetric nucleus and loose surrounding material.
- Audio is analysed with the Web Audio API. Low, mid and high bands plus transient/onset energy affect vortex force, fluid turbulence, outward pressure, particle size, opacity and trail decay.
- Three live meters (low, mid, high) and a beat-response readout expose the analyser output, making it possible to see whether the loaded track is reaching the simulation.
- Audio input accepts MP3, WAV, M4A, OGG and MP4/MOV files containing an audio track.
- Output remains monochrome on white, with 9:16, 1:1 and 16:9 composition options.

## Controls

- Smoke, Filament and Turbulent presets
- Particle amount: 65,536–524,288
- Fluid turbulence, vortex strength and cloud spread
- Ink density, trail persistence and particle scale
- Audio sensitivity and temporal drift
- 9:16, 1:1 and 16:9 output
- 720 preview and 1080 high-resolution output
- Save PNG stills or record the live canvas with audio

## Audio

1. Drop an audio file into Audio Input, or choose one from disk. An MP4/MOV with an audio track is also accepted.
2. Press **Play audio**.
3. Watch the LOW / MID / HIGH meters and the SIGNAL / BEAT readout. They should move while the track plays.
4. Bass and beat onsets push the cloud outward and increase vortex pressure; mids intensify the curl field; high frequencies add fine particle motion and size variation.
5. Audio is analysed locally in the browser. Files are never uploaded.

## Versions

- **v.05** — current GPU fluid particle simulation, curl-field advection, accumulated trails and visible audio meters
- **v.04** — radial micro-particle / filament experiment; preserved as a playable archive
- **v.03** — WebGPU filament and membrane study; preserved as a playable archive
- **v.02** — 3D particle system and shader fix; preserved as a playable archive
- **v.01** — initial WebGPU build; preserved as a playable archive

Earlier builds remain playable from the Version history section on the experiment page. The exact v.04 source is retained in `versions/v.04/source.html`.

## Technical notes

- WebGL2 is the primary renderer. It requires `EXT_color_buffer_float` for the floating-point particle-state targets.
- Simulation, trail accumulation and audio analysis run locally in the browser.
- The default output is 720 × 1280. Select 1080 for a higher-resolution output.
- If floating-point GPU targets are unavailable, a lighter Canvas 2D fluid fallback is used rather than a radial-line placeholder.
- Recording uses the live canvas and browser MediaRecorder support. Audio is included when a track is playing.
