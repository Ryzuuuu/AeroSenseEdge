# AeroSense Edge

## Q42 — Project Title
AeroSense Edge — Onboard AI for Real-Time Fuel and Emissions Optimization

## Q44 — Subcategory
Edge AI for Sustainable Aviation & Energy Optimization

## Q45 — Problem Statement
Aviation is entering a decade where fuel is simultaneously its largest cost and its most urgent decarbonisation challenge, and in 2026 those two pressures have collided. IATA forecasts the global airline fuel bill rising from around $252 billion in 2025 to roughly $350 billion in 2026, pushing fuel to nearly 31% of operating expenses following jet fuel price shocks. Every percentage point of fuel burned has become a first-order financial and environmental lever for every airline.

Regulation is tightening in parallel. Burning one tonne of jet fuel emits approximately 3.16 tonnes of CO2. Under ICAO's CORSIA scheme, the mandatory Second Phase running from 2027 to 2035 extends carbon offsetting obligations to all member states including India, meaning Indian carriers like Air India face offsetting requirements from 2027 against an 85% of 2019 emissions baseline. On European routes, the EU Emissions Trading System moved to 100% auctioning of aviation allowances in 2026 with no free allowances remaining. ReFuelEU Aviation simultaneously mandates rising Sustainable Aviation Fuel blending starting at 2% in 2025 and climbing to 70% by 2050, while SAF today costs two to three times conventional jet fuel and represents less than 1% of total fuel supply. The cheapest compliant tonne of CO2 is therefore the one that is never burned.

The operational waste driving this problem is well documented. Airlines carry conservative contingency fuel to hedge against uncertainty, but every extra tonne carried burns approximately 2 to 5% of itself per flight hour in what is called the cost of carry. On the ground, the Auxiliary Power Unit burns roughly 100 to 130 kg per hour during turnarounds, accounting for around 2 to 2.5% of total fuel per flight cycle. Descents flown without continuous-descent optimisation waste additional fuel on every single approach across every flight.

The deeper structural problem is that today's fuel optimisation happens almost entirely on the ground and after the fact. Flight planning systems compute a fuel plan from forecast winds before departure. Post-flight dashboards tell airlines what went wrong the previous day. Neither closes the loop in flight, where actual wind fields, actual aircraft weight, and actual engine degradation diverge from the pre-departure plan. The rule-based guidance that does exist onboard through the Flight Management System cost-index and fixed standard operating procedures cannot learn a specific aircraft's degraded engine signature, cannot adapt to actual wind conditions in real time, and cannot jointly optimise climb, cruise, descent, and APU usage together. Cloud-based connected aircraft analytics promise real-time optimisation but depend on in-flight connectivity that is bandwidth-limited, expensive, and simply unavailable over oceans and remote airspace, which is precisely where long-haul fuel is burned.

The result is a structural gap: a multi-billion-dollar, safety-relevant, latency-sensitive optimisation problem that must run where the data is generated, which is onboard the aircraft, yet today is solved on the ground, late, and disconnected from live conditions. That is the gap AeroSense Edge targets.

## Q46 — Proposed Solution
AeroSense Edge is an onboard edge AI system that continuously predicts fuel burn and recommends the most fuel and emissions efficient way to fly the next phase of flight, all computed on the aircraft itself with no dependency on ground connectivity whatsoever. It runs as an advisory layer on a certified Electronic Flight Bag or avionics compute unit. The pilot in command always retains full authority over every decision, which keeps the system operationally tractable and on a realistic certification path while still delivering the closed-loop real-time optimisation that the FMS alone cannot provide.

All inference happens locally on an embedded accelerator installed in the avionics bay. The aircraft never needs a live ground link to operate. The system ingests data already present on its own buses, fuses it, runs compressed machine learning models in milliseconds, and presents recommendations directly to the crew. Connectivity through gate Wi-Fi on the ground or a low-rate datalink in the air is used only opportunistically to pull updated weather data and to push compact logs and receive improved model weights. Optimisation is never gated on connectivity, so the system performs identically over the mid-Atlantic, over the Himalayas, or in any connectivity-denied airspace.

Four data domains are fused in real time to power the inference engine. Engine telemetry from the FADEC and engine electronic controllers covers N1 and N2 spool speeds, exhaust gas temperature, fuel flow, and thrust, allowing the model to learn each individual aircraft tail's actual degrading performance rather than relying on a generic book figure. Aircraft state data covers altitude, Mach number, airspeed, attitude, configuration, weight, and centre of gravity sourced from air data and inertial systems. Atmospheric data combines uploaded wind and temperature forecasts reconciled against the actual wind vector derived onboard, along with turbulence and weather radar cues. Trajectory and navigation data covers the active route, distance to go, and flight constraints from the FMS and GNSS. A fusion layer time-aligns all these heterogeneous data rates into a single clean state vector for the models.

The system targets four specific operational scenarios. For APU and ground energy management, it determines optimal APU-off timing, ground power versus APU decisions, and single-engine taxi calls based on turnaround context, directly targeting the 100 to 130 kg per hour the APU consumes on the ground. For climb and descent profile optimisation, it recommends optimal climb speed and step altitude and computes an accurate top-of-descent point for a continuous idle descent, eliminating the level-off and early-descent waste that occurs on every approach today. For real-time fuel burn prediction, it forecasts burn for the conditions actually ahead, giving crews and dispatchers the confidence to trust tighter, evidence-based fuel loads that cut the cost of carry while aligning with ReFuelEU anti-tankering rules. For cruise optimisation, it tunes the Mach number and altitude that minimises burn given live winds and current aircraft weight.

Every recommendation is logged together with the underlying data, producing an auditable per-flight fuel and CO2 record that feeds directly into CORSIA, EU ETS, and ReFuelEU regulatory reporting, turning operational optimisation into compliance evidence simultaneously.

## Q47 — Technologies and Frameworks
The reference edge hardware target is an NVIDIA Jetson AGX Orin module delivering approximately 275 TOPS on an Ampere GPU paired with Arm Cortex-A78AE safety-enhanced CPU cores featuring lockstep execution suited to real-time safety-relevant inference. For applications requiring greater headroom the newer Blackwell-based Jetson Thor is a forward-looking target. For a deterministic and certifiable path, the COTS accelerator is paired with an FPGA such as the AMD Xilinx Versal AI Edge series, which hosts the safety-monitored inference path. FPGAs provide bit-deterministic timing guarantees and a DO-254 hardware certification route that GPU platforms do not offer. The resulting heterogeneous design uses the GPU and VPU for heavy ML workloads and the FPGA for the deterministic advisory output path, packaged to DO-160 environmental qualification for the avionics bay covering passive cooling, vibration, temperature range, and EMI.

Models are trained off-aircraft in PyTorch and TensorFlow, exported to ONNX as the portable interchange format, and then compiled to the target runtime. On Jetson hardware this means NVIDIA TensorRT with a C++ runtime for predictable, low-overhead latency. On alternative platforms, TensorFlow Lite and ONNX Runtime serve the same role. The compiled inference engine runs without a heavy Python stack, which is essential for real-time determinism in an avionics context.

Four model types form the core of the system. A fuel burn predictor uses a compact temporal architecture such as a gradient-boosted ensemble or a small 1D CNN or LSTM regressing fuel flow and burn from the fused state vector. A profile optimiser uses a learned performance surrogate wrapped in a lightweight model-predictive optimisation loop searching climb, cruise, and descent options. An APU and taxi advisor uses a classifier over turnaround context features. An engine efficiency anomaly detector feeds both real-time guidance and downstream maintenance alerts.

The real-time data ingestion layer reads aircraft buses through ARINC 429 for legacy point-to-point label traffic and ARINC 664 AFDX switched deterministic avionics Ethernet on modern aircraft types, via a certified data concentrator interface. A fusion and state estimation stage time-aligns multi-rate signals using Kalman-style filtering for noisy continuous channels and feature engineering for the remainder. NVIDIA Holoscan is evaluated as a high-speed sensor-to-GPU pipeline framework. Outputs render to the EFB and to an onboard logging store. Strict read-only advisory partitioning isolates AeroSense Edge from all flight-critical systems at all times.

Model compression techniques achieve the required avionics power, thermal, and latency budgets. INT8 quantisation with selective INT4 where appropriate cuts model size approximately fourfold with minimal accuracy loss. Structured pruning removes redundant channels. Knowledge distillation trains compact student models from a larger ground-trained teacher. Operator fusion and TensorRT graph optimisation complete the pipeline. The target is deterministic sub-100 millisecond inference in a passively cooled envelope.

Software assurance follows DO-178C at Design Assurance Level D or E appropriate to an advisory function, distinct from DAL A which would apply to flight-critical control. Hardware assurance follows DO-254. Environmental qualification follows DO-160. The design deliberately maintains a human-in-command advisory architecture to keep the near-term certification path realistic while EASA and EUROCAE machine learning assurance guidance continues to mature.

For simulation and validation, the OpenAP open aircraft performance toolkit provides physics-based flight performance modelling. ERA5 reanalysis atmospheric data from the Copernicus Climate Data Store provides high-fidelity historical wind and temperature fields for training. X-Plane 12 supports advisory interface integration testing. MLflow manages experiment tracking, model versioning, and staged deployment to fleet aircraft. Apache Kafka handles high-throughput Quick Access Recorder data ingestion for the ground-side training pipeline.

## Q48 — AI Category
Hybrid AI / Combination of multiple AI approaches

## Q49 — Key Benefits and Impact
All figures below are modelled estimates built from public industry data using a single-aircraft worked example of an A320-family narrowbody flying approximately 3,000 block hours per year at roughly 2.5 tonnes of fuel per hour, giving approximately 7,500 tonnes of fuel per year as the baseline.

The system targets an aggregate fuel burn reduction of 2 to 5% per flight by stacking independent optimisation levers. Trajectory and cost-index and optimal-altitude tuning contributes approximately 1 to 2%. Continuous-descent and accurate top-of-descent optimisation adds around 0.5 to 1%. Tighter, evidence-based fuel loads that reduce cost of carry contribute 0.3 to 0.8%. APU and single-engine-taxi optimisation adds 0.5 to 1.5%, particularly on short-haul-heavy networks. For reference, Airbus's own data quotes single-engine taxi alone saving up to 115 tonnes of fuel and 363 tonnes of CO2 per aircraft per year at a busy airport.

On CO2 impact, at the standard factor of 3.16 tonnes of CO2 per tonne of fuel, a conservative 3% reduction on 7,500 tonnes per year saves approximately 225 tonnes of fuel and avoids roughly 710 tonnes of CO2 per aircraft per year. Across a 100-aircraft narrowbody fleet this scales to approximately 22,500 tonnes of fuel and 71,000 tonnes of CO2 avoided annually.

On financial impact, at 2026 jet fuel prices of approximately $152 per barrel equating to around $1,200 per tonne, saving 225 tonnes per aircraft per year represents approximately $270,000 saved per aircraft annually. Even at a more normalised $90 per barrel the saving remains approximately $160,000 per aircraft per year. A 100-aircraft fleet saves between $16 million and $27 million in fuel costs per year. The per-aircraft hardware cost of a Jetson-class module plus EFB integration is a small one-time investment relative to annual savings, with payback well under 12 months per tail once the platform is built.

The compliance value compounds on top of the fuel savings. Under CORSIA's mandatory Second Phase starting 2027 including India, every tonne of CO2 not emitted is a tonne that need not be offset through carbon credit purchases priced at $10 to $40 per tonne. On European routes under the now fully auctioned EU ETS, avoided emissions cut allowance spend directly. Under ReFuelEU, because SAF costs two to three times conventional jet fuel and accounts for less than 1% of supply, burn reduction is the most cost-effective compliance lever available today. AeroSense Edge's per-flight auditable fuel and CO2 logs simultaneously serve as monitoring and reporting evidence for all three regulatory regimes, eliminating the need for separate compliance data collection.

For Tata Technologies specifically, Indian carriers enter mandatory CORSIA obligations in 2027 and already face EU ETS and ReFuelEU exposure on European routes, making onboard connectivity-independent fuel optimisation directly relevant to the group's own aviation operations and customer base.

## Run commands (Windows PowerShell)

### 1) From the project root
```powershell
cd d:\AeroSenseEdge
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
```

### 2) Start the backend
```powershell
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 3) Start the frontend in a new terminal
```powershell
cd d:\AeroSenseEdge\frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

### 4) Verify the app
```powershell
curl.exe http://127.0.0.1:8000/health
curl.exe -i http://127.0.0.1:8000/export-csv | findstr /I "HTTP/ content-disposition content-type"
```

### 5) Build the frontend for production
```powershell
cd d:\AeroSenseEdge\frontend
npm run build
```

## Project structure
- backend/app/main.py — FastAPI simulation and advisory backend
- frontend/src — React/Vite dashboard UI
- backend/requirements.txt — Python dependencies
- frontend/package.json — frontend dependencies

## Notes
- The backend uses a local simulation flow with OpenAP physics and a LightGBM-based fuel predictor.
- The frontend is a Vite + React dashboard that consumes the live backend responses.
- The repository includes a local SQLite file and generated runtime artifacts, which are ignored by Git.
