# Graph Paper Plotter

A precision web application for generating standard **A4 (`210 × 297 mm`)** millimeter graph paper (`1 mm`, `2 mm`, `5 mm`, `10 mm`, or custom grid spacing), calculating exact millimeter coordinates from `(X, Y)` data points and custom `1 mm = ...` scales, and exporting high-resolution **PNG** and true-scale **A4 PDF** graphs.

## Features
- **Constant Physical A4 (`210 × 297 mm`) Sheet** with a standard `180 × 240 mm` millimeter grid.
- **Custom or Auto-Recommended `1 mm` Scale & Starting Origin** for both X and Y axes.
- **Live Millimeter Coordinate Calculation** (`X (mm)` and `Y (mm)`) for every entered `(X, Y)` point.
- **Multiple Plotting Modes:** Smooth Curve, Straight Segments, Best-Fit Straight Line (Linear Regression), or Points Only.
- **Responsive Screen Fit** that scales the A4 sheet cleanly to any screen size.
- **Offline High-Resolution Export:** Download as 300 DPI PNG or printable A4 PDF.

## Project Structure
- `index.html` — Main application layout
- `styles.css` — Responsive UI and A4 stage styling
- `app.js` — Millimeter grid engine, coordinate calculator, curve plotter, and PDF/PNG exporter
