# Stochastic Ink

A WebGPU audiovisual ink and filament experiment for LifeAfterLogic Lab.

**Live page:** https://tmoreno-01.github.io/thelab/stochastic-ink/

## Visual architecture

The renderer combines four GPU layers:

1. **3D particle advection** — particles move through a time-varying 3D curl field and are projected through a slowly moving camera.
2. **Coherent filament families** — particles are seeded in groups of 64 with shared family parameters. Their paths diverge progressively to create bundled strands and branching structures.
3. **Gaussian particle splats** — soft, depth-aware particle billboards add the dense volumetric texture around the fine linework.
4. **Ink field and feedback** — a domain-warped field adds the dark nucleus, branching ridges, long tendrils and diffuse wash. A persistent feedback buffer lets the structure leave soft trails.

The aim is to create an interconnected, three-dimensional fibrous ink body rather than a conventional audio-reactive particle spray.

## Audio

Drop an MP3, WAV, M4A or OGG file into Audio Input and press Play. Low, mid and high frequency bands, RMS energy and low-frequency transients influence the core, turbulence, spread and filament detail. Audio is analysed locally and is not uploaded.

## Controls

- Filament, Bloom and Tangle presets
- Particle population, density, turbulence, spread, core density, detail, diffusion, persistence and audio influence
- 9:16, 1:1 and 16:9 output
- Preview and 1080-class high-resolution render
- Save PNG stills or record the canvas with audio

WebGPU is required. Current Chrome or Edge with hardware acceleration is recommended.
