# Stochastic Ink — LifeAfterLogic Lab

**Current version: v.06**

Live experiment: https://tmoreno-01.github.io/thelab/stochastic-ink/

## Visual target

The target is the supplied 33-second, 720 × 1280 portrait reference: a dense, irregular ink nucleus with a constantly changing perimeter; thousands of fine particles; tangled looping filaments; translucent smoke; and long, soft wisps. The composition behaves like a living fluid cloud. It must not collapse into evenly spaced spokes or smooth, coherent ribbons.

## v.06 — multi-scale curl-noise particle fluid

- Uses a dedicated 256 × 256 floating-point curl-noise flow texture, regenerated on the GPU each frame.
- The flow texture combines three spatial scales of warped fractal noise. Its vector field is sampled by 524,288 GPU particle slots stored in floating-point ping-pong state textures.
- Particles carry current and previous positions. The renderer accumulates both particle marks and their movement segments into ping-pong trail buffers.
- Six moving, alternating micro-vortices overlap around the central nucleus. They break up broad coherent flow into smaller eddies, tangled loops and irregular filaments.
- Audio drives the flow texture, vortex strength, outward pressure, particle opacity and size, and trail decay.
- Low, mid and high audio meters plus a beat-response readout expose the analyser output, making it possible to confirm that the loaded track is reaching the simulation.
- Audio input accepts MP3, WAV, M4A, OGG and MP4/MOV files containing an audio track.
- The output stays monochrome on white, with 9:16, 1:1 and 16:9 composition options.

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
4. Bass and beat onsets increase vortex force and outward pressure; mids increase fluid turbulence; high frequencies add fine particle movement.
5. Audio is analysed locally in the browser. Files are never uploaded.

## Versions

- **v.06** — current multi-scale curl-noise flow texture, moving micro-vortices, GPU particle advection and accumulated trails
- **v.05** — first GPU fluid-particle advection pass; preserved as a playable archive
- **v.04** — radial micro-particle / filament experiment; preserved as a playable archive
- **v.03** — WebGPU filament and membrane study; preserved as a playable archive
- **v.02** — 3D particle system and shader fix; preserved as a playable archive
- **v.01** — initial WebGPU build; preserved as a playable archive

Earlier builds remain playable from the Version history section on the experiment page. Exact sources are retained in each version's `source.html`.

## Technical notes

- WebGL2 is the primary renderer. It requires `EXT_color_buffer_float` for the floating-point flow and particle-state targets.
- Simulation, flow-field generation, trail accumulation and audio analysis run locally in the browser.
- The default output is 720 × 1280. Select 1080 for a higher-resolution output.
- If floating-point GPU targets are unavailable, a lighter Canvas 2D fluid fallback is used rather than a radial-line placeholder.
- Recording uses the live canvas and browser MediaRecorder support. Audio is included when a track is playing.
