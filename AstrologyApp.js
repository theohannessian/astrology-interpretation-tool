const { useState } = React;

const AstrologyApp = () => {
  const [userInput, setUserInput] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [zodiacSign, setZodiacSign] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const getAstrologyInterpretation = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      // For the prototype, we'll still use the mock response
      // But in production, this would be uncommented:
      /*
      const response = await fetch('http://localhost:3001/api/astrology-interpretation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput, zodiacSign, selectedDate }),
      });
      
      const data = await response.json();
      setInterpretation(data.interpretation);
      */
      
      // Using mock for prototype demo
      setTimeout(() => {
        const mockResponse = generateMockResponse(userInput, zodiacSign, selectedDate);
        setInterpretation(mockResponse);
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error fetching interpretation:', error);
      setInterpretation('Sorry, there was an error connecting to the cosmic energies. Please try again.');
      setLoading(false);
    }
  };
  
  const generateMockResponse = (input, sign, date) => {
    const planets = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Neptune", "Uranus", "Pluto"];
    const aspects = ["in retrograde", "squaring", "opposing", "conjunct with", "trine to"];
    
    const lowerInput = input.toLowerCase();
    let mainTheme = "general";
    let mainPlanet = "";
    let mainEffect = "";
    
    if (lowerInput.includes("boss") || lowerInput.includes("work") || lowerInput.includes("job") || lowerInput.includes("career")) {
      mainTheme = "career";
      mainPlanet = "Saturn";
      mainEffect = "Saturn, the taskmaster of the zodiac, is currently challenging your professional boundaries";
    } else if (lowerInput.includes("partner") || lowerInput.includes("relationship") || lowerInput.includes("love") || lowerInput.includes("date")) {
      mainTheme = "relationship";
      mainPlanet = "Venus";
      mainEffect = "Venus, the planet of relationships, is creating tension in your romantic sphere";
    } else if (lowerInput.includes("friend") || lowerInput.includes("social") || lowerInput.includes("group")) {
      mainTheme = "social";
      mainPlanet = "Jupiter";
      mainEffect = "Jupiter, the planet of expansion, is affecting your social connections";
    } else if (lowerInput.includes("family") || lowerInput.includes("home") || lowerInput.includes("parent") || lowerInput.includes("child")) {
      mainTheme = "family";
      mainPlanet = "Moon";
      mainEffect = "The Moon, ruler of home and family, is highlighting emotional patterns in your domestic life";
    } else if (lowerInput.includes("money") || lowerInput.includes("finance") || lowerInput.includes("spend") || lowerInput.includes("save")) {
      mainTheme = "finance";
      mainPlanet = "Venus";
      mainEffect = "Venus, which also governs finances, is creating fluctuations in your material resources";
    } else if (lowerInput.includes("communicate") || lowerInput.includes("misunderstand") || lowerInput.includes("conversation")) {
      mainTheme = "communication";
      mainPlanet = "Mercury";
      mainEffect = "Mercury, the messenger planet, is causing communication misalignments";
    } else {
      mainPlanet = planets[Math.floor(Math.random() * planets.length)];
      mainEffect = `${mainPlanet} is currently influencing your personal energy field`;
    }
    
    let secondaryPlanet;
    do {
      secondaryPlanet = planets[Math.floor(Math.random() * planets.length)];
    } while (secondaryPlanet === mainPlanet);
    
    const randomAspect = aspects[Math.floor(Math.random() * aspects.length)];
    
    let response = `Astrological Interpretation:\n\n`;
    
    if (date) {
      response += `Celestial analysis for events occurring on ${date}:\n\n`;
    }
    
    if (sign) {
      response += `As a ${sign}, the challenges you're experiencing appear to be influenced by ${mainEffect}. This is further complicated by ${secondaryPlanet} ${randomAspect} your natal ${sign} energies, creating a cosmic tension that manifests in your day-to-day reality.\n\n`;
    } else {
      response += `The challenges you're experiencing appear to be influenced by ${mainEffect}. This is further complicated by ${secondaryPlanet} ${randomAspect} your natal chart, creating a cosmic tension that manifests in your day-to-day reality.\n\n`;
    }
    
    if (mainTheme === "career") {
      response += `This Saturn transit suggests examining authority dynamics and your relationship with structure. The stars indicate this is a period of professional testing that will ultimately strengthen your resilience and leadership. Consider whether you're being asked to establish firmer boundaries or demonstrate your capabilities in new ways.\n\n`;
    } else if (mainTheme === "relationship") {
      response += `This Venus transit is revealing deeper patterns in how you connect with others. The celestial alignment suggests this is a moment to reflect on balance and reciprocity. What old relationship patterns might be resurfacing for healing? The stars suggest patience as this alignment shifts.\n\n`;
    } else if (mainTheme === "social") {
      response += `Jupiter's influence on your social sphere is expanding your awareness of group dynamics. This transit suggests examining where you belong and where you might need more independence. The current alignment offers growth through community challenges.\n\n`;
    } else if (mainTheme === "family") {
      response += `The lunar energies affecting your home life are bringing subconscious patterns to light. This is a cosmic invitation to address emotional foundations and ancestral patterns. The stars suggest this is temporary but offers profound healing potential.\n\n`;
    } else if (mainTheme === "finance") {
      response += `Venus's transit through your financial sector suggests reassessing your relationship with resources. This temporary alignment asks you to distinguish between wants and needs. The stars indicate potential for growth through financial mindfulness.\n\n`;
    } else if (mainTheme === "communication") {
      response += `Mercury's current position suggests a period of communication recalibration. Misunderstandings now contain seeds of deeper clarity. The planetary alignment supports stepping back to observe rather than react, allowing for more conscious communication patterns to emerge.\n\n`;
    } else {
      response += `The current planetary alignment suggests this is a temporary phase of cosmic tension. The stars indicate that this challenge contains hidden wisdom and opportunity for personal evolution. Consider what deeper patterns might be emerging for your awareness and healing.\n\n`;
    }
    
    response += `Remember that while astrological forces may influence situations, your conscious awareness creates space for choice. This cosmic weather will pass, but the wisdom gained remains. Trust the timing of the universe.`;
    
    return response;
  };

  return (
    <div className="flex flex-col items-center p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-purple-800">Astrology Interpretation Tool</h1>
      <p className="mb-6 text-gray-600 text-center">
        Share a challenging life experience, and receive an astrological perspective to help depersonalize the situation.
      </p>
      
      <form onSubmit={getAstrologyInterpretation} className="w-full">
        <div className="mb-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows="4"
            placeholder="Describe your experience (e.g., 'I had a tough day with my boss who criticized my work in front of colleagues.')"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Sun Sign (Optional)
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={zodiacSign}
              onChange={(e) => setZodiacSign(e.target.value)}
            >
              <option value="">Select your sign...</option>
              <option value="Aries">Aries (Mar 21 - Apr 19)</option>
              <option value="Taurus">Taurus (Apr 20 - May 20)</option>
              <option value="Gemini">Gemini (May 21 - Jun 20)</option>
              <option value="Cancer">Cancer (Jun 21 - Jul 22)</option>
              <option value="Leo">Leo (Jul 23 - Aug 22)</option>
              <option value="Virgo">Virgo (Aug 23 - Sep 22)</option>
              <option value="Libra">Libra (Sep 23 - Oct 22)</option>
              <option value="Scorpio">Scorpio (Oct 23 - Nov 21)</option>
              <option value="Sagittarius">Sagittarius (Nov 22 - Dec 21)</option>
              <option value="Capricorn">Capricorn (Dec 22 - Jan 19)</option>
              <option value="Aquarius">Aquarius (Jan 20 - Feb 18)</option>
              <option value="Pisces">Pisces (Feb 19 - Mar 20)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Event (Optional)
            </label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          disabled={loading}
        >
          {loading ? 'Consulting the stars...' : 'Get Astrological Insight'}
        </button>
      </form>
      
      {loading && (
        <div className="mt-6 text-center">
          <div className="animate-pulse text-purple-600">
            ✨ Aligning with celestial energies... ✨
          </div>
        </div>
      )}
      
      {interpretation && !loading && (
        <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100 w-full">
          <h2 className="text-xl font-semibold mb-4 text-purple-800">Celestial Perspective</h2>
          <div className="whitespace-pre-line">{interpretation}</div>
        </div>
      )}
      
      <p className="mt-8 text-sm text-gray-500 text-center">
        Note: This is a prototype. In the full version, interpretations would be generated by Claude 3.7 Sonnet.
      </p>
    </div>
  );
};

ReactDOM.render(<AstrologyApp />, document.getElementById('root')); 