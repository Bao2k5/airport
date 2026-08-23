# Airport Surface Movement Simulator — Tân Sơn Nhất (TSN V3)

A high-fidelity educational React + TypeScript + Vite application simulating surface movement, routing, and Follow-the-Green (FTG) taxi guidance on the Tân Sơn Nhất International Airport (TSN V3) surface model.

## Features

- **TSN V3 Surface Model**: Calibrated directly against `/anhchinh.png` satellite background with 45 operational nodes (stands, runway thresholds, stop bars, and taxiway intersections).
- **Follow-the-Green (FTG) Guidance**: Realistic dynamic green center-line lighting leading aircraft along designated routes.
- **Preset Operational Scenarios**: Demonstrating wrong-turn recovery, emergency fire response, runway change (07R/25L), and FOD closure.
- **Calibration & Annotation Suite**:
  - `annotate.html` (`src/annotate.tsx`): Precision raw trace inspector and node coordinate annotator.
  - `annotate_junctions.html` (`src/annotate_junctions.tsx`): Geometric junction reviewer and connector.

## Project Structure

- `src/App.tsx` – Main application entry, simulation loop, and viewports
- `src/data/airportGraph.v3.ts` – Master TSN V3 airport network model
- `src/data/graphRegistry.ts` – Graph configuration registry
- `src/data/scenarios/` – Preset operational scenarios
- `src/simulation/` – Movement physics, separation watchdog, and pathfinding
- `src/components/` – Map rendering, lighting, control panels, and scenarios
- `src/annotate.tsx` & `src/annotate_junctions.tsx` – V3 node and junction calibration tools
- `public/anhchinh.png` – High-resolution TSN V3 airport surface chart

## Run Locally

```bash
# Install dependencies
npm install

# Start Vite development server (includes Raw Trace sync plugin)
npm run dev
```

- Main Simulator: `http://localhost:5173/`
- Node Annotator: `http://localhost:5173/annotate.html`
- Junction Annotator: `http://localhost:5173/annotate_junctions.html`

## Build for Production

```bash
npm run build
```

Build outputs are generated for the main simulator and both annotator tools into `dist/`.

## License

Educational and research demonstration project.
