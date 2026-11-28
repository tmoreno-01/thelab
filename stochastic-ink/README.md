# Stochastic Ink — LifeAfterLogic Lab

**Current version: v.07**

Live experiment: https://tmoreno-01.github.io/thelab/stochastic-ink/

## Visual target

The supplied 33-second, 720 × 1280 reference is a shifting, off-centre ink cloud: a dense dark nucleus surrounded by translucent smoke, branching filaments, fine mesh-like membranes and long curved tendrils. It is not a starburst of evenly spaced radial rays. The nucleus moves through the frame while plume directions and internal structure continuously change.

## v.07 — bounded ink plumes and particle fluid

- Adds a full-screen, multi-scale smoke and filament field based on the reference's dark nucleus, soft plume envelopes, ridged fibres and translucent web.
- The field uses the same animated curl-noise texture as the particles, so smoke and particle motion share one underlying flow.
- Retains 524,288 GPU particle slots, but reduces excessive acceleration and maximum particle speed.
- Adds a soft elliptical containment force and hard safety bounds. Particles respawn from a tightly controlled core/satellite/plume distribution instead of scattering off the edges.
- Fades particle opacity near the frame boundary, keeping the active composition visible inside the portrait.
- Raises trail persistence from 0.962 to 0.994 by default, so delicate movement accumulates into visible smoke and filaments rather than disappearing almost immediately.
- Audio affects plume distortion, flow turbulence, vortex pressure and particle detail. LOW / MID / HIGH meters and a BEAT readout expose the analyser signal.

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

1. Drop an audio file into Audio Input, or choose one from disk. MP4/MOV files with an audio track are accepted.
2. Press **Play audio**.
3. Watch the LOW / MID / HIGH meters and SIGNAL / BEAT readout.
4. Bass and beat onsets disturb the plume and vortex; mids increase fluid distortion; highs add fine particle motion.
5. Audio is analysed locally in the browser. Files are never uploaded.

## Versions

- **v.07** — current reference-driven smoke/filament field with bounded GPU particle fluid
- **v.06** — multi-scale curl-noise particle fluid; playable archive
- **v.05** — first GPU fluid-particle advection pass; playable archive
- **v.04** — radial micro-particle / filament experiment; playable archive
- **v.03** — WebGPU filament and membrane study; playable archive
- **v.02** — 3D particle system and shader fix; playable archive
- **v.01** — initial WebGPU build; playable archive

Earlier builds remain playable from the Version history section on the experiment page. Each archived version retains its exact source in `source.html`.

## Technical notes

- WebGL2 is the primary renderer. It requires `EXT_color_buffer_float` for floating-point flow and particle-state targets.
- Simulation, smoke-field generation, trail accumulation and audio analysis run locally in the browser.
- The default output is 720 × 1280. Select 1080 for higher-resolution output.
- If floating-point GPU targets are unavailable, a lighter Canvas 2D fallback is used.
- Recording uses the live canvas and browser MediaRecorder support. Audio is included when a track is playing.
