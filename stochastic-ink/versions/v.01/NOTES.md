# Stochastic Ink — v.01

**Status:** archived initial build  
**Original source:** `source.html`  
**Playable archive:** `index.html`

This is the initial Stochastic Ink WebGPU implementation, preserved before the WGSL shader fix.

The original build does not initialise WebGPU. Its particle struct uses `meta` as a WGSL field name, but `meta` is a reserved keyword. The error shown in the original screenshot is therefore part of this preserved v.01 build.

The next iteration is v.02. It changes the WGSL field name to `attributes` without changing the underlying four-float particle data layout.
