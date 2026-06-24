import time
import math

# State machines and physics side

class MovementTracker:
    """Base class for all rep trackers."""
    def __init__(self):
        self.reps = 0
        self.state = "IDLE"

class VerticalLinearTracker(MovementTracker):
    """Tracks up/down movements (Squats, Dips, Pullups, etc.)"""
    def process_data(self, ax, ay, az, gx, gy, gz):
        # Using Z-axis acceleration for up/down detection
        if self.state == "IDLE" and az < 8.0:
            self.state = "GOING_DOWN"
        elif self.state == "GOING_DOWN" and az > 11.5:
            self.state = "COMING_UP"
        elif self.state == "COMING_UP" and az <= 10.2:
            self.reps += 1
            self.state = "IDLE"
            print(f"Vertical Rep\tTotal: {self.reps}")

class HorizontalLinearTracker(MovementTracker):
    """Tracks forward/back movements (Bench Press, Pushups)"""
    def process_data(self, ax, ay, az, gx, gy, gz):
        # Using X/Y-axis acceleration (Forward push/pull)
        # Note: fix these numbers with the data
        magnitude = math.sqrt(ax**2 + ay**2) 
        if self.state == "IDLE" and magnitude > 12.0:
            self.state = "PUSHING"
        elif self.state == "PUSHING" and magnitude < 9.0:
            self.reps += 1
            self.state = "IDLE"
            print(f"Horizontal Rep\total: {self.reps}")

class RotationalHingeTracker(MovementTracker): 
    """Tracks elbow/knee arcs (Bicep Curls, Skull Crushers, Extensions)"""
    def process_data(self, ax, ay, az, gx, gy, gz):
        # Uses the Gyroscope to detect the sweeping angular motion of a hinge joint
        if self.state == "IDLE" and abs(gx) > 150.0: # 150 degrees/sec rotation
            self.state = "FLEXING"
        elif self.state == "FLEXING" and abs(gx) < 20.0:
            self.reps += 1
            self.state = "IDLE"
            print(f"Hinge Rep\tTotal: {self.reps}")

class TransverseArcTracker(MovementTracker):
    """Tracks horizontal sweeping arcs (Pec Fly, Rear Delt)"""
    def process_data(self, ax, ay, az, gx, gy, gz):
        # Uses Gyroscope yaw/roll depending on arm orientation
        if self.state == "IDLE" and abs(gy) > 120.0: 
            self.state = "SWEEPING"
        elif self.state == "SWEEPING" and abs(gy) < 20.0:
            self.reps += 1
            self.state = "IDLE"
            print(f"Fly Rep\tTotal: {self.reps}")

# Connecting the frontend to the physics

# Grouping all of the major exercises into the 4 sections based on movement
EXERCISE_DATABASE = {
    # Vertical Group
    "squat": VerticalLinearTracker,
    "dips": VerticalLinearTracker,
    "shoulder_press": VerticalLinearTracker,
    "lat_pulldowns": VerticalLinearTracker,
    "pullups": VerticalLinearTracker,
    "calf_raises": VerticalLinearTracker,
    "leg_press": VerticalLinearTracker,
    
    # Horizontal Group
    "chest_press": HorizontalLinearTracker,
    "pushups": HorizontalLinearTracker,
    
    # Hinge Group
    "bicep_curls": RotationalHingeTracker,
    "tricep_pushdowns": RotationalHingeTracker,
    "skull_crushers": RotationalHingeTracker,
    "leg_extension": RotationalHingeTracker,
    "leg_curl": RotationalHingeTracker,
    "deadlift": RotationalHingeTracker,
    
    # Fly Group
    "pec_fly": TransverseArcTracker,
    "rear_delt": TransverseArcTracker
}

# Managing each exercise

class GymSession:
    def __init__(self, exercise_name, device_location="wrist"):
        self.exercise_name = exercise_name.lower()
        self.device_location = device_location.lower()
        
        # Change the location for exercises that require the waist
        waist_exercises = ["squat", "leg_press", "calf_raises", "leg_extension", "leg_curl", "dips", "pullups"]
        
        if self.exercise_name in waist_exercises:
            self.device_location = "waist"
            print(f"For {self.exercise_name.upper()}, please clip the tracker to your waist.")
        else:
            self.device_location = "wrist"
            print(f"For {self.exercise_name.upper()}, wear the tracker on your wrist.")
            
        # Call the right tracking algorithm
        tracker_class = EXERCISE_DATABASE.get(self.exercise_name)
        if not tracker_class:
            raise ValueError(f"Exercise '{self.exercise_name}' is not supported yet.")
            
        self.tracker = tracker_class()
        print(f"Tracking Started [Location: {self.device_location.upper()}]")

    def feed_sensor_data(self, data_string):
        """Simulates receiving the Bluetooth string from the ESP32"""
        # Parse the string "ax,ay,az,gx,gy,gz" back into floats
        ax, ay, az, gx, gy, gz = map(float, data_string.split(','))
        
        # Pass the raw physics data into the active tracker
        self.tracker.process_data(ax, ay, az, gx, gy, gz)

    def get_summary(self):
        return {
            "device": "LiftLog_Proto3",
            "exercise": self.exercise_name,
            "reps_completed": self.tracker.reps,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }


if __name__ == "__main__":
    ...