import React, { useState, useEffect } from 'react';
import moment from 'moment';
import './App.css';
import { getZodiacSignFromDate, getZodiacEmoji } from './utils/zodiacUtils';

function App() {
  const [userInput, setUserInput] = useState('');
  const [zodiacSign, setZodiacSign] = useState('');
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [location, setLocation] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  
  // Birth information for interpretation context
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [cosmicBrief, setCosmicBrief] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);
  
  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [defaultLocation, setDefaultLocation] = useState('');
  
  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedBasicReading, setHasCompletedBasicReading] = useState(false);
  const [readingAccuracy, setReadingAccuracy] = useState(60); // percentage of accuracy
  
  // Conversation flow state
  const [showConversationalOnboarding, setShowConversationalOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingResponses, setOnboardingResponses] = useState({});
  const [typingMessage, setTypingMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onboardingConversation, setOnboardingConversation] = useState([]);
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('blinkUserSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.birthDate) setBirthDate(settings.birthDate);
      if (settings.birthTime) setBirthTime(settings.birthTime);
      if (settings.zodiacSign) setZodiacSign(settings.zodiacSign);
      if (settings.location) {
        setDefaultLocation(settings.location);
        setLocation(settings.location);
      }
      
      // Calculate reading accuracy based on available information
      calculateReadingAccuracy(settings);
    } else {
      // No saved settings, show conversational onboarding for new users
      setShowConversationalOnboarding(true);
      startOnboardingConversation();
    }
  }, []);

  // Calculate reading accuracy based on available information
  const calculateReadingAccuracy = (settings) => {
    let accuracy = 60; // Base accuracy
    
    if (settings.zodiacSign) accuracy += 10;
    if (settings.birthDate) accuracy += 10;
    if (settings.birthTime) accuracy += 15;
    if (settings.location) accuracy += 5;
    
    setReadingAccuracy(Math.min(accuracy, 100));
  };

  // Add a new useEffect to update zodiac sign when birth date changes
  useEffect(() => {
    if (birthDate) {
      const calculatedSign = getZodiacSignFromDate(birthDate);
      setZodiacSign(calculatedSign);
      
      // Update accuracy when birth date is added
      const newAccuracy = readingAccuracy + (readingAccuracy < 70 ? 10 : 0);
      setReadingAccuracy(Math.min(newAccuracy, 100));
    }
  }, [birthDate]);

  // Generate interpretation context when birth date and time are provided
  useEffect(() => {
    const generateCosmicBrief = async () => {
      if (birthDate && birthTime) {
        setBriefLoading(true);
        
        try {
          // Simple placeholder algorithm - in production this would call an API
          const celestialBodies = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
          const cosmicStates = ["retrograde", "direct motion", "stationary", "approaching conjunction", "in opposition"];
          const influences = ["heightened intuition", "analytical thinking", "creative expression", "spiritual growth", "technological aptitude", "emotional sensitivity"];
          
          // Create pseudo-random but consistent assignments based on birth details
          const dateValue = new Date(birthDate).getTime();
          const timeMinutes = parseInt(birthTime.split(':')[0]) * 60 + parseInt(birthTime.split(':')[1] || 0);
          const seed = dateValue + timeMinutes;
          
          const getSeededRandom = (seed, index) => {
            const x = Math.sin(seed + index) * 10000;
            return x - Math.floor(x);
          };
          
          // Generate personalized brief
          const dominantPlanet = celestialBodies[Math.floor(getSeededRandom(seed, 1) * celestialBodies.length)];
          const secondaryPlanet = celestialBodies[Math.floor(getSeededRandom(seed, 2) * celestialBodies.length)];
          const dominantState = cosmicStates[Math.floor(getSeededRandom(seed, 3) * cosmicStates.length)];
          const currentInfluence = influences[Math.floor(getSeededRandom(seed, 4) * influences.length)];
          
          const brief = `Your natal ${dominantPlanet} is currently in ${dominantState}, amplifying your ${currentInfluence}. ${secondaryPlanet} is crossing your primary astral pathway, creating a unique temporal window for astrological perception.`;
          
          setCosmicBrief(brief);
        } catch (error) {
          console.error('Error generating brief:', error);
          setCosmicBrief('Unable to synchronize with your astrological data. Please re-enter birth coordinates.');
        } finally {
          setBriefLoading(false);
        }
      }
    };
    
    generateCosmicBrief();
  }, [birthDate, birthTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuggestedQuestions([]);
    setImagePrompt('');
    setImageUrl('');

    try {
      const requestBody = conversationId ? 
        { followUpQuestion, conversationId } : 
        { 
          userInput, 
          zodiacSign, 
          selectedDate, 
          location, 
          birthDate, 
          birthTime 
        };

      const response = await fetch('http://localhost:3001/api/astrology-interpretation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      // Set image prompt if available
      if (data.imagePrompt) {
        setImagePrompt(data.imagePrompt);
      }
      
      if (conversationId) {
        // Add the follow-up question and new response to history
        setConversationHistory([
          ...conversationHistory,
          { role: 'user', content: followUpQuestion },
          { role: 'assistant', content: data.interpretation }
        ]);
        setFollowUpQuestion('');
      } else {
        // Initial query
        const initialUserContent = `${userInput}${zodiacSign ? `\nZodiac Sign: ${zodiacSign}` : ''}${selectedDate ? `\nEvent Date: ${selectedDate}` : ''}${location ? `\nLocation: ${location}` : ''}${birthDate ? `\nBirth Date: ${birthDate}` : ''}${birthTime ? `\nBirth Time: ${birthTime}` : ''}`;
        
        setConversationHistory([
          { role: 'user', content: initialUserContent },
          { role: 'assistant', content: data.interpretation }
        ]);
        
        // Reset form fields
        setUserInput('');
        setSelectedDate(moment().format('YYYY-MM-DD'));
        
        // Mark that user has completed a basic reading
        setHasCompletedBasicReading(true);
      }
      
      setInterpretation(data.interpretation);
      setConversationId(data.conversationId);
      
      // Set suggested questions if available
      if (data.suggestedQuestions && data.suggestedQuestions.length > 0) {
        setSuggestedQuestions(data.suggestedQuestions);
      }
      
    } catch (error) {
      console.error('Error:', error);
      setInterpretation('Error: Unable to generate astrological interpretation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setFollowUpQuestion(question);
  };

  const startNewInterpretation = () => {
    setConversationId(null);
    setConversationHistory([]);
    setInterpretation('');
    setFollowUpQuestion('');
    setSuggestedQuestions([]);
  };
  
  const saveSettings = () => {
    // Get the calculated zodiac sign based on birth date
    const calculatedSign = birthDate ? getZodiacSignFromDate(birthDate) : zodiacSign;
    
    const settings = {
      birthDate,
      birthTime,
      zodiacSign: calculatedSign,
      location: defaultLocation
    };
    
    localStorage.setItem('blinkUserSettings', JSON.stringify(settings));
    setShowSettings(false);
    
    // Apply settings to current session
    if (defaultLocation) {
      setLocation(defaultLocation);
    }
    
    // Ensure zodiac sign is set correctly
    setZodiacSign(calculatedSign);
    
    // Recalculate reading accuracy
    calculateReadingAccuracy(settings);
  };

  // Function to generate an image using the image prompt
  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    
    setGeneratingImage(true);
    setImageLoading(true);
    
    try {
      // Call our server endpoint that connects to Midjourney
      const response = await fetch('http://localhost:3001/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imagePrompt
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Image generated successfully');
        setImageUrl(data.imageUrl);
      } else {
        console.error('Error generating image:', data.error);
        // Show error message to user
        alert(`Couldn't generate image: ${data.error}`);
        
        // If we have a fallback URL, use it
        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
        }
      }
    } catch (error) {
      console.error('Error generating image:', error);
      alert('There was a problem connecting to the image generation service. Please try again later.');
    } finally {
      setImageLoading(false);
      setGeneratingImage(false);
    }
  };
  
  // Function to use sample data for quicker onboarding
  const useSampleData = () => {
    // Set sample birth data
    const sampleBirthDate = '1990-04-15';
    const sampleBirthTime = '08:30';
    const sampleLocation = 'New York, NY';
    
    setBirthDate(sampleBirthDate);
    setBirthTime(sampleBirthTime);
    setDefaultLocation(sampleLocation);
    setLocation(sampleLocation);
    
    // Zodiac sign will be automatically set by the useEffect
    
    // Hide onboarding
    setShowOnboarding(false);
    
    // Update reading accuracy
    setReadingAccuracy(95); // Sample data provides high accuracy
    
    // Save to local storage
    const settings = {
      birthDate: sampleBirthDate,
      birthTime: sampleBirthTime,
      zodiacSign: getZodiacSignFromDate(sampleBirthDate),
      location: sampleLocation
    };
    
    localStorage.setItem('blinkUserSettings', JSON.stringify(settings));
  };
  
  // Function to skip onboarding
  const skipOnboarding = () => {
    setShowOnboarding(false);
  };

  const zodiacOptions = [
    { value: '', text: 'SELECT SIGN' },
    { value: 'Aries', text: 'ARIES' },
    { value: 'Taurus', text: 'TAURUS' },
    { value: 'Gemini', text: 'GEMINI' },
    { value: 'Cancer', text: 'CANCER' },
    { value: 'Leo', text: 'LEO' },
    { value: 'Virgo', text: 'VIRGO' },
    { value: 'Libra', text: 'LIBRA' },
    { value: 'Scorpio', text: 'SCORPIO' },
    { value: 'Sagittarius', text: 'SAGITTARIUS' },
    { value: 'Capricorn', text: 'CAPRICORN' },
    { value: 'Aquarius', text: 'AQUARIUS' },
    { value: 'Pisces', text: 'PISCES' }
  ];

  // Example prompts to help users get started
  const examplePrompts = [
    "How will Mercury retrograde affect my career decisions this month?",
    "What does my current astrological profile suggest about my love life?",
    "I'm feeling creatively blocked. What cosmic influences might be affecting me?",
    "Should I make a major financial decision during this lunar phase?",
    "What planetary alignments might explain my recent mood changes?"
  ];

  // Function to simulate typing effect in the conversational onboarding
  const simulateTyping = (message, callback) => {
    setIsTyping(true);
    setTypingMessage('');
    
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < message.length) {
        setTypingMessage(prev => prev + message.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
        if (callback) callback();
      }
    }, 25); // Speed of typing
  };

  // Start the conversational onboarding process
  const startOnboardingConversation = () => {
    const initialMessage = "Hello! I'm BLINK, your cosmic guide to astrological insights. I'd love to get to know you a bit so I can provide personalized readings. Would you like to tell me about yourself, or would you prefer to dive straight into exploring the stars?";
    
    // Add initial message to conversation
    setOnboardingConversation([
      {
        role: 'assistant',
        content: initialMessage
      }
    ]);
    
    // Simulate typing effect
    simulateTyping(initialMessage);
  };
  
  // Handle user responses in the conversational onboarding
  const handleOnboardingResponse = (response) => {
    // Add user response to conversation
    setOnboardingConversation(prev => [
      ...prev,
      {
        role: 'user',
        content: response
      }
    ]);
    
    // Store response
    setOnboardingResponses({
      ...onboardingResponses,
      [onboardingStep]: response
    });
    
    // Process next step after a slight delay
    setTimeout(() => {
      processNextOnboardingStep(response);
    }, 500);
  };
  
  // Process the next step in the conversational onboarding
  const processNextOnboardingStep = (lastResponse) => {
    const nextStep = onboardingStep + 1;
    setOnboardingStep(nextStep);
    
    let nextMessage = '';
    
    // Different conversation paths based on current step and responses
    switch(nextStep) {
      case 1:
        if (lastResponse === "Tell me about yourself") {
          nextMessage = "I'm an AI-powered astrological guide designed to provide personalized cosmic insights. I analyze planetary positions and astrological patterns to help you gain perspective on life's questions. What brings you here today?";
        } else if (lastResponse === "Let's dive in") {
          nextMessage = "Perfect! To provide the most accurate cosmic insights, I'd like to know what kind of questions you're interested in exploring. What area of your life are you seeking guidance on right now?";
        } else {
          nextMessage = "Wonderful! Is there a particular area of your life you'd like cosmic insight on today? Career, relationships, personal growth, or something else?";
        }
        break;
        
      case 2:
        nextMessage = "Thank you for sharing. Would you like to enhance your reading with some astrological context? You can choose to provide your birth details now, use some sample data to see a full experience, or keep it simple for now.";
        break;
        
      case 3:
        if (lastResponse === "Provide my details") {
          nextMessage = "Great! Let's get your birth information to create a more personalized reading. What's your birth date?";
        } else if (lastResponse === "Use sample data") {
          nextMessage = "Perfect! I'll use some sample data to give you the full experience. You're now set up with a birth date of April 15, 1990 at 8:30 AM in New York. Let's explore your cosmic patterns!";
          
          // Set sample data
          const sampleBirthDate = '1990-04-15';
          const sampleBirthTime = '08:30';
          const sampleLocation = 'New York, NY';
          
          setBirthDate(sampleBirthDate);
          setBirthTime(sampleBirthTime);
          setDefaultLocation(sampleLocation);
          setLocation(sampleLocation);
          setZodiacSign(getZodiacSignFromDate(sampleBirthDate));
          setReadingAccuracy(95);
          
          // Save to local storage
          const settings = {
            birthDate: sampleBirthDate,
            birthTime: sampleBirthTime,
            zodiacSign: getZodiacSignFromDate(sampleBirthDate),
            location: sampleLocation
          };
          
          localStorage.setItem('blinkUserSettings', JSON.stringify(settings));
        } else {
          nextMessage = "I understand! Let's keep it simple for now. You can always update your profile later to get more personalized readings. Here are some example questions you might want to explore with BLINK...";
        }
        break;
        
      case 4:
        if (onboardingResponses[3] === "Provide my details") {
          // If they provided a birth date in step 3
          const calculatedSign = getZodiacSignFromDate(lastResponse);
          nextMessage = `Based on your birth date, your sun sign is ${calculatedSign} ${getZodiacEmoji(calculatedSign)}. What time were you born? (If you don't know, a rough estimate is fine)`;
          
          // Set birth date
          setBirthDate(lastResponse);
          setZodiacSign(calculatedSign);
        } else {
          // They've completed the onboarding
          setShowConversationalOnboarding(false);
          return;
        }
        break;
        
      case 5:
        // Set birth time
        setBirthTime(lastResponse);
        nextMessage = "Thank you! Lastly, where were you born? (City, Country)";
        break;
        
      case 6:
        // Set birth location
        setDefaultLocation(lastResponse);
        setLocation(lastResponse);
        
        // Save all collected information
        const settings = {
          birthDate: birthDate,
          birthTime: birthTime,
          zodiacSign: zodiacSign,
          location: lastResponse
        };
        
        localStorage.setItem('blinkUserSettings', JSON.stringify(settings));
        setReadingAccuracy(95);
        
        nextMessage = "Perfect! Your astrological profile is now complete. You'll receive highly personalized readings based on your cosmic blueprint. Let's explore what the stars have to say about your journey...";
        
        // Finish onboarding after a delay
        setTimeout(() => {
          setShowConversationalOnboarding(false);
        }, 5000);
        break;
        
      default:
        setShowConversationalOnboarding(false);
        return;
    }
    
    // Add assistant message to conversation
    setOnboardingConversation(prev => [
      ...prev,
      {
        role: 'assistant',
        content: nextMessage
      }
    ]);
    
    // Simulate typing effect
    simulateTyping(nextMessage);
  };
  
  // Generate response options based on current step
  const getOnboardingResponseOptions = () => {
    switch(onboardingStep) {
      case 0:
        return [
          "Tell me about yourself",
          "Let's dive in"
        ];
      case 1:
        return [
          "Career and purpose",
          "Relationships and love",
          "Personal growth",
          "Current challenges"
        ];
      case 2:
        return [
          "Provide my details",
          "Use sample data",
          "Keep it simple for now"
        ];
      case 3:
        if (onboardingResponses[2] === "Provide my details") {
          return null; // Will use date input instead
        } else {
          return [
            "Show me example questions",
            "I'll ask my own question"
          ];
        }
      case 4:
        if (onboardingResponses[2] === "Provide my details") {
          return null; // Will use time input instead
        }
        break;
      case 5:
        return null; // Will use text input for location
      default:
        return [];
    }
  };

  // Helper function to format message content with proper title styling
  const formatMessageContent = (content) => {
    // If content starts with a # followed by text, format as title
    if (content.match(/^#\s+.+/m)) {
      return content.replace(/^#\s+(.+)$/m, '<h1>$1</h1>');
    }
    
    // If content starts with a bold text (either ** or __), format as title
    if (content.match(/^\*\*.+\*\*/) || content.match(/^__.+__/)) {
      return content.replace(/^(\*\*|__)(.+)(\*\*|__)/, '<div class="reading-title">$2</div>');
    }
    
    return content;
  };

  return (
    <div className="app">
      <header className="header">
        <h1>BLINK</h1>
        <p className="subtitle">ASTROLOGICAL INTERPRETATION SYSTEM</p>
        {!conversationId && !showOnboarding && !showConversationalOnboarding && (
          <button 
            className="settings-button" 
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️ Settings
          </button>
        )}
      </header>
      
      {/* Conversational Onboarding Experience */}
      {showConversationalOnboarding && (
        <div className="conversational-onboarding">
          <div className="conversation-container">
            {onboardingConversation.map((message, index) => (
              <div key={index} className={`onboarding-message ${message.role}-message`}>
                <div className="message-header">
                  <div className="avatar">{message.role === 'user' ? 'Y' : 'B'}</div>
                  <div className="username">{message.role === 'user' ? 'YOU' : 'BLINK'}</div>
                </div>
                <div className="message-content">
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="onboarding-message assistant-message">
                <div className="message-header">
                  <div className="avatar">B</div>
                  <div className="username">BLINK</div>
                </div>
                <div className="message-content">
                  <p>{typingMessage}<span className="typing-indicator">|</span></p>
                </div>
              </div>
            )}
          </div>
          
          {!isTyping && (
            <div className="onboarding-response-options">
              {onboardingStep === 3 && onboardingResponses[2] === "Provide my details" ? (
                <div className="date-input-container">
                  <p className="response-prompt">What's your birth date?</p>
                  <input
                    type="date"
                    className="date-input"
                    onChange={(e) => handleOnboardingResponse(e.target.value)}
                  />
                </div>
              ) : onboardingStep === 4 && onboardingResponses[2] === "Provide my details" ? (
                <div className="time-input-container">
                  <p className="response-prompt">What time were you born?</p>
                  <input
                    type="time"
                    className="time-input"
                    onChange={(e) => handleOnboardingResponse(e.target.value)}
                  />
                </div>
              ) : onboardingStep === 5 ? (
                <div className="text-input-container">
                  <p className="response-prompt">Where were you born?</p>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="City, Country"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleOnboardingResponse(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button 
                    className="submit-button"
                    onClick={(e) => {
                      const input = e.target.previousSibling;
                      handleOnboardingResponse(input.value);
                      input.value = '';
                    }}
                  >
                    Submit
                  </button>
                </div>
              ) : (
                getOnboardingResponseOptions()?.map((option, index) => (
                  <button 
                    key={index} 
                    className="response-option"
                    onClick={() => handleOnboardingResponse(option)}
                  >
                    {option}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Original Onboarding (now only shown if conversational onboarding is skipped) */}
      {showOnboarding && !showConversationalOnboarding && (
        <div className="panel onboarding-panel">
          <h2>WELCOME TO BLINK</h2>
          <p className="onboarding-description">
            BLINK offers personalized astrological insights based on cosmic alignments.
            The more information you provide, the more accurate your readings will be.
          </p>
          
          <div className="onboarding-options">
            <div className="onboarding-option">
              <h3>QUICK START</h3>
              <p>Begin immediately with a basic reading. You can add your personal details later to improve accuracy.</p>
              <button 
                className="secondary-button"
                onClick={skipOnboarding}
              >
                START BASIC READING
              </button>
            </div>
            
            <div className="onboarding-option">
              <h3>SAMPLE PROFILE</h3>
              <p>Try BLINK with pre-filled sample data to experience a fully personalized reading.</p>
              <button 
                className="primary-button"
                onClick={useSampleData}
              >
                USE SAMPLE DATA
              </button>
            </div>
            
            <div className="onboarding-option">
              <h3>FULL SETUP</h3>
              <p>Enter your birth details for the most accurate and personalized cosmic insights.</p>
              <button 
                className="primary-button"
                onClick={() => {
                  setShowOnboarding(false);
                  setShowSettings(true);
                }}
              >
                ENTER MY DETAILS
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!conversationId && !showOnboarding && !showConversationalOnboarding ? (
        <>
          {showSettings ? (
            <div className="panel settings-panel">
              <h2>USER SETTINGS</h2>
              <p className="caption">Configure your personal astrological data</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="settingsBirthDate">BIRTH DATE</label>
                  <input
                    type="date"
                    id="settingsBirthDate"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="settingsBirthTime">BIRTH TIME</label>
                  <input
                    type="time"
                    id="settingsBirthTime"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="settingsZodiacSign">ZODIAC SIGN</label>
                  <select
                    id="settingsZodiacSign"
                    value={zodiacSign}
                    onChange={(e) => setZodiacSign(e.target.value)}
                    disabled={loading || birthDate}
                  >
                    {zodiacOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.text}
                      </option>
                    ))}
                  </select>
                  {birthDate && (
                    <p className="helper-text">Sign automatically determined from your birth date. {getZodiacEmoji(zodiacSign)}</p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="settingsLocation">DEFAULT LOCATION</label>
                  <input
                    type="text"
                    id="settingsLocation"
                    placeholder="Enter location (city, region)"
                    value={defaultLocation}
                    onChange={(e) => setDefaultLocation(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              {/* Profile Info - Only shown in settings */}
              {(birthDate && birthTime) && (
                <div className="panel birth-info-panel">
                  <h2>YOUR PROFILE</h2>
                  <div className="profile-info">
                    <p><span>BIRTH DATE:</span> {birthDate}</p>
                    <p><span>BIRTH TIME:</span> {birthTime}</p>
                    {zodiacSign && <p><span>ZODIAC SIGN:</span> {zodiacSign} {getZodiacEmoji(zodiacSign)}</p>}
                    {defaultLocation && <p><span>LOCATION:</span> {defaultLocation}</p>}
                  </div>
                </div>
              )}
              
              {/* Reading Accuracy - Only shown in settings */}
              <div className="panel accuracy-panel">
                <h2>READING ACCURACY</h2>
                <div className="accuracy-meter">
                  <div className="accuracy-bar">
                    <div 
                      className="accuracy-fill" 
                      style={{ width: `${readingAccuracy}%` }}
                    >
                      <span className="accuracy-percentage">{readingAccuracy}%</span>
                    </div>
                  </div>
                  <p className="accuracy-tip">
                    {readingAccuracy < 70 
                      ? "Add birth details to increase reading accuracy." 
                      : readingAccuracy < 90 
                        ? "Add more details for even better insights." 
                        : "Your profile is optimized for accurate readings!"}
                  </p>
                </div>
              </div>
              
              <button
                onClick={saveSettings}
                className="primary-button"
                disabled={loading}
              >
                SAVE SETTINGS
              </button>
            </div>
          ) : (
            <>
              {/* Current Environment panel - shown on homepage */}
              {cosmicBrief && (
                <div className="panel status-panel">
                  <h2>CURRENT ENVIRONMENT</h2>
                  {briefLoading ? (
                    <div className="loading-state">Connecting to your cosmic patterns...</div>
                  ) : (
                    <p>{cosmicBrief.replace(/natal|astral pathway|temporal window for astrological perception/g, (match) => {
                      if (match === 'natal') return 'personal';
                      if (match === 'astral pathway') return 'energy field';
                      if (match === 'temporal window for astrological perception') return 'opportunity for new insights';
                      return match;
                    })}</p>
                  )}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="panel">
                  <div className="form-group">
                    <label htmlFor="userInput">QUERY</label>
                    <textarea
                      id="userInput"
                      placeholder="Describe your situation or question for astrological insight..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      disabled={loading}
                      required
                      rows={5}
                    />
                    
                    {/* Example Prompts */}
                    {!hasCompletedBasicReading && (
                      <div className="example-prompts">
                        <p className="helper-text">Not sure what to ask? Try one of these:</p>
                        <div className="example-buttons">
                          {examplePrompts.map((prompt, index) => (
                            <button
                              key={index}
                              type="button"
                              className="example-prompt-button"
                              onClick={() => setUserInput(prompt)}
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="selectedDate">EVENT DATE <span className="optional-label">(optional)</span></label>
                      <input
                        type="date"
                        id="selectedDate"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="location">LOCATION <span className="optional-label">(optional)</span></label>
                      <input
                        type="text"
                        id="location"
                        placeholder="Enter location (city, region)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        disabled={loading}
                      />
                      <p className="helper-text">Add location for more specific planetary influences</p>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={loading || !userInput.trim()}
                  >
                    {loading ? 'GENERATING...' : 'INTERPRET'}
                  </button>
                </div>
              </form>
            </>
          )}
        </>
      ) : !showOnboarding && !showConversationalOnboarding && (
        <>
          <div className="panel conversation-panel">
            {conversationHistory.map((message, index) => (
              <div key={index} className={`message ${message.role}-message`}>
                <div className="message-header">
                  <div className="avatar">{message.role === 'user' ? 'Y' : 'B'}</div>
                  <div className="username">{message.role === 'user' ? 'YOU' : 'BLINK'}</div>
                </div>
                <div className="message-content">
                  {message.role === 'assistant' ? (
                    <div dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }} />
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Post-reading accuracy upgrade prompt */}
          {readingAccuracy < 80 && (
            <div className="panel upgrade-panel">
              <h2>ENHANCE YOUR READING</h2>
              <p className="upgrade-message">
                This is a basic reading with {readingAccuracy}% accuracy. Add your birth details to receive more precise and personalized insights.
              </p>
              <button
                className="primary-button"
                onClick={() => {
                  startNewInterpretation();
                  setShowSettings(true);
                }}
              >
                UPGRADE MY READINGS
              </button>
            </div>
          )}
          
          {/* Image generation section */}
          {imagePrompt && (
            <div className="panel image-panel">
              <h2>VISUAL INTERPRETATION</h2>
              
              {!showImagePrompt && !imageUrl && (
                <button 
                  className="image-button"
                  onClick={() => setShowImagePrompt(true)}
                >
                  VIEW MIDJOURNEY PROMPT
                </button>
              )}
              
              {showImagePrompt && (
                <div className="image-prompt-container">
                  <p className="image-prompt">{imagePrompt}</p>
                  {!imageUrl && !generatingImage && (
                    <button 
                      className="generate-image-button"
                      onClick={handleGenerateImage}
                    >
                      GENERATE IMAGE
                    </button>
                  )}
                </div>
              )}
              
              {imageLoading && (
                <div className="loading-state">
                  <p>Generating your cosmic visualization...</p>
                </div>
              )}
              
              {imageUrl && (
                <div className="image-container">
                  <img src={imageUrl} alt="Astrological visualization" className="interpretation-image" />
                </div>
              )}
            </div>
          )}
          
          {suggestedQuestions.length > 0 && (
            <div className="panel suggested-questions-panel">
              <h2>SUGGESTED INQUIRIES</h2>
              <div className="suggested-questions">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    className="question-button"
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={loading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="panel followup-panel">
            <div className="form-group">
              <label htmlFor="followUpQuestion">FOLLOW-UP QUESTION</label>
              <textarea
                id="followUpQuestion"
                placeholder="Ask for clarification or more information..."
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                disabled={loading}
                required
                rows={3}
              />
            </div>
            
            <div className="button-container">
              <button 
                type="button" 
                className="secondary-button"
                onClick={startNewInterpretation}
                disabled={loading}
              >
                NEW INTERPRETATION
              </button>
              <button 
                type="submit" 
                className="primary-button"
                disabled={loading || !followUpQuestion.trim()}
              >
                {loading ? 'GENERATING...' : 'SUBMIT'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default App; 