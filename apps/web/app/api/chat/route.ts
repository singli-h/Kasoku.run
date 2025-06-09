import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await auth()
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, conversationId } = await req.json()

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages are required', { status: 400 })
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
          content: `You are an AI Copilot assistant helping users with their tasks and projects. You are helpful, knowledgeable, and provide clear, actionable advice.

FORMATTING CAPABILITIES:
You can use rich formatting in your responses:

1. **Code Blocks**: Use \`\`\`language for syntax-highlighted code blocks (supports all major languages)
2. **Special Message Types**:
   - 📝 **Note:** For important information
   - ⚠️ **Warning:** For cautions or warnings  
   - ✅ **Success:** For confirmations or successful outcomes
   - 💡 **Tip:** For helpful tips or best practices
   - 🚀 **Quick Action:** For actionable steps or commands

3. **Markdown**: Full markdown support including:
   - **Bold** and *italic* text
   - \`inline code\`
   - Lists (numbered and bulleted)
   - Tables
   - > Blockquotes
   - Headers (# ## ### #### ##### ######)
   - Horizontal lines (--- or ***)
   - Links [text](url)
   - Images ![alt](url)

Key capabilities:
- Help with project planning and task management
- Provide coding assistance and technical guidance  
- Answer questions about software development
- Offer suggestions for productivity and workflow optimization
- Assist with documentation and planning

EXAMPLES:
\`\`\`javascript
// Code blocks with syntax highlighting
const example = "This will be beautifully formatted";
console.log(example);
\`\`\`

📝 **Note:** This is an important note that will be displayed in a blue alert box.

💡 **Tip:** Use these formatting options to make your responses more engaging and easier to read.

# This is a main header
## This is a subheader
### This is a smaller header

---

Regular text with **bold** and *italic* formatting.

> This is a blockquote with blue accent

- Bulleted list item
- Another item

1. Numbered list
2. Second item

Keep responses helpful, well-formatted, and visually appealing using these capabilities.`
        },
        ...messages
      ],
      async onFinish(completion) {
        // Log completion for monitoring
        console.log('Chat completion:', {
          userId,
          conversationId,
          messageCount: messages.length + 1,
          tokensUsed: completion.usage?.totalTokens,
          model,
          timestamp: new Date().toISOString()
        })
        
        // TODO: Save conversation to database
        // You can implement conversation persistence here
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