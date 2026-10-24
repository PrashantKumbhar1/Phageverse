# CONTACT, INTRUDER, AFTERMATH

## Local launch

Run `npm.cmd install` if dependencies are missing, then `npm.cmd run dev -- --port 5174`. Open http://127.0.0.1:5174/. The Games Hub is at /#games; direct experiences are /#games/contact, /#games/intruder and /#games/aftermath. The former game hashes do not launch former games.

## Replacement and architecture

Removed `core/hunter.ts`, `core/cell.ts`, and the Hunter, InsideCell, and Evolution experience components. Replaced their gameplay with `core/contact.ts`, `core/intruder.ts`, and ContactGame, IntruderGame, and AftermathGame. The existing population rules were extended with explicit biological event histories, separate compatible/incompatible counts, and rejection feedback. Shared biological geometry, the main lifecycle simulator, laboratory, and rendering utilities are retained.

`GamesPage.tsx` provides the hub, lazy launch, loading/error states, optional interaction tones, learning mode, and return actions. `GameStage.tsx` provides materials, lighting, shared population geometry, adaptive pixel ratio and error handling. Rules are independent of rendering. The frame loop advances a fixed 1/30-second step. `theme.tsx` and scoped styles keep appearance independent of game state. Progress and appearance are stored only on the device; there are no student accounts.

## CONTACT: The Perfect Lock

Three missions require receptor inspection, sustained attachment, and genome transfer. WASD or touch controls move the phage, dragging aims, and arrow keys rotate. E/Space or the interaction control initiates inspection/binding/delivery. Matching host data is deterministic. Labels reveal receptor identity after close investigation. Attachment accumulates only while position, orientation and movement remain within tolerances. It decays when contact is unstable; pulling an attached particle away causes a recoverable loss and resets this transfer attempt. The capsid stays outside. Close-up and interior DNA views are available. There is no arbitrary time limit.

Movement, attachment tolerance, stability accumulation, and manual transfer are learning abstractions. Lambda does not steer intentionally. Its long tail is non-contractile; the articulated threefold tip is a schematic equivalent of its receptor-binding region, not a T4 contractile sheath.

## INTRUDER: Two Fates, One Cell

Drag the viral genome into one of two destinations in the 3D cell. Fine-position sliders provide a keyboard alternative. The lytic route pauses at circularization until the genome reaches the replication region, then produces DNA copies and structural parts. At assembly, guide the separate tail to the packaged head socket; this unlocks envelope breakdown and release. The lysogenic route requires the viral attP marker to approach host attB with aligned orientation. Integration then progresses on the same timeline, followed by chromosome copying and daughter-cell inheritance. Optional induction explicitly changes the outcome.

Play/pause, speed, stage restart, previous/next, seeking, camera modes and inspection share one state. Seeking cannot skip an unsolved interaction gate. The sequence requires a final outcome and three structure observations to register completion. Explorer explanations simplify vocabulary; the rules remain identical.

Placement regions and manual molecular alignment are teaching tools. Molecular machinery drives these processes in actual cells. Coordinates, particle counts and duration are schematic. Ordinary lysogeny does not culminate in lysis.

## AFTERMATH: The Living World

Four scenarios model First Contact, The Lytic Wave, The Silent Reservoir and Host Diversity. Students configure initial conditions, start/pause, inspect cells, orbit/zoom, change playback speed, position two optional inoculum doses, and compare snapshots. Conditions are limited to 8–24 initial bacteria, 25–100% compatible hosts, 2–10 initial phages, and 45–90 model seconds. The authoritative entity state drives all counters and geometry.

Compatible healthy cells become infected on a deterministic spatial encounter. In a lytic scenario, replication is recorded at infection age 2, assembly at age 6, and lysis with three rendered progeny at age 8. In a lysogenic scenario, integration occurs at age 8 instead; a lysogen divides once after another 15 model seconds, retaining the prophage in both daughters. Incompatible cells remain uninfected by this phage. Input doses add three particles each and do not increment progeny production. At most 40 cells are allowed. Each real transition emits an event; the last 100 are retained and the latest 10 appear in the compact log.

Nutrients, molecular regulation, phage degradation, immunity, resistance evolution, and genetic mutation are omitted. This is an educational population model, not a biological predictor.

## Models and future refinement

All default models are procedural. The hero phage and main cell reuse the detailed existing biological geometry. Repeated population phages use merged capsid, collar, ringed tail, and tip geometry; repeated bacteria use a textured capsule, instanced surface features, receptor geometry, and optional internal DNA. No inaccessible remote model URLs are required. Current models prioritize biological readability and stable frame cost; they are not atomically exact or professional photorealistic scans.

For a future art pass, use an anatomically reviewed lambda GLB with licensed baked textures and a non-contractile tail rig, then a bacterial envelope with reviewed LamB topology. The main simulator already supports a same-origin GLB override documented in README. Game replacement points are `Phage` in Biology and `MicroPhage` / `Bacterium` in GameStage. Keep click regions and state-driven attachment/assembly behavior intact when replacing geometry.

## Verification and limitations

Rules tests exercise the three CONTACT missions, misalignment, incompatible receptors, sustained contact, strain recovery and injection prerequisites; INTRUDER route placement, integration orientation, replication/assembly gates, seek/pause/reset and both endings; and AFTERMATH default scenario wins, replay determinism, compatibility, state/counter consistency, inoculum and event histories. Existing core simulator tests are retained.

The latest browser automation attempt ended because the Windows helper could not establish the browser URL with enough confidence to enforce its policy. No further UI input was sent. Latest rendered scenes, theme switching/persistence in the actual browser, full touch input, console errors and frame-rate measurements remain unverified. TypeScript/build and rules-test results are reported separately from those visual checks.

## Scientific references

- Lambda–LamB receptor binding and tip opening: https://www.nature.com/articles/s41467-024-48686-3
- Lambda tail architecture: https://pmc.ncbi.nlm.nih.gov/articles/PMC10721106/
- Lambda developmental switch: https://pubmed.ncbi.nlm.nih.gov/29158090/
- Prophage maintenance and conditional induction: https://pmc.ncbi.nlm.nih.gov/articles/PMC2327240/
