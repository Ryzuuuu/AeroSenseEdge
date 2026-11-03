<div align="center">

# ✈️ AeroSense Edge

**Onboard edge-AI advisory for real-time fuel and emissions optimisation**

Physics-based A320 flight simulation · LightGBM fuel-burn prediction · top-of-descent and APU advisories · auditable CO₂ log · live React dashboard

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![LightGBM](https://img.shields.io/badge/LightGBM-gradient%20boosting-2E8B57?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

</div>

---

## The idea

Fuel is aviation's biggest cost and its biggest emissions lever, yet fuel optimisation today happens on the ground, before and after the flight. **AeroSense Edge** proposes an advisory layer that runs *on the aircraft*, with no dependence on a ground link, and recommends the most fuel- and CO₂-efficient way to fly the next phase of flight. The pilot stays in command; the system only advises.

The full problem statement, architecture, hardware/certification path and impact estimates are in [`docs/PROPOSAL.md`](docs/PROPOSAL.md).

## What this repository implements

This repo is a **working simulation prototype** of the idea. It does **not** read real aircraft buses (no ARINC 429/664) and does not run on avionics hardware; all flight data is generated.

| Module | What it does |
|---|---|
| **Flight scenario generator** | Simulates a full climb → cruise → descent profile minute by minute for an **A320**, using [OpenAP](https://github.com/junzis/openap) fuel-flow and WRAP performance models. Inputs: route distance, cruise altitude, aircraft weight, a wind seed, and an engine-degradation toggle (adds a 1–3 % penalty on top of the physics). |
| **Fuel-burn predictor** | A **LightGBM** regressor trained at API startup on 200 synthetic flights (25 seeds × 4 altitude variants × 2 engine states) with an 80/20 train/test split. Features: altitude, Mach, speed, weight, wind component, engine-degraded flag. Held-out R², MAE and MAPE are logged at startup and returned by `/health`. |
| **Top-of-descent advisor** | Compares a 3° idle descent path with a 4.5° late descent and reports the top-of-descent distance plus estimated fuel and CO₂ saved. |
| **APU advisor** | Recommends APU shut-down timing during a turnaround when ground power is available (115 kg/h APU burn assumed). |
| **Compliance log** | Every simulated flight and advisory is written to a local **SQLite** database, exportable as JSON or CSV. CO₂ is computed at 3.16 kg per kg of fuel. |
| **Dashboard** | React + Recharts UI showing the flight profile, predicted vs. physics fuel flow, key metrics, the advisory feed and the APU panel, with a CSV export button. |

## Architecture

```
React + Vite dashboard (:5173)  ──HTTP──▶  FastAPI backend (:8000)
                                              ├─ OpenAP physics (A320)  → synthetic flight
                                              ├─ LightGBM predictor     → fuel-flow prediction
                                              ├─ TOD + APU advisors     → recommendations
                                              └─ SQLite                 → compliance log
```

## Run it

Requirements: **Python 3.10+** and **Node.js 18+**.

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows (PowerShell): .venv\Scripts\Activate.ps1      macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

On startup the API generates the training flights and trains the model, which takes a short while. Wait for the log lines showing the held-out metrics.

### 2. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Open **http://127.0.0.1:5173**. For a production bundle, run `npm run build`.

### 3. Check it

```bash
curl http://127.0.0.1:8000/health
```

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Service status, model-loaded flag and held-out model metrics |
| `/simulate` | POST | Run a full flight simulation with predictions, TOD and APU advisories |
| `/advisory` | POST | Standalone APU advisory with custom turnaround inputs |
| `/export` · `/export-csv` | GET | Download the compliance log as JSON / CSV |
| `/docs` | GET | Interactive Swagger UI |

## Project structure

```
backend/app/main.py        FastAPI app: simulator, LightGBM model, advisors, SQLite log
backend/app/dashboard.html Minimal fallback page served at /
frontend/src/              React dashboard (components, simulation hook)
docs/PROPOSAL.md           Full concept and proposal write-up
```

The SQLite file and other runtime artifacts are generated locally and ignored by Git.

## Honest scope

- A local run on a clean install reported held-out R² 0.970, MAE ≈ 52 kg/h and MAPE ≈ 3.3 % (your numbers may differ slightly).
- Flight data is simulated, and the LightGBM model learns the OpenAP fuel-flow physics, so its accuracy figures describe fit to the simulator, **not** real-aircraft performance.
- Hardware targets (Jetson-class module, FPGA), ARINC bus ingestion and DO-178C/DO-254 assurance are part of the *proposal* in `docs/PROPOSAL.md`, not of this code.

## License

MIT, see [`LICENSE`](LICENSE).
