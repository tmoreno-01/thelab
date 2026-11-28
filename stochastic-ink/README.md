# Stochastic Ink — LifeAfterLogic Lab

**Current version: v.04**

Live experiment: https://tmoreno-01.github.io/thelab/stochastic-ink/

## Visual target

The supplied 33-second portrait reference is a moving ink structure on a near-white field: a compact, irregular black nucleus; fine hair-like fibres; long, delicate strands that loop and branch; small dense intersections; and translucent grey smoke. The structure changes direction and silhouette over time without filling the whole frame.

## v.04 — micro-particle filament renderer

- Replaces the previous WebGPU-only renderer with a WebGL2 field shader and a connected micro-particle / filament pass.
- Uses actual generated particle positions as the vertices of continuous hairline strands, with a smaller point pass for fine particulate grain.
- The default population is **480,000**; the slider controls the generated strand population up to **800,000**.
- The field shader layers compact ink, irregular radial fibres, fine ridged mesh, wisps and a directional smoke wash.
- Particle families follow a changing curl field, so their strands bend, diverge and occasionally loop rather than forming rigid straight spokes.
- The output stays monochrome with a white background and large negative-space areas.
- Audio analysis continues locally in the browser; bass, mids and highs subtly influence the flow.
- If WebGL2 cannot initialise or the context is lost, a Canvas 2D fallback takes over instead of leaving the stage blank.

## Controls

- Filament, Bloom and Tangle presets
- Particle amount: 40,000–800,000
- Filament density, flow distortion, radial spread and core density
- Filament weight, fine mesh detail, smoke softness and flow stability
- Audio influence
- 9:16, 1:1 and 16:9 output
- Preview and high-resolution output
- Save PNG stills or record the canvas with audio

## Audio

1. Drop an MP3, WAV, M4A or OGG file into Audio Input, or choose a local file.
2. Press **Play audio**.
3. Low frequencies influence the nucleus and spread; mids influence flow distortion; highs add fine movement.
4. Audio is analysed locally with the Web Audio API. Files are not uploaded.

## Versions

- **v.04** — current WebGL2 micro-particle renderer, connected curved filaments and Canvas 2D fallback
- **v.03** — WebGPU filament and membrane study; preserved as a playable archive
- **v.02** — 3D particle system and shader fix; preserved as a playable archive
- **v.01** — initial WebGPU build

Earlier builds remain playable from the Version history section on the experiment page.

## Technical notes

- WebGL2 is the primary renderer. Current Chrome, Edge and Safari builds are recommended.
- The simulation and audio analysis run locally in the browser.
- The default output is 720 × 1280. Select 1080 for a higher-resolution output.
- The fallback is deliberately lighter than the GPU renderer; it prioritises a visible, moving composition if the GPU path is unavailable.
- Recording uses the live canvas and browser MediaRecorder support.
