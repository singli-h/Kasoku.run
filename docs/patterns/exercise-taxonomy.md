## Exercise Taxonomy (Type vs Tags)

### Goal
Keep `exercise_type` as a single, primary **intent bucket** for UI grouping, while using tags and metadata for filtering. This avoids mixing type and tags and keeps the taxonomy stable as the library grows.

---

## Exercise Naming Convention

### Structure
```
[Position] [Laterality] Base Exercise Name [(Variant)]
```

### Rules

| Rule | Convention | Example |
|------|------------|---------|
| **1. Base name first** | Core movement pattern comes first | `Squat`, `Deadlift`, `Bench Press` |
| **2. Variants in parentheses** | Equipment, resistance, or style modifier at end | `Hip Thrust (Barbell)`, `Push-Up (Band-Resisted)` |
| **3. Position prefix** | When body position fundamentally changes the exercise | `Seated Calf Raise`, `Incline Dumbbell Press` |
| **4. Laterality prefix** | Hyphenated compound before base name | `Single-Leg RDL`, `One-Arm Dumbbell Row` |
| **5. Singular form** | Never pluralize exercise names | `Box Jump` ✓, `Box Jumps` ✗ |
| **6. Title Case** | Capitalize all significant words | `Romanian Deadlift (Dumbbell)` |
| **7. Hyphenate compounds** | Multi-word modifiers use hyphens | `Push-Up`, `Pull-Up`, `Step-Up`, `Half-Kneeling` |
| **8. Abbreviations** | Use standard abbreviations consistently | `RDL` (Romanian Deadlift), `GHR` (Glute Ham Raise) |

### What goes in parentheses (suffix)

| Category | Examples |
|----------|----------|
| **Equipment** | `(Barbell)`, `(Dumbbell)`, `(Kettlebell)`, `(Cable)`, `(Machine)`, `(Band)` |
| **Resistance modifier** | `(Band-Resisted)`, `(Weighted)`, `(Assisted)` |
| **Technique variant** | `(Paused)`, `(Tempo)`, `(Speed-Strength)`, `(Overcoming)` |
| **Range variant** | `(Extended)`, `(Short Lever)` |

### What goes as prefix (NOT in parentheses)

| Category | Prefixes | Examples |
|----------|----------|----------|
| **Position** | `Seated`, `Standing`, `Incline`, `Decline`, `Half-Kneeling`, `Prone`, `Supine` | `Seated Calf Raise`, `Incline Bench Press` |
| **Laterality** | `Single-Leg`, `Single-Arm`, `One-Arm`, `Alternating` | `Single-Leg RDL`, `One-Arm Dumbbell Row` |

### Naming Examples

| ✓ Correct | ✗ Incorrect | Reason |
|-----------|-------------|--------|
| `Bulgarian Split Squat (Dumbbell)` | `Dumbbell Bulgarian Split Squat` | Equipment goes in parentheses |
| `Push-Up` | `Pushup`, `Push Up` | Hyphenate compound exercises |
| `Single-Leg Glute Bridge` | `Single Leg Glute Bridge` | Hyphenate laterality modifier |
| `Box Jump` | `Box Jumps` | Use singular form |
| `Standing Calf Raise` | `Calf Raise (Standing)` | Position is a prefix, not in parentheses |
| `Seated Calf Raise (Machine)` | `Machine Seated Calf Raise` | Position prefix + equipment in parentheses |
| `Incline Bench Press (Barbell)` | `Barbell Incline Bench Press` | Position prefix + equipment in parentheses |
| `A-Skip` | `A Skip` | Hyphenate letter-based drill names |

### Sprint & Drill Naming

| Pattern | Example |
|---------|---------|
| Start type + Sprint | `Block Start Sprint`, `Standing Start Sprint`, `3-Point Start Sprint` |
| Sprint modifier | `Flying Sprint`, `Hill Sprint`, `Resisted Sprint (Sled)` |
| Drill letter + name | `A-Skip`, `B-Skip`, `A-March` |
| Wall drills | `Wall Drill (A-Position)`, `Wall Drill March`, `Wall Drill Switch` |

---

### Allowed exercise types

| ID | Type | Description |
|----|------|-------------|
| 1 | Isometric | Static holds for strength or tendon loading |
| 2 | Plyometric | Explosive jumps/hops/throws focused on reactive power |
| 3 | Gym | General strength or gym-based lifts and accessories |
| 4 | Warmup | General prep or activation before training |
| 5 | Circuit | Conditioning circuits or mixed movement sequences |
| 6 | Sprint | High-intensity running efforts (accel, max velocity, speed endurance) |
| 7 | Drill | Technical skill or mechanics drills (non-maximal, form-first) |
| 8 | Mobility | Joint range of motion, soft-tissue mobility, or stretch-based drills |
| 9 | Recovery | Low-intensity recovery activities (flush, breathing, easy movement) |

### Tags and fields (filters, not types)
- region_tag: Lower Body, Upper Body, Core, Full Body.
- goal_tag: Strength, Power, Endurance, Flexibility, Recovery.
- modality_tag: Running, Weight Training, Recovery.
- equipment_tags: Pipe-delimited equipment list.
- contraindication_tags: Pipe-delimited safety tags (knee pain, shoulder pain, low back pain, achilles issues).

### Assignment rules
- If it is **static**, use Isometric.
- If it is **explosive jumping/throwing**, use Plyometric.
- If it is **maximal or near-maximal running**, use Sprint.
- If it is **technical mechanics practice**, use Drill.
- If it is **prep/activation**, use Warmup.
- If it is **mobility/stretches**, use Mobility.
- If it is **low-intensity recovery**, use Recovery.
- Otherwise, default to Gym.

### Notes
- Do not store muscle groups in tags. Use `primary_muscles` and `secondary_muscles` later when the schema supports them.
