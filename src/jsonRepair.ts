/**
 * Simple JSON repair utility
 * Handles common JSON syntax errors without external dependencies
 */

export function jsonrepair(jsonString: string): string {
  if (!jsonString || typeof jsonString !== 'string') {
    return jsonString;
  }

  let result = jsonString.trim();
  
  // Remove comments (both // and /* */)
  result = result.replace(/\/\*[\s\S]*?\*\//g, ''); // Remove /* */ comments
  result = result.replace(/\/\/.*$/gm, ''); // Remove // comments
  
  // Remove trailing commas
  result = result.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix single quotes to double quotes
  result = result.replace(/'/g, '"');
  
  // Add quotes around unquoted property names
  result = result.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
  
  // Add quotes around unquoted string values (simple cases)
  result = result.replace(/:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([,}])/g, ': "$1"$2');
  
  // Fix missing closing brackets/braces
  result = fixMissingBrackets(result);
  
  // Validate and attempt to parse
  try {
    JSON.parse(result);
    return result;
  } catch (error) {
    // If still invalid, try more aggressive fixes
    return attemptAdvancedRepair(result);
  }
}

function fixMissingBrackets(jsonString: string): string {
  let result = jsonString;
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < result.length; i++) {
    const char = result[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        openBraces++;
      } else if (char === '}') {
        openBraces--;
      } else if (char === '[') {
        openBrackets++;
      } else if (char === ']') {
        openBrackets--;
      }
    }
  }
  
  // Add missing closing brackets/braces
  while (openBrackets > 0) {
    result += ']';
    openBrackets--;
  }
  
  while (openBraces > 0) {
    result += '}';
    openBraces--;
  }
  
  return result;
}

function attemptAdvancedRepair(jsonString: string): string {
  let result = jsonString;
  
  // Try to fix common issues with a more aggressive approach
  try {
    // Use eval to attempt parsing (safer than new Function for this use case)
    const parsed = eval('(' + result + ')');
    return JSON.stringify(parsed);
  } catch (error) {
    // If all else fails, return the original string
    console.warn('JSON repair failed:', error);
    return jsonString;
  }
}

/**
 * Alternative implementation using new Function for more complex repairs
 */
export function jsonrepairAdvanced(jsonString: string): string {
  if (!jsonString || typeof jsonString !== 'string') {
    return jsonString;
  }

  try {
    // First try the simple repair
    const simpleRepaired = jsonrepair(jsonString);
    JSON.parse(simpleRepaired);
    return simpleRepaired;
  } catch (error) {
    // If simple repair fails, try using new Function
    try {
      const func = new Function('return ' + jsonString);
      const result = func();
      return JSON.stringify(result);
    } catch (funcError) {
      console.warn('Advanced JSON repair failed:', funcError);
      return jsonString;
    }
  }
}
