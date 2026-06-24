"""
LiftLog API Bridge
==================
A lightweight local FastAPI server that connects the React frontend to the
existing rep_counter.py state machines.

When the user changes the active exercise in the Live Tracking Hub, the
frontend POSTs to /api/select-exercise. This bridge instantiates the
matching GymSession(exercise_name) from rep_counter.py, which queues the
correct MovementTracker (Vertical / Horizontal / Hinge / Fly).

Run locally:
    pip install fastapi "uvicorn[standard]"
    uvicorn api_bridge:app --reload --port 8000

The Vite dev server proxies /api -> http://localhost:8000 (see vite.config.ts),
so the frontend can call /api/select-exercise with no CORS friction.
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

# Permissive CORS so the frontend (any origin) can call the bridge directly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Client-Info", "Apikey"],
)

# The single live session held in memory; replaced whenever the user picks a
# new exercise in the Live Tracking Hub.
_active_session: GymSession | None = None

# Exercises that the hardware placement rules force to the waist. Mirrors the
# waist_exercises list inside GymSession, exposed here so the frontend can show
# the correct placement badge without duplicating the logic.
WAIST_EXERCISES = {
    "squat", "leg_press", "calf_raises", "leg_extension", "leg_curl",
    "dips", "pullups", "shoulder_press", "lat_pulldowns",
}

# Friendly tracker family names for the frontend ack payload.
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


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "supported": sorted(EXERCISE_DATABASE.keys())}


@app.post("/api/select-exercise", response_model=SelectExerciseResponse)
def select_exercise(req: SelectExerciseRequest) -> SelectExerciseResponse:
    global _active_session

    name = req.exercise_name.strip().lower().replace(" ", "_")

    tracker_class = EXERCISE_DATABASE.get(name)
    if tracker_class is None:
        # Unknown exercise (e.g. a newly added one) — fall back to the vertical
        # tracker so the session is still usable. The frontend keeps working.
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


@app.get("/api/session")
def current_session() -> dict:
    if _active_session is None:
        return {"active": False}
    return {
        "active": True,
        "exercise": _active_session.exercise_name,
        "placement": _active_session.device_location,
        "reps": _active_session.tracker.reps,
        "state": _active_session.tracker.state,
    }
