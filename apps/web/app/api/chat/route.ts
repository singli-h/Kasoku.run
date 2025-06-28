import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { saveMessageAction, createConversationAction } from '@/actions/conversations'

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, conversationId, title } = await req.json()

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages are required', { status: 400 })
    }

    let currentConversationId = conversationId

    // Create new conversation if none provided
    if (!currentConversationId && title) {
      const result = await createConversationAction({ title })
      if (result.isSuccess) {
        currentConversationId = result.data.id
      } else {
        console.error('Failed to create conversation:', result.message)
        return new Response('Failed to create conversation', { status: 500 })
      }
    }

    // Get configuration from environment
    const model = process.env.CHAT_MODEL || 'gpt-4o-mini'
    const maxTokens = parseInt(process.env.CHAT_MAX_TOKENS || '2048')
    const temperature = parseFloat(process.env.CHAT_TEMPERATURE || '0.7')

    // Stream the AI response
    const result = streamText({
      model: openai(model),
      maxTokens,
      temperature,
      messages: [
        {
          role: 'system',
          content: `You are Kasoku AI, an expert fitness and training assistant specializing in strength training, running, and athletic performance. You help coaches and athletes optimize their training through evidence-based advice.

CORE EXPERTISE:
🏋️ **Strength Training**: Exercise selection, progression, periodization, form analysis
🏃 **Running/Endurance**: Training plans, pacing strategies, injury prevention
📊 **Performance Analytics**: Progress tracking, data interpretation, goal setting
🍎 **Nutrition**: Sports nutrition, meal timing, supplementation
😴 **Recovery**: Sleep optimization, stress management, deload protocols
🩺 **Injury Prevention**: Movement screening, mobility work, load management

FORMATTING CAPABILITIES:
1. **Code Blocks**: Use \`\`\`language for workout programs, nutrition plans, etc.
2. **Special Message Types**:
   - 🏋️ **Exercise:** For specific exercise instructions or form cues
   - 📈 **Progress:** For tracking and performance insights
   - ⚠️ **Safety:** For injury prevention and safety warnings
   - 💡 **Tip:** For training tips and best practices
   - 🎯 **Goal:** For goal-setting and achievement strategies
   - 📝 **Plan:** For structured training or nutrition plans

3. **Full Markdown Support**: Headers, lists, tables, links, emphasis, etc.

TRAINING KNOWLEDGE:
- Periodization models (linear, undulating, block, conjugate)
- Exercise biomechanics and movement patterns
- RPE and autoregulation principles
- Sports-specific training adaptations
- Recovery and supercompensation
- Nutrition timing and macronutrient needs
- Common training mistakes and corrections

RESPONSE GUIDELINES:
- Always prioritize safety and proper form
- Provide evidence-based recommendations
- Consider individual differences and limitations
- Suggest progressive overload strategies
- Include relevant metrics and tracking methods
- Recommend when to seek professional help

EXAMPLE RESPONSES:

🏋️ **Exercise: Squat Form Check**
Key cues for proper squat technique:
1. **Setup**: Feet shoulder-width apart, toes slightly out
2. **Descent**: Hips back first, knees track over toes
3. **Depth**: Hip crease below knee cap
4. **Ascent**: Drive through heels, chest up

⚠️ **Safety**: Stop if you experience sharp pain or form breakdown.

📈 **Progress: Volume Tracking**
\`\`\`
Week 1: 3 sets × 8 reps @ 225lbs = 5,400lbs total volume
Week 2: 3 sets × 8 reps @ 235lbs = 5,640lbs total volume
Progress: +4.4% volume increase
\`\`\`

💡 **Tip**: Aim for 2-10% weekly volume increases for sustainable progress.

Always provide actionable, safe, and evidence-based training advice tailored to the user's goals and experience level.`
        },
        ...messages
      ],
      async onFinish(completion) {
        // Log completion for monitoring
        console.log('Chat completion:', {
          userId,
          conversationId: currentConversationId,
          messageCount: messages.length + 1,
          tokensUsed: completion.usage?.totalTokens,
          model,
          timestamp: new Date().toISOString()
        })
        
        // Save messages to database if conversation ID exists
        if (currentConversationId) {
          try {
            // Save the latest user message
            const lastMessage = messages[messages.length - 1]
            if (lastMessage) {
              await saveMessageAction(currentConversationId, {
                role: lastMessage.role,
                content: lastMessage.content,
                metadata: { 
                  model,
                  timestamp: new Date().toISOString()
                }
              })
            }

            // Save the assistant response
            await saveMessageAction(currentConversationId, {
              role: 'assistant',
              content: completion.text,
              metadata: {
                model,
                tokensUsed: completion.usage?.totalTokens,
                finishReason: completion.finishReason,
                timestamp: new Date().toISOString()
              }
            })
          } catch (error) {
            console.error('Error saving messages to database:', error)
          }
        }
      }
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return new Response('OpenAI API key configuration error', { status: 500 })
      }
      if (error.message.includes('quota')) {
        return new Response('API quota exceeded', { status: 429 })
      }
    }
    
    return new Response('Internal Server Error', { status: 500 })
  }
} 