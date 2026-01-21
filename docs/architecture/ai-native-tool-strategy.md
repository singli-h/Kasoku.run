# AI-Native Training System: User Stories & Tool Architecture
## 1. User Stories & Expectations

### 1.1 Coach Personas (The Architect)

| ID | User Story | Expectation | Required Tool | Scope/Permission |
| :--- | :--- | :--- | :--- | :--- |
| **C1** | "Create a 12-week marathon prep cycle for my Elite Group based on Jack Daniels' formula." | Expects a full 12-week structure populated with placeholders or generic runs. | `generate_plan_structure` | `template:write` |
| **C2** | "Find me 3 plyometric exercises for sprinters that are low impact." | Expects specialized search results based on biomechanics, not just keywords. | `knowledge_base_search` | `global:read` |
| **C3** | "Swap all 'Back Squats' with 'Safety Bar Squats' in the Hypertrophy Block because the gym equipment changed." | Expects a batch update across multiple weeks instantly. | `batch_update_exercises` | `template:write` |
| **C4** | "Assign the 'Winter Base' plan to Sarah, but scale the volume down by 20%." | Expects cloning the plan AND intelligent parameter adjustment in one go. | `assign_and_schedule` | `athlete:write` |
| **C5** | "Why is John's performance dropping in Week 4?" | Expects analysis of `exercise_training_details` vs `memories` (subjective feedback). | `analyze_performance` | `athlete:read` |
| **C6** | "Save this modified session as a reusable 'Speed Template'." | Expects capturing a specific instance back into the template library. | `save_as_template` | `template:write` |

### 1.2 Athlete Personas (The Executor)

| ID | User Story | Expectation | Required Tool | Scope/Permission |
| :--- | :--- | :--- | :--- | :--- |
| **A1** | "I can't do today's session, move it to Saturday." | Expects calendar rescheduling without breaking the sequence. | `reschedule_session` | `own_session:write` |
| **A2** | "My knee hurts during squats, give me an alternative." | Expects a safe regression based on `knowledge_base` injury protocols. | `recommend_regression` | `own_session:write` |
| **A3** | "Log my 5x5 squats. I did 100kg but the last set was RPE 9." | Expects data entry + RPE logging + potential future load adjustment. | `log_workout_result` | `own_session:write` |
| **A4** | "How does this compare to my last month's average?" | Expects immediate comparative analytics. | `analyze_performance` | `own_data:read` |

---

## 2. Updated Tool Architecture (Refined for Scale & Permissions)

To handle the "AI Native" requirements (RAG, Embeddings, Context) while keeping strict permissions, we refine the 4-tool model into **6 High-Level Capabilities**.

### Tool 1: `architect_plan` (Creation Engine)
*   **Method**: JSON Generation (Method 2)
*   **Capabilities**:
    *   Generates Macro/Meso/Micro structures.
    *   **AI Integration**: Queries `knowledge_base` first to inject "Jack Daniels Formula" logic before generating JSON.
*   **Permissions**: `Coach` only.

### Tool 2: `curate_exercises` (The Librarian)
*   **Method**: Tool (Method 1)
*   **Capabilities**:
    *   Uses `vector_search` on `exercises.embedding`.
    *   Filters by `injury` constraints from `memories`.
*   **Input**: `{ query: "explosive leg drive", context: "knee_injury_safe" }`
*   **Permissions**: `Coach` (Full Library), `Athlete` (Assigned + Alternatives only).

### Tool 3: `modify_structure` (The Editor)
*   **Method**: Tool (Method 1)
*   **Capabilities**:
    *   Add/Remove Sessions or Exercises.
    *   Handles "Polymorphic" switching (`template` vs `assigned`).
*   **Permissions**:
    *   `Coach`: Can edit any `template` or `assigned` plan they own.
    *   `Athlete`: Can ONLY edit `assigned` sessions if `coach_permission_level > strict`.

### Tool 4: `manage_schedule` (The Logistics)
*   **Method**: Tool (Method 1)
*   **Capabilities**:
    *   Move days, handle "Shift everything right", Handle skipped days.
    *   **AI Integration**: Checks `athlete_cycles` to ensure rescheduling doesn't violate recovery rules found in `knowledge_base`.
*   **Permissions**: `Coach` (Any), `Athlete` (Own Calendar).

### Tool 5: `analyze_insight` (The Analyst)
*   **Method**: Tool (Method 1)
*   **Capabilities**:
    *   Reads `exercise_training_details` + `memories`.
    *   Uses RAG to compare "Planned" vs "Actual".
*   **Permissions**: `Coach` (Group/Athlete Data), `Athlete` (Own Data).

### Tool 6: `log_and_adjust` (The Feedback Loop)
*   **Method**: Tool (Method 1)
*   **Capabilities**:
    *   Logs completed sets.
    *   **AI Feature**: Auto-updates `memories` table with "Session Summary" embeddings for future context.
*   **Permissions**: `Athlete` only.

---

## 3. The "AI Native" Data Flow

To be truly AI Native, every action feeds the "Brain" (Vector Store).

```mermaid
graph TD
    User_Action[User Logs Workout] --> DB_Write[Write to SQL DB]
    DB_Write --> AI_Process[AI Summarizer Agent]
    
    subgraph "The AI Loop"
        AI_Process --> |Read| KB[Knowledge Base]
        AI_Process --> |Write| Memory[Memories Table (Vector)]
    end
    
    Memory --> |Context Injection| Next_Plan_Gen[Next Plan Generation]
```

**Key Differentiator**:
When `architect_plan` runs next month, it doesn't just use a template. It pulls:
1.  **Hard Data**: "Athlete failed 90% lifts."
2.  **Vector Data**: "Athlete reported knee pain on high volume." (From `log_and_adjust`)
3.  **Knowledge Base**: "Knee pain protocol = reduce volume by 30%."

This closed loop is what makes it "AI Native" rather than just "Digital Forms."

