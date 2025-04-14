import React, { useState } from 'react';

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
      const response = await fetch('/api/astrology-interpretation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput, zodiacSign, selectedDate }),
      });
      
      const data = await response.json();
      setInterpretation(data.interpretation);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching interpretation:', error);
      setInterpretation('Sorry, there was an error connecting to the cosmic energies. Please try again.');
      setLoading(false);
    }
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
    </div>
  );
};

export default AstrologyApp; 