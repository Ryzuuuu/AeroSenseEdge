from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel
import math
import random
import sqlite3
from pathlib import Path
from typing import Any, Dict, List

app = FastAPI(title="AeroSense Edge Simulation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = Path(__file__).resolve().parent / "aerosense.db"


class ScenarioRequest(BaseModel):
    route_distance_nm: float = 1200.0
    cruise_altitude_ft: float = 34000.0
    wind_seed: int = 42
    aircraft_weight_t: float = 68.0
    degraded_engine: bool = False


class AdvisoryRequest(BaseModel):
    arrival_time_min: float = 30.0
    expected_departure_min: float = 20.0
    ground_power_available: bool = True


def generate_flight_scenario(req: ScenarioRequest) -> List[Dict[str, Any]]:
    rng = random.Random(req.wind_seed)
    rows: List[Dict[str, Any]] = []

    climb_duration = 20
    cruise_duration = 75
    descent_duration = 25
    total_duration = climb_duration + cruise_duration + descent_duration

    for i in range(total_duration):
        if i < climb_duration:
            altitude_ft = 1000.0 + i * (req.cruise_altitude_ft - 1000.0) / climb_duration
            mach = 0.25 + (i / climb_duration) * 0.72
            speed_kt = mach * 660.0
        elif i < climb_duration + cruise_duration:
            altitude_ft = req.cruise_altitude_ft
            mach = 0.78 + 0.01 * math.sin(i / 8.0)
            speed_kt = mach * 660.0
        else:
            altitude_ft = req.cruise_altitude_ft - (i - (climb_duration + cruise_duration)) * (req.cruise_altitude_ft - 2000.0) / descent_duration
            mach = 0.72 - (i - (climb_duration + cruise_duration)) * 0.5 / descent_duration
            speed_kt = mach * 660.0

        wind_component_kt = (rng.uniform(-20.0, 20.0) + 5.0 * math.sin(i / 6.0)) * 0.5
        speed_kt = speed_kt + wind_component_kt * 0.15
        weight_t = (req.aircraft_weight_t * 1000.0 - i * 1.2) / 1000.0

        base_ff = 2400.0 + 0.002 * altitude_ft + 0.6 * max(0.0, speed_kt - 450.0)
        if req.degraded_engine:
            base_ff *= 1.02
        fuel_flow = base_ff + rng.uniform(-25.0, 25.0) + max(0.0, wind_component_kt) * 2.5

        rows.append({
            "time_min": i,
            "altitude_ft": round(altitude_ft, 2),
            "speed_kt": round(speed_kt, 2),
            "fuel_flow_kg_hr": round(fuel_flow, 2),
            "weight_t": round(weight_t, 3),
            "distance_nm": round(i * req.route_distance_nm / total_duration, 2),
            "wind_component_kt": round(wind_component_kt, 3),
            "engine_degraded": 1 if req.degraded_engine else 0,
        })
    return rows


def train_model() -> Dict[str, Any]:
    samples: List[Dict[str, Any]] = []
    for seed in range(1, 21):
        for degraded in [False, True]:
            req = ScenarioRequest(
                route_distance_nm=1100.0 + seed * 8.0,
                cruise_altitude_ft=33000.0 + (seed % 5) * 1000.0,
                wind_seed=seed,
                aircraft_weight_t=68.0 + (seed % 7) * 0.5,
                degraded_engine=degraded,
            )
            samples.extend(generate_flight_scenario(req))

    features: List[List[float]] = []
    targets: List[float] = []
    for row in samples:
        features.append([
            row["altitude_ft"] / 1000.0,
            row["speed_kt"] / 100.0,
            row["weight_t"] / 10.0,
            row["wind_component_kt"] / 10.0,
            1.0 if row["engine_degraded"] else 0.0,
        ])
        targets.append(float(row["fuel_flow_kg_hr"]))

    weights = [0.0] * 6
    learning_rate = 0.00002
    for _ in range(400):
        gradients = [0.0] * 6
        for feature_vector, target in zip(features, targets):
            prediction = weights[0] + sum(w * x for w, x in zip(weights[1:], feature_vector))
            error = prediction - target
            gradients[0] -= 2.0 * error / len(features)
            for idx, value in enumerate(feature_vector):
                gradients[idx + 1] -= 2.0 * error * value / len(features)
        for idx in range(len(weights)):
            weights[idx] -= learning_rate * gradients[idx]

    return {"weights": weights}


def predict_fuel(model: Dict[str, Any], rows: List[Dict[str, Any]]) -> List[float]:
    weights = model["weights"]
    predictions: List[float] = []
    for row in rows:
        feature_vector = [
            row["altitude_ft"] / 1000.0,
            row["speed_kt"] / 100.0,
            row["weight_t"] / 10.0,
            row["wind_component_kt"] / 10.0,
            1.0 if row["engine_degraded"] else 0.0,
        ]
        prediction = weights[0] + sum(w * x for w, x in zip(weights[1:], feature_vector))
        predictions.append(max(1000.0, prediction))
    return predictions


def compute_tod(req: ScenarioRequest) -> Dict[str, Any]:
    altitude = req.cruise_altitude_ft
    descent_rate_ft_min = 2000.0
    tod_distance_nm = (altitude - 1000.0) / (descent_rate_ft_min / 60.0 / 6076.0 * 60.0) * 0.5
    tod_distance_nm = max(50.0, min(req.route_distance_nm * 0.8, tod_distance_nm))
    baseline_distance_nm = tod_distance_nm + 25.0
    naive_fuel_kg = 180.0 + 0.7 * (baseline_distance_nm - tod_distance_nm)
    optimal_fuel_kg = 140.0 + 0.4 * (baseline_distance_nm - tod_distance_nm)
    fuel_delta_kg = max(0.0, naive_fuel_kg - optimal_fuel_kg)
    return {
        "tod_distance_nm": round(tod_distance_nm, 2),
        "baseline_distance_nm": round(baseline_distance_nm, 2),
        "fuel_delta_kg": round(fuel_delta_kg, 2),
        "descent_angle_deg": 3.0,
    }


def compute_apu_advisory(req: AdvisoryRequest) -> Dict[str, Any]:
    apr = 115.0
    duration_min = max(0.0, req.arrival_time_min - req.expected_departure_min)
    if duration_min <= 0:
        return {"apu_off_recommended": False, "fuel_saved_kg": 0.0, "reason": "No turnaround window available."}
    fuel_saved_kg = (duration_min / 60.0) * apr
    if req.ground_power_available:
        return {"apu_off_recommended": True, "fuel_saved_kg": round(fuel_saved_kg, 2), "reason": "Ground power available; APU should be shut down."}
    return {"apu_off_recommended": False, "fuel_saved_kg": 0.0, "reason": "Ground power unavailable; keep APU on."}


@app.get("/", response_class=HTMLResponse)
def index() -> FileResponse:
    return FileResponse(Path(__file__).resolve().parent / "dashboard.html")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/simulate")
def simulate(req: ScenarioRequest) -> Dict[str, Any]:
    rows = generate_flight_scenario(req)
    model = train_model()
    predictions = predict_fuel(model, rows)

    for idx, prediction in enumerate(predictions):
        row = rows[idx]
        row["predicted_fuel_flow_kg_hr"] = round(prediction, 2)
        row["prediction_error_pct"] = round(((prediction - row["fuel_flow_kg_hr"]) / row["fuel_flow_kg_hr"]) * 100.0, 3)
        row["prediction_error_abs_kg_hr"] = round(abs(prediction - row["fuel_flow_kg_hr"]), 3)

    conn = sqlite3.connect(DB_PATH)
    conn.execute("DROP TABLE IF EXISTS flight_scenarios")
    conn.execute(
        "CREATE TABLE flight_scenarios (time_min INTEGER, altitude_ft REAL, speed_kt REAL, fuel_flow_kg_hr REAL, weight_t REAL, distance_nm REAL, wind_component_kt REAL, engine_degraded INTEGER, predicted_fuel_flow_kg_hr REAL, prediction_error_pct REAL, prediction_error_abs_kg_hr REAL)"
    )
    conn.executemany(
        "INSERT INTO flight_scenarios VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            (
                row["time_min"],
                row["altitude_ft"],
                row["speed_kt"],
                row["fuel_flow_kg_hr"],
                row["weight_t"],
                row["distance_nm"],
                row["wind_component_kt"],
                row["engine_degraded"],
                row["predicted_fuel_flow_kg_hr"],
                row["prediction_error_pct"],
                row["prediction_error_abs_kg_hr"],
            )
            for row in rows
        ],
    )
    conn.commit()
    conn.close()

    mae = sum(abs(row["prediction_error_abs_kg_hr"]) for row in rows) / len(rows)
    mape = sum(abs(row["prediction_error_pct"]) for row in rows) / len(rows)

    return {
        "flight_id": f"flight-{req.wind_seed}",
        "records": rows,
        "metrics": {
            "mae_kg_hr": round(mae, 2),
            "mape_pct": round(mape, 2),
            "fuel_total_kg": round(sum(row["fuel_flow_kg_hr"] for row in rows) / 60.0, 2),
        },
        "tod": compute_tod(req),
        "apu": compute_apu_advisory(AdvisoryRequest()),
    }


@app.get("/records")
def records() -> List[Dict[str, Any]]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.execute("SELECT * FROM flight_scenarios LIMIT 20")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows


@app.post("/advisory")
def advisory(req: AdvisoryRequest) -> Dict[str, Any]:
    return compute_apu_advisory(req)


@app.get("/export")
def export_log() -> Dict[str, Any]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.execute("SELECT * FROM flight_scenarios")
    rows = cursor.fetchall()
    conn.close()
    if not rows:
        raise HTTPException(status_code=404, detail="No simulation data available.")

    export = []
    for row in rows:
        export.append({
            "timestamp_min": int(row["time_min"]),
            "fuel_flow_kg_hr": float(row["fuel_flow_kg_hr"]),
            "predicted_fuel_flow_kg_hr": float(row["predicted_fuel_flow_kg_hr"]),
            "co2_kg": float(row["fuel_flow_kg_hr"] * 3.16 / 1000.0),
        })
    return {"records": export}
