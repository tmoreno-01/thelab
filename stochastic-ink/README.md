# Stochastic Ink — LifeAfterLogic Lab

**Current build:** v.02  
**Live page:** https://tmoreno-01.github.io/thelab/stochastic-ink/

## Version history

- [v.02 — WGSL shader fix](./) (current)
- [v.01 — Initial WebGPU build](./versions/v.01/) (preserved archive)

The exact original v.01 source is preserved at `versions/v.01/source.html`. Previous builds are never overwritten.

## Visual architecture

- 3D particle advection through a time-varying curl field and slowly moving perspective camera.
- Coherent particle families, branching strands and Gaussian particle splats.
- Domain-warped ink field, dark nucleus, ridges, tendrils and diffuse wash.
- Persistent feedback for soft temporal trails.

## Audio

Drop an MP3, WAV, M4A or OGG file into Audio Input and press Play. Low, mid and high frequency bands, RMS energy and low-frequency transients influence the core, turbulence, spread and filament detail. Audio is analysed locally and is not uploaded.

## Controls

- Filament, Bloom and Tangle presets
- Particle population, density, turbulence, spread, core density, detail, diffusion, persistence and audio influence
- 9:16, 1:1 and 16:9 output
- Preview and 1080-class high-resolution render
- Save PNG stills or record the canvas with audio

WebGPU is required. Current Chrome or Edge with hardware acceleration is recommended.
