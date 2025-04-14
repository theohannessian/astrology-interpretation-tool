const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app with no-cache headers
app.use(express.static(path.resolve(__dirname, '../build'), {
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// Add debugging to show the build directory path
console.log('Static files directory:', path.resolve(__dirname, '../build'));
console.log('Current directory:', __dirname);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Add environment variable for UserAPI
// You'll need to add this to your .env file
const USERAPI_KEY = process.env.USERAPI_KEY;
const USERAPI_URL = process.env.USERAPI_URL || 'https://api.userapi.ai/api/midjourney/imagine';

console.log('Using UserAPI URL:', USERAPI_URL);
console.log('UserAPI Key exists:', !!USERAPI_KEY);

// Store conversation history in memory (in production, use a database)
const conversations = new Map();

app.post('/api/astrology-interpretation', async (req, res) => {
  try {
    const { userInput, zodiacSign, selectedDate, location, birthDate, birthTime, conversationId, followUpQuestion } = req.body;
    
    // Initialize or get conversation history
    let messages = [];
    if (conversationId && conversations.has(conversationId)) {
      messages = conversations.get(conversationId);
    } else if (!conversationId) {
      // New conversation
      const newConversationId = Date.now().toString();
      conversations.set(newConversationId, messages);
      res.setHeader('X-Conversation-Id', newConversationId);
    }

    // Prepare prompt based on whether it's a follow-up or new question
    let promptContent;
    if (followUpQuestion) {
      promptContent = `Follow-up question: "${followUpQuestion}"\n\nPlease provide additional insights about this in a friendly, relatable way.`;
    } else {
      promptContent = `I need an astrological interpretation of this personal experience: "${userInput}".`;
      
      if (birthDate && birthTime) {
        promptContent += `\nThe person was born on ${birthDate} at ${birthTime}.`;
      }
      
      if (zodiacSign) {
        promptContent += `\nThe person's sun sign is ${zodiacSign}.`;
      }
      
      if (selectedDate) {
        promptContent += `\nThis event occurred on ${selectedDate}.`;
      }
      
      if (location) {
        promptContent += `\nThe person's location is ${location}.`;
      }

      promptContent += `\n\nPlease provide a thoughtful interpretation that balances astrological concepts with practical insights. Your response should:

1. Start with a bold title/headline that summarizes the essence of the reading (format it with ** or <strong> tags)
2. Provide a balanced perspective that includes:
   - 1-2 key astrological influences relevant to their situation (planets, transits, etc.)
   - What these influences might mean in practical, relatable terms
   - How this connects to their specific question or situation
3. Translate any astrological jargon into understandable concepts
4. Offer practical perspectives or approaches they might consider
5. End with a brief, encouraging takeaway that feels personalized

Format your response with:
- A bold title at the beginning (use ** or <strong> tags)
- Clear, conversational language that doesn't overwhelm with mystical terminology
- Short paragraphs for readability
- Use bold or italics sparingly to highlight key concepts

Keep the tone warm and conversational, like a knowledgeable friend explaining something - not overly mystical or academic. Be concise but insightful, focusing on quality over quantity.`;

      if (zodiacSign) {
        promptContent += ` Since the person is a ${zodiacSign}, highlight how their sun sign's qualities might influence their experience of this situation.`;
      }
      
      if (location) {
        promptContent += ` You can briefly mention how ${location}'s environment or energy might affect their experience.`;
      }
      
      if (birthDate && birthTime) {
        promptContent += ` Based on their birth information, you can include 1-2 insights about how their natal placement might relate to their current situation.`;
      }

      promptContent += `\nKeep the interpretation between 150-200 words. Balance astrological insight with practical, relatable language.`;
    }

    // Add the new message to the conversation history
    messages.push({
      role: "user",
      content: promptContent
    });
    
    console.log(`Calling Claude API with prompt: ${promptContent.substring(0, 100)}...`);
    
    // Call to Claude API
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 800,
        messages: messages
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Get the Claude interpretation
    const interpretation = response.data.content[0].text;
    console.log(`Received interpretation: ${interpretation.substring(0, 100)}...`);
    
    // Add Claude's response to the conversation history
    messages.push({
      role: "assistant",
      content: interpretation
    });
    
    // Generate an image prompt based on the interpretation
    let imagePrompt = null;
    try {
      const promptGenerationResponse = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: "claude-3-7-sonnet-20250219",
          max_tokens: 400,
          messages: [
            {
              role: "user",
              content: `Create an artistic prompt for Midjourney to generate an image that visually represents this astrological interpretation. The prompt should be highly detailed, evocative, and use visual language that will result in a mystical, cosmic image.

Here's the astrological interpretation to visualize:
"${interpretation}"

${zodiacSign ? `The person's zodiac sign is: ${zodiacSign}` : ''}
${userInput ? `The original query was: "${userInput}"` : ''}

Create a Midjourney prompt that:
1. Incorporates cosmic, astrological, and mystical imagery
2. Uses rich, descriptive language focusing on colors, light, composition
3. Includes relevant astrological symbols and zodiac representations
4. Creates an emotional atmosphere matching the interpretation
5. Avoids including text in the image
6. Aims for a beautiful, spiritual, and meaningful visualization

The prompt should be 3-4 sentences with specific visual details. Format it as "prompt: [your prompt here]"`
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      // Extract the prompt from Claude's response
      const claudeResponse = promptGenerationResponse.data.content[0].text;
      imagePrompt = claudeResponse;
      
      // Extract just the prompt if Claude included the "prompt:" format
      const promptMatch = claudeResponse.match(/prompt:\s*(.+)/is);
      if (promptMatch && promptMatch[1]) {
        imagePrompt = promptMatch[1].trim();
      }
    } catch (promptError) {
      console.error('Error generating image prompt:', promptError);
      // Continue without image prompt if there's an error
    }
    
    // Automatically generate suggested follow-up questions that are similarly approachable
    try {
      const questionPrompt = `Based on this astrological interpretation, generate 3 follow-up questions that would help deepen the conversation in an accessible, practical way. 

The interpretation:
${interpretation}

Create questions that:
1. Use simple, friendly language that anyone could understand
2. Bridge astrological concepts with practical life applications
3. Encourage self-reflection without being overly mystical
4. Help the user explore the topic in more depth
5. Feel natural and conversational, like what a curious friend might ask

Format each question on a new line prefixed with "Q: ". Make the questions concise and focused.`;

      const questionsResponse = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: "claude-3-7-sonnet-20250219",
          max_tokens: 250,
          messages: [
            {
              role: "user",
              content: questionPrompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      // Process the response to extract questions
      const rawQuestions = questionsResponse.data.content[0].text;
      
      // Parse out the questions (assuming format "Q: question text")
      const suggestedQuestions = rawQuestions
        .split('\n')
        .filter(line => line.trim().startsWith('Q:'))
        .map(line => line.replace('Q:', '').trim());
      
      // Return both the interpretation, image prompt, and suggested questions
      res.json({ 
        interpretation, 
        conversationId: conversationId || Array.from(conversations.keys()).pop(),
        suggestedQuestions: suggestedQuestions ? suggestedQuestions.slice(0, 3) : [], // Limit to 3 questions
        imagePrompt: imagePrompt
      });
      
    } catch (questionError) {
      console.error('Error generating suggested questions:', questionError);
      // Still return the interpretation even if questions fail
      res.json({ 
        interpretation, 
        conversationId: conversationId || Array.from(conversations.keys()).pop(),
        imagePrompt: imagePrompt
      });
    }
    
  } catch (error) {
    console.error('Error generating interpretation:', error);
    res.status(500).json({ error: 'Failed to generate interpretation' });
  }
});

// Add this after existing API endpoint for astrology-interpretation
app.post('/api/suggested-questions', async (req, res) => {
  try {
    const { interpretation, conversationHistory } = req.body;
    
    // Construct a prompt to generate relevant follow-up questions
    let promptContent = `As an astrological expert, analyze this interpretation and generate 3 specific follow-up questions that would help deepen the analysis. Format each question on a new line prefixed with "Q: ".

The interpretation:
${interpretation}

Consider the following when crafting questions:
1. Focus on areas that need more detail or clarity
2. Explore specific astrological concepts mentioned that could be expanded
3. Connect to broader life themes or patterns
4. Ask about timing of events or specific transits
5. Inquire about emotional or spiritual dimensions

Generate 3 precise, focused questions:`;
    
    if (conversationHistory && conversationHistory.length > 0) {
      // Add context from previous conversation if available
      promptContent += `\n\nNote that the following conversation has already occurred, so avoid repeating these topics:\n`;
      conversationHistory.forEach(message => {
        promptContent += `${message.role.toUpperCase()}: ${message.content}\n`;
      });
    }
    
    // Call to Claude API
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 250,
        messages: [
          {
            role: "user",
            content: promptContent
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Process the response to extract questions
    const rawQuestions = response.data.content[0].text;
    
    // Parse out the questions (assuming format "Q: question text")
    const questions = rawQuestions
      .split('\n')
      .filter(line => line.trim().startsWith('Q:'))
      .map(line => line.replace('Q:', '').trim());
    
    res.json({ suggestedQuestions: questions });
    
  } catch (error) {
    console.error('Error generating suggested questions:', error);
    res.status(500).json({ error: 'Failed to generate suggested questions' });
  }
});

// Function to generate placeholder images when UserAPI fails
function getPlaceholderImage() {
  const placeholderImages = [
    'https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?q=80&w=1024&h=1024&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1024&h=1024&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1475727946784-2890c8fdb9c8?q=80&w=1024&h=1024&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1624726175512-19b9baf9fbd1?q=80&w=1024&h=1024&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1492037766660-2a56f9eb3fcb?q=80&w=1024&h=1024&auto=format&fit=crop'
  ];
  
  const randomIndex = Math.floor(Math.random() * placeholderImages.length);
  return placeholderImages[randomIndex];
}

// Add a new endpoint to generate image prompts from interpretations
app.post('/api/generate-image-prompt', async (req, res) => {
  try {
    const { interpretation, zodiacSign, userInput } = req.body;
    
    if (!interpretation) {
      return res.status(400).json({ error: 'Interpretation is required' });
    }

    // Generate a prompt for image generation using Claude
    const promptGenerationResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `Create an artistic prompt to generate an image that visually represents this astrological interpretation. The prompt should be highly detailed, evocative, and use visual language that will result in a mystical, cosmic image.

Here's the astrological interpretation to visualize:
"${interpretation}"

${zodiacSign ? `The person's zodiac sign is: ${zodiacSign}` : ''}
${userInput ? `The original query was: "${userInput}"` : ''}

Create a prompt that:
1. Incorporates cosmic, astrological, and mystical imagery
2. Uses rich, descriptive language focusing on colors, light, composition
3. Includes relevant astrological symbols and zodiac representations
4. Creates an emotional atmosphere matching the interpretation
5. Avoids including text in the image
6. Aims for a beautiful, spiritual, and meaningful visualization

The prompt should be 3-4 sentences with specific visual details. Format it as "prompt: [your prompt here]"`
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Extract the prompt from Claude's response
    const claudeResponse = promptGenerationResponse.data.content[0].text;
    let imagePrompt = claudeResponse;
    
    // Extract just the prompt if Claude included the "prompt:" format
    const promptMatch = claudeResponse.match(/prompt:\s*(.+)/is);
    if (promptMatch && promptMatch[1]) {
      imagePrompt = promptMatch[1].trim();
    }
    
    // Return the generated prompt
    res.json({ 
      imagePrompt
    });
    
  } catch (error) {
    console.error('Error generating image prompt:', error);
    res.status(500).json({ error: 'Failed to generate image prompt' });
  }
});

// Add a new endpoint to use UserAPI to generate images based on prompts
app.post('/api/generate-image', async (req, res) => {
  try {
    const { imagePrompt } = req.body;
    
    if (!imagePrompt) {
      return res.status(400).json({ error: 'Image prompt is required' });
    }
    
    if (!USERAPI_KEY) {
      return res.status(500).json({ 
        error: 'UserAPI key not configured',
        imageUrl: getPlaceholderImage(),
        imagePrompt
      });
    }
    
    // Since the UserAPI account is not activated yet, return a placeholder image with the prompt
    console.log('UserAPI account not yet activated - using placeholder image');
    console.log('Image prompt:', imagePrompt.substring(0, 100) + '...');
    
    return res.json({
      success: true,
      note: "Your UserAPI account is not yet activated. Using a placeholder cosmic image.",
      imageUrl: getPlaceholderImage(),
      imagePrompt
    });
    
    /* 
    // Use this code once your UserAPI account is activated:
    
    console.log(`Calling UserAPI with prompt: ${imagePrompt.substring(0, 100)}...`);
    
    try {
      // Explicitly create headers object
      const headers = {
        'x-api-key': USERAPI_KEY,
        'Content-Type': 'application/json'
      };
      
      // Create request data
      const data = {
        prompt: imagePrompt,
        fast: true,
        aspectRatio: "1:1", 
        quality: "standard"
      };
      
      // Make direct axios call
      const response = await axios({
        method: 'post',
        url: USERAPI_URL,
        headers: headers,
        data: data,
        timeout: 60000
      });
      
      // Check for different possible response formats
      let imageUrl = null;
      
      if (response.data.imageUrl) {
        imageUrl = response.data.imageUrl;
      } else if (response.data.result?.imageUrl) {
        imageUrl = response.data.result.imageUrl;
      } else if (response.data.images && response.data.images.length > 0) {
        imageUrl = response.data.images[0];
      } else if (response.data.image) {
        imageUrl = response.data.image;
      } else if (response.data.url) {
        imageUrl = response.data.url;
      }
      
      if (imageUrl) {
        return res.json({
          success: true,
          imageUrl,
          imagePrompt
        });
      }
      
      // If no image URL found, return placeholder
      return res.json({
        success: false,
        error: 'Could not find image URL in response',
        imageUrl: getPlaceholderImage(),
        imagePrompt
      });
      
    } catch (apiError) {
      // Return placeholder image with error details
      return res.json({
        success: false,
        error: apiError.message,
        imageUrl: getPlaceholderImage(),
        imagePrompt
      });
    }
    */
  } catch (error) {
    console.error('Unexpected error in generate-image endpoint:', error);
    return res.status(500).json({ 
      error: 'Server error processing image generation',
      imageUrl: getPlaceholderImage(),
      imagePrompt: req.body?.imagePrompt
    });
  }
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  console.log('Serving index.html from:', path.resolve(__dirname, '../build/index.html'));
  res.sendFile(path.resolve(__dirname, '../build/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 