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
        let cls = 'text-orange-300'; // defaults (strings)
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
    <div className="w-full flex flex-col gap-6">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="w-full relative glass-panel p-6 flex flex-col gap-4">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
        
        <h2 className="text-xl font-semibold flex items-center gap-2 font-heading text-gradient-neon">
          <Sparkles className="w-5 h-5 text-[hsl(var(--accent-primary))]" />
          Conversational Search Console
        </h2>
        
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400">
            {isLoading ? (
              <div className="flex gap-1 items-center h-5">
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
              </div>
            ) : (
              <Search className="w-5 h-5 text-slate-400" />
            )}
          </div>
          
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Type your natural language request (e.g. 'cozy cottage in London with wifi under 150')"
            className="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-700 bg-slate-900/60 text-white font-body text-[1rem] focus:outline-none focus:border-[hsl(var(--accent-primary))] focus:ring-1 focus:ring-[hsl(var(--accent-primary))] transition-all"
          />

          {searchInput && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestion Pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Quick Prompts:
          </span>
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSuggestionClick(sug)}
              className="badge badge-outline text-[0.8rem] normal-case py-1 px-3 bg-slate-900/40 border-slate-800 hover:border-[hsl(var(--accent-primary))] hover:text-white transition-colors cursor-pointer"
            >
              "{sug}"
            </button>
          ))}
        </div>
      </form>

      {/* Query Visualizer */}
      {lastParsedQuery && (
        <div className="glass-panel overflow-hidden border border-slate-800 flex flex-col md:flex-row">
          <div className="md:w-2/5 p-6 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-center">
            <span className="badge badge-accent mb-3 w-fit">Conversational Parser</span>
            <h3 className="text-lg font-semibold mb-2">Intent Extraction</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {explanation}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Real-time translation mapping active</span>
            </div>
          </div>
          
          <div className="md:w-3/5 bg-slate-950/80 p-6 font-mono text-xs overflow-x-auto relative min-h-[150px]">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 text-slate-500 select-none">
              <Terminal className="w-3.5 h-3.5" />
              <span>MONGODB QUERY FILTER</span>
            </div>
            
            <pre className="mt-4 text-slate-300">
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
