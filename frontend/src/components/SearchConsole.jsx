import React, { useState, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { Search, Sparkles, Terminal, HelpCircle, X } from 'lucide-react';

export default function SearchConsole() {
  const { searchByPrompt, clearSearch, prompt, lastParsedQuery, explanation, isLoading } = useBooking();
  const [searchInput, setSearchInput] = useState('');
  
  // Update local input if prompt changes globally (e.g. via suggestions)
  useEffect(() => {
    setSearchInput(prompt);
  }, [prompt]);

  const suggestions = [
    "Luxury hotel in Tokyo with pool and spa under 400",
    "Cheap room in London with free breakfast",
    "Pet-friendly suites in Seattle with gym and ac",
    "Paris boutique stay with kitchen under 200"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    searchByPrompt(searchInput);
  };

  const handleSuggestionClick = (sug) => {
    setSearchInput(sug);
    searchByPrompt(sug);
  };

  const handleClear = () => {
    setSearchInput('');
    clearSearch();
  };

  // Syntax highlighting helper for MongoDB query JSON
  const highlightJSON = (jsonObj) => {
    if (!jsonObj) return '';
    const jsonStr = JSON.stringify(jsonObj, null, 2);
    
    // Simple regex highlighter
    return jsonStr.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'color: #c3e88d'; // defaults (strings)
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            // Check if key is a mongo operator (starts with $)
            if (/"\$/.test(match)) {
              cls = 'color: hsl(var(--accent-secondary))'; // $lte, $regex, etc.
            } else {
              cls = 'color: #c792ea'; // standard key (purple)
            }
          } else {
            cls = 'color: #c3e88d'; // string value (green)
          }
        } else if (/true|false/.test(match)) {
          cls = 'color: #ffcb6b'; // boolean (orange)
        } else if (/null/.test(match)) {
          cls = 'color: #ff5370'; // null (red)
        } else {
          cls = 'color: #f78c6c'; // number (pink)
        }
        
        // Return styled span
        const label = match.replace(/:$/, '');
        const isKey = /:$/.test(match);
        return `<span style="${cls}">${label}</span>${isKey ? ':' : ''}`;
      }
    );
  };

  return (
    <div className="search-console-container">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="search-card glass-panel">
        <h2 className="text-gradient-neon search-card-header" style={{ fontSize: '1.25rem' }}>
          <Sparkles className="w-5 h-5" style={{ color: 'hsl(var(--accent-primary))' }} />
          Conversational Search Console
        </h2>
        
        <div className="search-input-wrapper">
          <div className="search-icon-container">
            {isLoading ? (
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '20px' }}>
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
              </div>
            ) : (
              <Search className="w-5 h-5" />
            )}
          </div>
          
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Type your natural language request (e.g. 'cozy cottage in London with wifi under 150')"
            className="search-input-field"
          />

          {searchInput && (
            <button
              type="button"
              onClick={handleClear}
              className="search-clear-btn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestion Pills */}
        <div className="suggestions-row">
          <span className="suggestions-title">
            <HelpCircle className="w-3.5 h-3.5" /> Quick Prompts:
          </span>
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSuggestionClick(sug)}
              className="suggestion-pill"
            >
              "{sug}"
            </button>
          ))}
        </div>
      </form>

      {/* Query Visualizer */}
      {lastParsedQuery && (
        <div className="visualizer-card glass-panel">
          <div className="visualizer-info">
            <span className="badge badge-accent" style={{ marginBottom: '8px', width: 'fit-content' }}>Conversational Parser</span>
            <h3>Intent Extraction</h3>
            <p>
              {explanation}
            </p>
            <div className="visualizer-live-indicator">
              <span className="visualizer-ping-dot" />
              <span>Real-time translation mapping active</span>
            </div>
          </div>
          
          <div className="visualizer-code">
            <div className="visualizer-tag">
              <Terminal className="w-3.5 h-3.5" />
              <span>MONGODB QUERY FILTER</span>
            </div>
            
            <pre>
              <code>
                {`db.rooms.find(\n`}
                <span 
                  dangerouslySetInnerHTML={{ __html: highlightJSON(lastParsedQuery) }} 
                />
                {`\n)`}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
