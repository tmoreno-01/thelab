# Lantern Field / 001

A real-time study of light transmitted through thin, irregular paper.

## Current renderer

The previous version used an over-bright synthetic neural glow and a flame placed outside the envelope. That was not a faithful representation of the Cocoon reference, so the renderer has been rebuilt around an internal light field.

- 112 instanced paper lanterns on desktop (48 on touch devices; 28 in browser-test mode).
- A tapered, softly irregular envelope with paper grain, fibres, creases, eight panel seams and a curved bamboo frame.
- Three animated internal emitter samples, evaluated per fragment in the paper's local coordinate system.
- Inverse-square source falloff, angle-dependent Beer–Lambert absorption, warm spectral attenuation and a broad scattering term.
- Paper thickness varies with procedural grain and creasing; the bamboo ribs and seams reduce transmitted light.
- A restrained cool exterior fill keeps the unlit paper visible without washing out the transmitted light.
- Drag to orbit; wheel to dolly; pause, inside-light intensity and fullscreen controls.

## Relationship to Cocoon

This is an independent thin-sheet lighting study inspired by the 'lantern.html' work in [Akella's Cocoon project](https://github.com/akella/codevember-2026/tree/main/20-cocoon).

The reference does more than add an emissive glow: it renders the silk shell, fibres and internal emitters in Blender Cycles with separate light groups, trains networks against those path-traced samples, and evaluates the learned response in WebGPU. Its lantern variant also computes a live field for the internal lamp and the pupa's visibility through the silk.

**The current LifeAfterLogic version is not yet a Cycles-trained neural PRT implementation.** It now uses an explicit real-time thin-sheet transmission model so the internal sources genuinely light the paper envelope. The old synthetic MLP and its weights are no longer used by the live renderer. The next fidelity step is a Blender Cycles bake of this envelope with separate internal light groups, followed by a compact neural model trained against those renders.

Useful reference files:
- 'bake/render_inner.py' — Cycles renders of internal lights in separate light groups
- 'bake/train_inner.py' — network training against the Cycles output
- 'src/rain/field.wgsl' — live internal-light field and pupa visibility
- 'src/rain/lantern.ts' — learned internal-light response and warm scattering

## Run locally

Serve the repository root over HTTP (ES modules and fetch require a server):

~~~bash
python3 -m http.server 8000
~~~

Open http://localhost:8000/lanterns/.
