# Lantern Field / 001

A real-time field of floating paper sky lanterns, developed as a LifeAfterLogic lab experiment.

## Visual system

- 180 instanced lantern envelopes on desktop (88 on touch devices), each with its own rise rate, drift, rotation, paper tint and light flicker.
- Thin rice-paper envelope with a procedural fibre texture, panel seams, wrinkles and a curved bamboo support cage.
- Three independently learned internal-light lobes, combined per frame with a small neural network evaluated in the vertex shader.
- Soft neighbouring-lantern bounce approximation, warm flame cores, halo sprites, star field, faint nebula, bloom and depth of field.
- Drag to orbit; wheel to dolly; pause, glow and fullscreen controls.

## Neural lighting technique

This takes inspiration from the neural precomputed-radiance-transfer method described in the Cocoon project by Akella. Rather than evaluating a large lighting equation from scratch for every pixel, a compact squared-ReLU MLP predicts the thin-paper transmission response from local position, normal, view direction and a paper-thickness feature. The three learned output lobes correspond to three interior light regions. The network weights are stored in `prt-weights.json` and sampled from a floating-point GPU texture; the model runs in the lantern vertex shader.

**Important distinction:** the first model is trained against a physically based synthetic thin-sheet reference (Beer–Lambert absorption, angular transmission and forward scattering). It is not yet a Cycles-rendered ground-truth bake like the original Cocoon. The training script is included in `train_prt.py`. A higher-fidelity next step would render the paper lantern in Blender Cycles with separate interior light groups, then train against those samples.

## Run locally

Serve the repository root over HTTP (ES modules and fetch require a server):

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/lanterns/`.

## Reference

The technique is inspired by the description in [Akella's Cocoon project](https://github.com/akella/codevember-2026/tree/main/20-cocoon), especially its neural light transport, separate internal illumination and real-time GPU inference. This experiment is an independent implementation; it does not copy the Cocoon geometry, model weights or source shaders.
