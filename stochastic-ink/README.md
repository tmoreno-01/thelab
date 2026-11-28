# Stochastic Ink — LifeAfterLogic Lab

**Current version: v.03**

Live experiment: https://tmoreno-01.github.io/thelab/stochastic-ink/

## Visual direction

The supplied audiovisual reference is a moving ink/fibre structure, not a conventional particle cloud: a compact dark nucleus, hair-thin radiating strands, branching parallel fibres, occasional translucent membrane webs and soft grey smoke against large areas of white negative space.

v.03 changes the underlying rendering and simulation to pursue that visual language.

## v.03 changes

- **Longer coherent filament families:** 64-particle bundles share correlated flow seeds, tighter initial alignment and longer lifetimes. They gradually diverge into fine branches rather than behaving like an even spray.
- **Anisotropic ink field:** the old polar sine-wave bands are replaced by domain-warped, multi-scale ridged noise concentrated inside a few evolving plume structures. The field now leaves more white negative space.
- **Flowing feedback:** the previous frame is subtly advected through a curl-like field before diffusion and decay, giving the ink a more fluid, suspended quality.
- **Membrane web renderer:** a new GPU pass draws delicate cross-links between selected filament-family strands to create occasional woven, translucent structures.
- **Layered rendering:** soft particle splats, membrane cross-links and hairline motion trails are composited over the evolving ink field.
- **Audio response:** bass, mids, highs and transients still influence the system, but the default audio gain is restrained so the structure does not simply pulse to the beat.

## Audio

1. Drop an MP3, WAV, M4A or OGG file into Audio Input, or click to choose a local file.
2. Press **Play audio**.
3. Low frequencies influence the nucleus and radial spread; mids influence flow distortion; highs add fine movement; transients add short impulses.
4. Audio is analysed locally with the Web Audio API. Files are not uploaded.

## Controls

- Filament, Bloom and Tangle presets
- Particle population
- Filament density, flow distortion, radial spread and core density
- Filament detail and membrane webbing
- Ink diffusion and trail persistence
- Audio influence
- 9:16, 1:1 and 16:9 output
- Preview and high-resolution output
- Save PNG stills or record the canvas with audio

## Versions

- **v.03** — current fibrous ink field, correlated filament families and membrane web renderer
- **v.02** — 3D particle system and WGSL reserved-keyword fix; preserved as a playable archive
- **v.01** — initial WebGPU build

Earlier versions remain playable from the Version history section on the experiment page.

## Technical notes

- WebGPU is required. Current Chrome or Edge with hardware acceleration is recommended.
- The simulation and audio analysis run locally in the browser.
- The default particle count is 220,000. Reduce it if the device struggles.
- The live MediaRecorder capture is not a mathematically seamless loop renderer; deterministic loop rendering remains a future improvement.
