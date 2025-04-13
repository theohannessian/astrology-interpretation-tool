const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

app.post('/api/astrology-interpretation', async (req, res) => {
  try {
    const { userInput, zodiacSign, selectedDate } = req.body;
    
    // Prepare prompt based on whether zodiac sign and date were provided
    let promptContent = `I need an astrological interpretation of this personal experience: "${userInput}".`;
    
    if (zodiacSign) {
      promptContent += `\nThe person's sun sign is ${zodiacSign}.`;
    }
    
    if (selectedDate) {
      promptContent += `\nThis event occurred on ${selectedDate}.`;
    }
    
    promptContent += `\n\nPlease provide a thoughtful, nuanced astrological perspective that:
1. Connects the experience to possible planetary influences
2. Offers an alternative way to view the situation through an astrological lens
3. Suggests how celestial energies might be affecting the dynamics
4. Provides gentle guidance based on astrological wisdom
5. Helps depersonalize the situation by framing it within larger cosmic patterns

Make the response compassionate but also slightly mystical. Include references to specific planets, signs, houses, or aspects that might be relevant.`;

    if (zodiacSign) {
      promptContent += ` Since the person is a ${zodiacSign}, tailor the interpretation to how their sun sign might interact with these planetary energies.`;
    }

    promptContent += `\nKeep the interpretation between 150-200 words.`;
    
    // Call to Claude API
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 800,
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

    res.json({ interpretation: response.data.content[0].text });
  } catch (error) {
    console.error('Error calling Claude API:', error);
    res.status(500).json({ error: 'Failed to generate interpretation' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 