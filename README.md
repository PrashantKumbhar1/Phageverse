# PhageVerse

A browser-local educational experience about bacteriophage lambda and its E. coli host. Built from an empty workspace with React 19, TypeScript, Vite, Three.js, React Three Fiber, and Drei. No account, backend, or API key is required.

## Run

```powershell
npm.cmd install
npm.cmd run dev
```

Open http://127.0.0.1:5173. On systems without PowerShell's script restriction, `npm` works in place of `npm.cmd`.

```powershell
npm.cmd test
npm.cmd run build
```

The production output is `dist/`. Serve it using a static web server. The development server binds to localhost only.

## Included

- A cinematic real-time 3D homepage, skip/replay opening, and five navigation destinations.
- One authoritative elapsed-time state with seven 12-second stages for each pathway. Play/pause, seek, restart, previous/next, and 0.5×/1×/2× speeds.
- Shared encounter, receptor attachment, genome delivery, and pathway-decision stages. Lytic replication, component assembly, and release; lysogenic integration, inheritance, and stable lysogeny. Optional induction returns to productive infection.
- Guided camera movement with stage-specific framing, portrait aspect-ratio adjustments, and free orbit/zoom/pan.
- Exterior, transparent, clipped cutaway, DNA, and phage-structure views. Clickable structures with an accessible button list, information panel, and selected-material emphasis on capsid, tail, and envelope.
- Explorer and Science explanations, vocabulary, biological significance, a prediction pause, a four-question scored assessment, ordering activities for both branches, and a structure hunt.
- Synchronized comparison explanations with one active rendered pathway.
- Optional browser speech synthesis, off by default. Voice availability depends on the browser/OS.
- Auto/High/Balanced/Performance rendering controls, instanced protein and membrane detail, reduced-motion handling, lazy scene loading, paused on-demand rendering, and a retryable WebGL error boundary.
- A refined teal/ivory/copper visual system, editorial serif headline, procedural fluid atmosphere, optional 3D structure labels, keyboard shortcuts, accessible modal focus handling, and ambient-motion pause.

## Source map

- `src/App.tsx`: navigation, authoritative state, educational interface, controls, activities.
- `src/simulation.ts`: deterministic timeline helpers and structured scientific content.
- `src/Scene.tsx`: microscopic atmosphere, staged genome delivery and progeny release, lighting, labels, and camera director.
- `src/scenes/Biology.tsx`: capsid protein surface, flexible noncontractile tail, LamB receptor, double-stranded DNA, layered membrane, geometric cutaway, shader-driven envelope rupture, and simplified cell division.
- `src/scenes/geometry.ts`: reproducible geometry helpers and procedural membrane bump texture.
- `src/simulation/poses.ts`: pure, seekable eased animation channels for both pathways.
- `src/OptionalPhage.tsx`: optional local GLB loader with procedural fallback.
- `src/styles.css` and `src/refinement.css`: base layout and refined cinematic visual system.
- `tests/timeline.test.mjs` and `tests/animation.test.mjs`: timeline, event ordering, seek determinism, geometry, and content-integrity tests.

## Asset provenance and production upgrade

All default biological models are original procedural geometry. No downloaded biological models, raster backgrounds, or remote textures are used. The phage has an icosahedral capsid with hundreds of instanced protein surface details, a long flexible tail with 32 stacked rings, a simplified threefold receptor-binding tip, and a coiled packaged genome. The host uses a perturbed capsule, a generated membrane bump texture, instanced surface detail, short pili, LamB receptor representations, two membrane layers, cytoplasmic particles, and double-stranded DNA with base-pair rungs. These are educational procedural models, not photorealistic or molecularly exact assets.

The second design pass references the 2024 lambda–LamB structural study and the 2023 neck–tail cryo-EM study listed below. The common laboratory lambda representation omits the long side fibers present in original lambda isolates. The arrangement of coat-protein details is illustrative and is not an atomic reconstruction. No source figures are copied into the website.

To replace the exterior phage, place a licensed model at `public/models/lambda.glb` and set `public/model-config.json` to `{"lambda":"/models/lambda.glb"}`. Only same-origin absolute `.glb` paths are accepted. The loader normalizes height to the procedural model and centers it. Export upright along +Y with the capsid above the tail; name clickable meshes `capsid`, `tail`, `tail_tip`, and `viral_genome`. Use under 80,000 triangles and embedded textures of at most 2048×2048. Preserve license and attribution alongside the asset. Missing or invalid GLBs fall back to procedural geometry; interior/injection and assembly views intentionally retain the procedural teaching representation.

The best next visual upgrade is an anatomically reviewed Blender-created lambda model with baked surface detail, followed by a textured bacterial envelope and a rigged cell-division model. No premium assets are required to run the application.

## Scientific scope and limitations

Positions, sizes, timing, genome conformation, packaging, envelope failure, and cell division are conceptual. The time slider is animation time, not biological elapsed time. Lambda's tail is noncontractile and should not be replaced with a T4-style contractile sheath and long leg fibers. The branching choice is learner-controlled, not a model of stochastic gene regulation. Integration is illustrated by viral DNA moving toward the host chromosome and a growing marked chromosome segment. Lysis uses an irregular expanding opening in both membrane layers, limited fragments, and gradual progeny release. It is a spatial shader illustration, not a physical or molecular envelope simulation. Cell inheritance uses a simplified splitting composition and chromosome-copy transfer, not a molecular division simulation.

The laboratory starts independently at the encounter stage. Browser fonts may fall back to system fonts if Google Fonts is unavailable. Quiz answers and progress exist only in memory. Explorer mode simplifies both the stage explanations and assessment wording while testing the same central concepts.

## Scientific references

- [Lambda receptor interaction: cryo-EM structural study](https://www.nature.com/articles/s41467-024-48686-3)
- [Structure of the siphophage neck–tail complex](https://pmc.ncbi.nlm.nih.gov/articles/PMC10721106/)
- [Structural morphing in the viral portal vertex of lambda](https://pmc.ncbi.nlm.nih.gov/articles/PMC11092355/)
- [Bacteriophage lambda site-specific recombination](https://pmc.ncbi.nlm.nih.gov/articles/PMC11096046/)
- [Bacteriophage lambda: early pioneer and still relevant](https://pmc.ncbi.nlm.nih.gov/articles/PMC4424060/)
- [Switches in Bacteriophage Lambda Development](https://doi.org/10.1146/annurev.genet.39.073003.113656)

## Current games and appearance

The Games Hub now launches CONTACT: The Perfect Lock, INTRUDER: Two Fates, One Cell, and AFTERMATH: The Living World. The earlier Hunter / Inside the Cell / Evolution components and rules have been replaced; their old hash paths resolve to the hub. Full mechanics, model assumptions, asset workflow, and verification limits are in [docs/GAMES.md](docs/GAMES.md).

The compact Light / Dark control in the header is available on Home and throughout the website. Light retains the ivory and sage design. Dark restores a subdued teal and charcoal environment. The choice stays in browser local storage; the interface and 3D lighting update together without resetting an expedition. Explorer / Science explanations are shared with the footer learning-mode control.

The Laboratory offers 11 selectable component views with dissection and behavior scrubbing. Journey and Compare controls remain collapsible.

## Verification

Automated rules and geometry tests cover CONTACT stability and injection prerequisites; INTRUDER spatial pathway entry, replication and integration gates, assembly and seeking; and AFTERMATH deterministic replays, achievable scenarios, compatibility, counters, and event histories. Run npm test for the current results and npm run build for TypeScript and production output.

The earlier light hub, homepage, Hunter movement camera, and cell cutaway were visually inspected before the latest interaction rebuild. Browser automation for the latest themes and games was stopped because the Windows helper could not determine the current URL confidently enough to enforce policy. Latest rendered gameplay, mobile touch behavior, browser console output, and GPU performance are therefore not claimed as fully verified. Models remain original procedural teaching representations, not imported photorealistic assets.
