import { GoogleGenerativeAI } from '@google/generative-ai';

// Custom interface for Google Gen AI if needed, or using the standard sdk
// Note: standard import is `import { GoogleGenerativeAI } from '@google/generative-ai';`
// Let's implement both standard SDK usage and a fallback parsing mechanism.

const standardAmenities = ['wifi', 'pool', 'gym', 'spa', 'parking', 'ac', 'kitchen', 'breakfast', 'pets'];

/**
 * High-fidelity local parser in case Gemini API key is missing or calls fail.
 * Extracts: location, price, rating, and amenities from user natural language prompts.
 */
const parseLocalPrompt = (prompt) => {
  const normalized = prompt.toLowerCase();
  const filter = {};
  const explanationParts = [];

  // 1. Parse Price limits
  // Matches "under 200", "below 200", "less than 200", "under $200", "< 200", "max 200"
  const lteMatch = normalized.match(/(?:under|below|less than|max|cheaper than|budget|under\s*\$|below\s*\$|max\s*\$)\s*(\d+)/i) || 
                   normalized.match(/(?:under|below|less than|max|cheaper than|budget|under\s*\$|below\s*\$|max\s*\$)\s*(\d+)/i);
  // Matches "above 100", "more than 100", "greater than 100", "min 100", "above $100", "> 100"
  const gteMatch = normalized.match(/(?:above|more than|greater than|min|at least|above\s*\$|gte\s*)\s*(\d+)/i);

  if (lteMatch && lteMatch[1]) {
    const limit = parseInt(lteMatch[1], 10);
    filter.price = { ...filter.price, $lte: limit };
    explanationParts.push(`Price limit: ≤ $${limit}`);
  }
  if (gteMatch && gteMatch[1]) {
    const limit = parseInt(gteMatch[1], 10);
    filter.price = { ...filter.price, $gte: limit };
    explanationParts.push(`Price floor: ≥ $${limit}`);
  }

  // 2. Parse Amenities
  const foundAmenities = [];
  standardAmenities.forEach(amenity => {
    // Check if the amenity is mentioned
    // Special handling for wifi (wi-fi), aircon (ac, air conditioning)
    if (amenity === 'wifi' && (normalized.includes('wifi') || normalized.includes('wi-fi') || normalized.includes('internet'))) {
      foundAmenities.push('wifi');
    } else if (amenity === 'ac' && (normalized.includes('ac') || normalized.includes('air conditioning') || normalized.includes('a/c'))) {
      foundAmenities.push('ac');
    } else if (amenity === 'pets' && (normalized.includes('pet') || normalized.includes('pets') || normalized.includes('dog') || normalized.includes('cat'))) {
      foundAmenities.push('pets');
    } else if (normalized.includes(amenity)) {
      foundAmenities.push(amenity);
    }
  });

  if (foundAmenities.length > 0) {
    filter.amenities = { $all: foundAmenities };
    explanationParts.push(`Amenities: ${foundAmenities.join(', ')}`);
  }

  // 3. Parse Ratings
  // Matches "5 star", "4 star", "highly rated", "top rated", "above 4 rating"
  if (normalized.includes('5 star') || normalized.includes('five star') || normalized.includes('excellent')) {
    filter.rating = { $gte: 4.8 };
    explanationParts.push('Rating: ≥ 4.8 (Exceptional)');
  } else if (normalized.includes('4 star') || normalized.includes('four star') || normalized.includes('highly rated') || normalized.includes('top rated') || normalized.includes('best rated')) {
    filter.rating = { $gte: 4.0 };
    explanationParts.push('Rating: ≥ 4.0 (Highly Rated)');
  } else if (normalized.includes('3 star') || normalized.includes('three star')) {
    filter.rating = { $gte: 3.0 };
    explanationParts.push('Rating: ≥ 3.0');
  }

  // 4. Parse Location
  // We'll extract words that look like locations. Usually "in <Location>" or "at <Location>" or "near <Location>"
  const locMatch = normalized.match(/(?:in|at|near|around|for)\s+([a-zA-Z\s]+?)(?:\s+(?:under|above|with|featuring|having|under|below|less|more|wifi|pool|gym|spa|parking|ac|pets|breakfast|star|rating|and|but|that|$))/i);
  if (locMatch && locMatch[1]) {
    const loc = locMatch[1].trim();
    // Clean up trailing words like 'hotel', 'hotels', 'room', 'rooms'
    let cleanLoc = loc.replace(/\b(hotel|hotels|room|rooms|stay|stays|place|places)\b/gi, '').trim();
    if (cleanLoc.length > 2) {
      filter.location = { $regex: cleanLoc, $options: 'i' };
      explanationParts.push(`Location matches: "${cleanLoc}" (case-insensitive)`);
    }
  } else {
    // If no "in" preposition, check if common cities are mentioned
    const commonCities = ['new york', 'nyc', 'london', 'tokyo', 'paris', 'seattle', 'san francisco', 'sf', 'chicago', 'miami', 'los angeles', 'la', 'boston', 'sydney', 'rome', 'berlin'];
    for (const city of commonCities) {
      if (normalized.includes(city)) {
        filter.location = { $regex: city, $options: 'i' };
        explanationParts.push(`Location matches: "${city}" (case-insensitive)`);
        break;
      }
    }
  }

  return {
    filter,
    explanation: explanationParts.length > 0 
      ? `[Fallback Parser] Extracted filters: ${explanationParts.join(' | ')}`
      : '[Fallback Parser] No search constraints detected. Displaying all available listings.'
  };
};

/**
 * Main parser entry point.
 * Calls Gemini if GEMINI_API_KEY is defined, otherwise uses parseLocalPrompt fallback.
 */
export const parsePromptToMongo = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('💡 Using high-fidelity local parser (GEMINI_API_KEY not configured)');
    return parseLocalPrompt(prompt);
  }

  try {
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const systemInstruction = `
You are a database query compiler for a hotel booking engine called PromptInn.
Your job is to translate the user's natural language search prompt into a clean MongoDB query filter matching the following schema fields:
- location: String (e.g. city, state, country, or neighborhood)
- price: Number (nightly rate in USD)
- rating: Number (average rating out of 5 stars)
- amenities: Array of Strings (must ONLY use strings from this allowed list: ["wifi", "pool", "gym", "spa", "parking", "ac", "kitchen", "breakfast", "pets"])

Rules for mapping to MongoDB JSON query filters:
1. For location: Use case-insensitive regex pattern matching. Format: { "location": { "$regex": "location_name", "$options": "i" } }.
2. For price: Map constraints correctly using $lte (less than/under/max) and $gte (greater than/above/min). e.g. { "price": { "$lte": 250 } }. If a range is given (e.g. "between 100 and 200"), use { "price": { "$gte": 100, "$lte": 200 } }.
3. For amenities: If one or more amenities are specified, construct a filter using $all. Format: { "amenities": { "$all": ["wifi", "pool"] } }. Use ONLY terms from the allowed list: ["wifi", "pool", "gym", "spa", "parking", "ac", "kitchen", "breakfast", "pets"]. Map synonyms (e.g. "air conditioning" -> "ac", "internet" -> "wifi", "dog friendly" -> "pets", "morning meal" -> "breakfast").
4. For rating: If a user asks for "highly rated", "luxury", "top-rated" or "5 stars", filter rating. e.g. { "rating": { "$gte": 4.5 } }.
5. Do NOT include fields in the filter if the user did not specify them in the prompt.
6. Return a JSON object with exactly two keys:
   - "filter": The MongoDB filter object (which can be empty {} if no constraints match).
   - "explanation": A concise 1-sentence explanation of what filters were extracted.

Example Input: "cheap hotel in London with wifi and pool under 150"
Example Output:
{
  "filter": {
    "location": { "$regex": "London", "$options": "i" },
    "price": { "$lte": 150 },
    "amenities": { "$all": ["wifi", "pool"] }
  },
  "explanation": "Searching for rooms in London with Wi-Fi and swimming pool under $150/night."
}
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent(`Prompt to parse: "${prompt}"`);

    const responseText = result.response.text();
    const parsedResult = JSON.parse(responseText);
    
    // Validate schema output keys
    if (parsedResult && parsedResult.filter !== undefined) {
      return {
        filter: parsedResult.filter,
        explanation: parsedResult.explanation || `Gemini compiled query successfully.`
      };
    }
    
    throw new Error('Invalid JSON structure returned from Gemini.');
    
  } catch (error) {
    console.error('❌ Gemini parsing failed, using local parser fallback:', error.message);
    return parseLocalPrompt(prompt);
  }
};
