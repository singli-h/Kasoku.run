import { Configuration, OpenAIApi } from "openai-edge"

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(config)

export async function OpenAIRequest(prompt: string, model = "gpt-4", temperature = 0.7, max_tokens = 1000) {
  try {
    const response = await openai.createChatCompletion({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens,
      stream: false,
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("Error in OpenAI request:", error)
    throw new Error("Failed to get response from OpenAI")
  }
}

export async function generateMesocycle(mesocycleData: any) {
  const prompt = `Generate a detailed mesocycle plan based on the following data:
    ${JSON.stringify(mesocycleData, null, 2)}
    Please provide a structured response including weekly plans, exercise details, and progression strategies.`

  return OpenAIRequest(prompt)
}

export async function generateSessionNotes(sessionData: any) {
  const prompt = `Generate detailed notes for this training session:
    ${JSON.stringify(sessionData, null, 2)}
    Include observations on form, suggested adjustments, and tips for improvement.`

  return OpenAIRequest(prompt, "gpt-4", 0.6, 500)
}

export async function suggestExerciseModifications(exerciseData: any, athletePerformance: any) {
  const prompt = `Based on the following exercise data and athlete's recent performance, suggest modifications:
    Exercise: ${JSON.stringify(exerciseData, null, 2)}
    Athlete Performance: ${JSON.stringify(athletePerformance, null, 2)}
    Provide suggestions for adjusting weight, reps, sets, or exercise selection to optimize training.`

  return OpenAIRequest(prompt, "gpt-4", 0.8, 300)
}

