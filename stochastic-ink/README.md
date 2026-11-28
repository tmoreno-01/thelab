# Stochastic Ink

A WebGPU audiovisual ink and filament experiment for LifeAfterLogic Lab.

**Live page:** https://tmoreno-01.github.io/thelab/stochastic-ink/

## Visual architecture

- 180,000 default GPU particles, grouped into coherent families of 64.
- 3D curl-field advection with a slow perspective camera.
- Delayed strand divergence creates branching and cross-weave.
- A domain-warped ink field provides a dense core, ridged filament webs, tendrils and soft wash.
- Persistent feedback adds diffusion and temporal trails.

## Audio

Drop an MP3, WAV, M4A or OGG file into Audio Input and press Play. Low, mid and high frequency bands, RMS energy and low-frequency transients influence the core, turbulence, spread and filament detail. Audio is analysed locally and is not uploaded.

## Controls

- Filament, Bloom and Tangle presets
- Particle population, density, turbulence, spread, core density, detail, diffusion, persistence and audio influence
- 9:16, 1:1 and 16:9 output
- Preview and 1080-class high-resolution render
- Save PNG stills or record the canvas with audio

WebGPU is required. Current Chrome or Edge with hardware acceleration is recommended.
