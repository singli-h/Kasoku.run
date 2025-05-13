// apps/web/src/app/api/ai/exercise-details/schema.ts
// JSON Schema for AI exercise details v1, combining narrative feedback with structured session_details
export const ExerciseDetailsSchemaV1 = {
  type: 'object',
  properties: {
    feedback: {
      type: 'string',
      description: 'Narrative guidance for the user'
    },
    session_details: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sessionId: { type: 'integer' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                presetId: { type: 'integer' },
                sets: { type: 'integer' },
                reps: { type: 'integer' },
                effort_pct: { type: 'number' },
                rpe: { type: 'number' },
                velocity: { type: 'number' },
                power: { type: 'number' },
                distance: { type: 'number' },
                height: { type: 'number' },
                duration: { type: 'number' },
                tempo: { type: 'string' },
                explanation: { type: 'string' }
              },
              required: ['presetId','explanation']
            }
          }
        },
        required: ['sessionId','details']
      }
    }
  },
  required: ['feedback','session_details']
} as const; 