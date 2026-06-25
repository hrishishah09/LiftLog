"""
LiftLog API Bridge
==================
A lightweight local FastAPI server that connects the React frontend to the
existing rep_counter.py state machines.

The frontend drives the backend explicitly:
  - POST /api/select-exercise  — queue a GymSession for the given exercise
    (called when a routine is started or the exercise advances).
  - POST /api/start-set        — begin movement tracking for the current set.
    The Python state machine only watches sensor data while a set is active.
  - POST /api/stop-set         — stop movement tracking (pause between sets).
  - GET  /api/session          — inspect the live session state.

Run locally:
    pip install fastapi "uvicorn[standard]"
    uvicorn api_bridge:app --reload --port 8000

The Vite dev server proxies /api -> http://localhost:8000 (see vite.config.ts),
so the frontend can call these endpoints with no CORS friction.
"""

from __future__ import annotations

import os
import sys
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Make rep_counter.py importable regardless of where uvicorn is launched from.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Imported from the existing, unmodified rep_counter.py
from rep_counter import GymSession, EXERCISE_DATABASE  # noqa: E402

app = FastAPI(title="LiftLog API Bridge", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Client-Info", "Apikey"],
)

# The single live session held in memory.
_active_session: GymSession | None = None
# Whether the backend is actively tracking movement for the current set.
_tracking: bool = False
_current_set: int = 0
_current_weight: float = 0.0
_current_unit: str = "kg"

WAIST_EXERCISES = {
    "squat", "leg_press", "calf_raises", "leg_extension", "leg_curl",
    "dips", "pullups", "shoulder_press", "lat_pulldowns",
}

TRACKER_FAMILY = {
    "VerticalLinearTracker": "Vertical",
    "HorizontalLinearTracker": "Horizontal",
    "RotationalHingeTracker": "Hinge",
    "TransverseArcTracker": "Fly",
}


class SelectExerciseRequest(BaseModel):
    exercise_name: str


class SelectExerciseResponse(BaseModel):
    ok: bool
    exercise: str
    placement: Literal["WRIST", "WAIST"]
    tracker: str


class StartSetRequest(BaseModel):
    exercise_name: str
    set_number: int
    weight: float
    unit: str


class TrackingResponse(BaseModel):
    ok: bool
    exercise: str
    set_number: int
    weight: float
    unit: str
    reps: int
    state: str


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "supported": sorted(EXERCISE_DATABASE.keys())}


@app.post("/api/select-exercise", response_model=SelectExerciseResponse)
def select_exercise(req: SelectExerciseRequest) -> SelectExerciseResponse:
    global _active_session, _tracking

    _tracking = False
    name = req.exercise_name.strip().lower().replace(" ", "_")

    tracker_class = EXERCISE_DATABASE.get(name)
    if tracker_class is None:
        _active_session = GymSession("squat")
        return SelectExerciseResponse(
            ok=False,
            exercise=name,
            placement="WAIST" if name in WAIST_EXERCISES else "WRIST",
            tracker="Vertical (fallback)",
        )

    _active_session = GymSession(name)
    family = TRACKER_FAMILY.get(tracker_class.__name__, tracker_class.__name__)
    placement = "WAIST" if name in WAIST_EXERCISES else "WRIST"
    return SelectExerciseResponse(
        ok=True,
        exercise=name,
        placement=placement,
        tracker=family,
    )


@app.post("/api/start-set", response_model=TrackingResponse)
def start_set(req: StartSetRequest) -> TrackingResponse:
    global _tracking, _current_set, _current_weight, _current_unit

    # Ensure a session exists for the requested exercise.
    name = req.exercise_name.strip().lower().replace(" ", "_")
    if _active_session is None or _active_session.exercise_name != name:
        select_exercise(SelectExerciseRequest(exercise_name=req.exercise_name))

    _tracking = True
    _current_set = req.set_number
    _current_weight = req.weight
    _current_unit = req.unit

    reps = _active_session.tracker.reps if _active_session else 0
    state = _active_session.tracker.state if _active_session else "idle"
    return TrackingResponse(
        ok=True,
        exercise=name,
        set_number=_current_set,
        weight=_current_weight,
        unit=_current_unit,
        reps=reps,
        state=state,
    )


@app.post("/api/stop-set")
def stop_set() -> dict:
    global _tracking
    _tracking = False
    return {"ok": True}


@app.get("/api/session")
def current_session() -> dict:
    if _active_session is None:
        return {
            "active": False,
            "tracking": _tracking,
            "bluetooth_connected": False,
        }
    return {
        "active": True,
        "tracking": _tracking,
        "bluetooth_connected": False,
        "exercise": _active_session.exercise_name,
        "placement": _active_session.device_location,
        "set_number": _current_set,
        "weight": _current_weight,
        "unit": _current_unit,
        "reps": _active_session.tracker.reps,
        "state": _active_session.tracker.state,
    }
