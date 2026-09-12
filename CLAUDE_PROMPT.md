# Claude handoff prompt

You are reviewing a Vite + Three.js digital-twin application in this repository:

`https://github.com/rishu162006s/digital_twin_1`

## User goal

The app is an Autodesk Fusion 360 digital-twin model animated and inspected with Three.js. It is deployed as a free Render Static Site. The user wants very low perceived latency, but the model colors and existing subsystem interactions must remain correct.

## Current deployment

- Branch: `master`
- Render runtime: static site
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Render configuration: `render.yaml`
- No backend, API, database, or server-side rendering
- The repository root is already the application root. Do not add `rootDir: Animation`.

## Current source files

Inspect all of these files before proposing edits:

- `index.html`: HUD, loading overlay, asset navigator, sensor panel, and error UI
- `src/main.js`: Three.js scene setup, camera, lights, renderer, OBJ/MTL loading, model initialization, animation loop
- `src/componentManager.js`: component registry, grouping, names, materials, inspection lighting
- `src/generatorInteraction.js`: pointer handling, raycasting, selection, hover, controller browsing
- `src/animationManager.js`: animation helper logic
- `src/animeAnimations.js`: subsystem animations using Anime.js and Three.js
- `src/conditionAnalyzer.js`: simulated health and maintenance analysis
- `src/sensorData.js`: sensor and condition data
- `src/style.css`: interface styling
- `package.json`: Vite, Three.js, Anime.js dependencies and scripts
- `vite.config.js`: Vite configuration
- `render.yaml`: Render static deployment settings
- `public/assets/models/DIGITAL_TWIN.obj`: Fusion export geometry
- `public/assets/models/DIGITAL_TWIN.mtl`: Fusion material definitions

## Current model facts

- The application currently loads `DIGITAL_TWIN.mtl` with `MTLLoader`.
- It then loads `DIGITAL_TWIN.obj` with `OBJLoader`.
- The OBJ is approximately 67.4 MB.
- It has approximately 512,464 vertices and 1,026,085 faces.
- The OBJ declares `mtllib CHP.mtl`, while this repository currently supplies `DIGITAL_TWIN.mtl`; investigate this naming mismatch carefully.
- Material names include Fusion-exported materials such as steel, enamel yellow, polished bronze, metallic blue, and metallic red.
- The visible colors are important and must not disappear.
- The component registry depends on object/group names such as `EngineCore`, `BluePipe*`, `RedPipe*`, `BronzePipe*`, `CHP`, `CHP (1)`, `Body210`, and other names in `componentManager.js` and `generatorInteraction.js`.
- The model is rotated by `-Math.PI / 2` after loading.

## Existing performance settings

The current code already includes some performance work:

- renderer pixel ratio is capped at `1.25`
- shadow maps are disabled
- model mesh shadows are disabled
- frustum culling is enabled
- materials use `THREE.FrontSide`
- pointer raycasting is sampled approximately every 50 ms
- the renderer uses `powerPreference: 'high-performance'`
- the application continuously renders with `requestAnimationFrame`
- the scene uses multiple ambient, hemisphere, directional, point, and spot lights

## What happened previously

A prior attempt converted the OBJ to a Meshopt-compressed GLB and changed `src/main.js` to use `GLTFLoader`. The file became about 4.9 MB, but the deployed model lost its colors. That change was intentionally reverted in commit `4568858`, which is the current local state. Do not repeat that approach without first proving that all Fusion materials, material assignments, node names, transforms, and visual output are preserved.

## Required analysis

First inspect the complete repository and determine whether the reported latency is primarily:

1. network/download latency,
2. OBJ text parsing and main-thread blocking,
3. GPU frame/render latency,
4. raycasting/interaction latency,
5. Render cache or deployment configuration, or
6. a combination of these.

Use measurable evidence. Record model size, build output size, scene node/mesh counts, material counts, and any available browser performance evidence. Do not assume that reducing file size alone fixes runtime frame latency.

## Solution constraints

- Preserve all existing colors and material assignments.
- Preserve object names and subsystem selection/animation behavior.
- Preserve the current model orientation and camera framing.
- Keep the free Render Static Site deployment.
- Avoid adding a backend unless there is a compelling technical reason.
- Do not delete the original model until a replacement is visually and behaviorally verified.
- Do not silently simplify or merge away named components.
- Do not claim “zero latency”; provide realistic first-load and steady-state targets.

## Preferred solution process

Compare at least these options:

1. Correct and optimize the current OBJ/MTL path, including fixing the `CHP.mtl` naming mismatch and using browser caching.
2. Convert to GLB while faithfully importing the MTL colors and preserving the complete node hierarchy, then verify it in the browser with screenshots and interaction checks.
3. Use a hybrid approach: an immediate lightweight preview or shell followed by the detailed model, with subsystem assets loaded on demand.
4. Reduce runtime GPU and raycasting work independently of network optimization.

Choose the smallest change that addresses the measured bottleneck. Before editing, explain the hypothesis and the cheapest test that could disprove it. After each edit, run a focused build or browser check. If a GLB conversion is proposed, compare screenshots/materials and verify selection of at least `EngineCore`, a blue pipe, and a room shell.

## Deliverable

Return:

- a concise diagnosis with measured evidence,
- a ranked solution plan with expected latency impact,
- the exact files that should change,
- risks to colors, hierarchy, and interactions,
- validation steps and acceptance criteria.

Do not modify files until the diagnosis and proposed solution are clear. If you do implement the solution, keep the diff focused and leave the Render deployment usable.