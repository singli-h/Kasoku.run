# AI Tool Analysis: Complexity, Scalability & Safety

## 1. Tool Analysis Framework

This analysis evaluates each proposed tool against four critical vectors:
1.  **Table Complexity**: Number of SQL tables joined/touched.
2.  **Context Load**: Token count vs Information Gain.
3.  **Hallucination Risk**: Probability of ID mismatch or schema drift.
4.  **Operational Scale**: Row counts in Normal vs Extreme scenarios.

---

## 2. Detailed Tool Defintions & Usage Analysis

### Tool 1: `architect_plan` (Creation Engine)
**Purpose**: Generate Full Mesocycles from scratch.
**Method**: JSON Generation (Method 2) - *Not a Function Tool*

| Metric | Analysis |
| :--- | :--- |
| **Input Context** | High. Needs Knowledge Base (Methods), Athlete Profile (Goals), Past Performance (Memories). |
| **Output Scale** | **Normal**: 1 Meso, 4 Weeks, 16 Sessions, 400 Sets (~20KB JSON). <br> **Extreme**: 12 Weeks, 48 Sessions, 1200 Sets (~60KB JSON). |
| **Tables Touched** | `macrocycles`, `mesocycles`, `microcycles`, `exercise_preset_groups`, `exercise_presets`, `exercise_preset_details`. |
| **Risk Mitigation** | **Compression**. Do NOT generate 1200 set objects. Generate 60 "Exercise Logic" objects (e.g., "Linear Periodization: 5x5 -> 4x6 -> 3x8"). The *Backend Expander* explodes this into rows. |
| **Verdict** | Safe if Compressed. Unsafe if generating raw rows (Context Limit risk). |

### Tool 2: `curate_exercises` (The Librarian)
**Purpose**: Semantic Search for exercises.

| Metric | Analysis |
| :--- | :--- |
| **Input Context** | Low. Query string + User constraints (e.g., "no equipment"). |
| **Tables Accessed** | `exercises` (Vector Search), `exercise_types`, `tags`, `exercise_tags`. |
| **Return Payload** | **Fixed**: Top 5-10 matches only. Includes `id`, `name`, `description`, `video_url`. |
| **Hallucination Risk** | Near Zero. It's a Read-Only Search. |
| **Verdict** | **Highly Scalable**. Critical for "grounding" Tool 1 & 3. |

### Tool 3: `modify_structure` (The Editor)
**Purpose**: Add/Remove/Swap content in an existing structure.

| Metric | Analysis |
| :--- | :--- |
| **Input Parameters** | `target_id` (Session/Group ID), `target_type` ("template"\|"assigned"), `action`, `payload`. |
| **Tables Touched** | **Polymorphic**: <br> Template Mode: `exercise_presets`, `exercise_preset_groups` <br> Assigned Mode: `exercise_training_sessions`, `exercise_training_details` |
| **Complexity** | High logic, Low row count. Updates 1-5 rows per call. |
| **Hallucination Risk** | **Medium**. AI might try to swap an exercise that doesn't exist. |
| **Safety Check** | **Pre-Flight Validation**. The tool code must verify `exercise_id` exists via `curate_exercises` logic *before* executing the DB update. |
| **Verdict** | **Safe**. Transactional scope is small (single session). |

### Tool 4: `manage_schedule` (The Logistics)
**Purpose**: Reschedule days or shift blocks.

| Metric | Analysis |
| :--- | :--- |
| **Input Parameters** | `session_ids[]`, `new_date`, `shift_future_sessions` (boolean). |
| **Tables Touched** | `exercise_training_sessions` (Assigned only). Templates don't have dates (they have weeks/days). |
| **Operational Scale** | **Normal**: Move 1 session (1 row update). <br> **Extreme**: "Push everything back 1 week" (Updates 20-30 rows). |
| **Hallucination Risk** | Low. It's strictly date arithmetic. |
| **Verdict** | **Safe**. Backend logic handles the "Shift" recursion, not the AI. |

### Tool 5: `analyze_insight` (The Analyst)
**Purpose**: RAG-based performance review.

| Metric | Analysis |
| :--- | :--- |
| **Input Context** | High. Fetches `exercise_training_details` (numeric) + `memories` (text). |
| **Query Complexity** | **Aggregations**. "Avg Squat Weight last 4 weeks". |
| **Tables Accessed** | `exercise_training_details`, `memories`, `exercise_personal_bests`. |
| **Cost Warning** | Reading raw `training_details` for 6 months = 10,000 rows. |
| **Optimization** | **Backend Aggregation**. Tool should NOT return raw rows to AI. It returns summaries: `{ "squat_avg": 100, "trend": "+5%" }`. |
| **Verdict** | **Safe with Aggregation**. Unsafe if raw data dump. |

### Tool 6: `log_and_adjust` (The Feedback Loop)
**Purpose**: Athlete logging + Memory formation.

| Metric | Analysis |
| :--- | :--- |
| **Input Parameters** | `session_id`, `completed_exercises[]`, `subjective_feedback`. |
| **Tables Touched** | `exercise_training_details` (Update), `memories` (Insert), `exercise_personal_bests` (Insert if PR). |
| **Hallucination Risk** | Low. Inputs are grounded in the specific session ID. |
| **Verdict** | **Safe**. Critical for the "AI Native" loop. |

---

## 3. Data Safety & Hallucination Prevention Strategy

### 3.1 The "Middleman" Validation Layer
To prevent the AI from "guessing" IDs or Schema, every Write Tool must pass through a strict validation layer:

1.  **ID Verification**: Does `exercise_id: 882` actually exist?
2.  **Ownership Check**: Does `coach_id: 5` own `template_id: 12`? (RLS handles this, but Tool should catch it early for better error messages).
3.  **Schema Enforcement**: Tool inputs are Zod-validated. If the AI sends "reps: 'many'", it fails fast.

### 3.2 Polymorphic Table Routing
Instead of teaching the AI about `exercise_presets` vs `exercise_training_details`, we map them internally:

*   **AI Concept**: "ExerciseSet"
*   **Map -> Template**: `exercise_preset_details`
*   **Map -> Assigned**: `exercise_training_details`

This reduces the "Surface Area" the AI needs to understand by 50%.

### 3.3 Context limits
*   **Max Input**: Never feed raw session logs > 1 week. Summarize anything older.
*   **Max Output**: `curate_exercises` capped at top-5 results. `architect_plan` compressed via Logic Objects.

---

## 4. Estimated Record Counts (Extreme Cases)

| Scenario | Action | Rows Read (AI Input) | Rows Written (DB) | Latency Risk |
| :--- | :--- | :--- | :--- | :--- |
| **Create Macrocycle** | Generate 16-Week Plan | 50 (Knowledge Base) | **~1,200** (Full Expansion) | **High** (Use Method 2 + Async Job) |
| **Bulk Update** | "Change Rest to 60s for all Hypertrophy Days" | 0 (Logic Rule) | **~200** (Updates) | **Medium** (Transactional) |
| **Analyze Year** | "Summarize 2024 Progress" | **~5,000** (Raw) -> **10** (Summary) | 1 (Memory) | **High** (Must use SQL Aggregation) |

## 5. Conclusion
*   **Tool Count**: Stabilized at 6 Capabilities (mapped to ~12 internal functions).
*   **Bloat**: Controlled via Polymorphic Routing.
*   **Safety**: Guaranteed via "Middleman" Validation and Zod Schemas.
*   **Performance**: Large writes (Creation) must be Method 2 (JSON) + Async Expansion. Small edits (Tweaks) use Method 1 (Tools).

