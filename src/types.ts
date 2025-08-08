export interface LinkConfig {
  // Link display name
  name: string;
  // Link type: url, file
  type: 'url' | 'file';
  // Target content (URL or file path)
  target: string;
  // Matching rules
  patterns: LinkPattern[];
  // Optional description
  description?: string;
  // Optional icon
  icon?: string;
  // Whether to show CodeLens (optional, defaults to global configuration)
  showCodeLens?: boolean;
}



export interface LinkPattern {
  // Matching type: text, regex, line
  type: 'text' | 'regex' | 'line';
  // Matching content
  value: string;
  // File extension filtering (optional)
  fileExtensions?: string[];
  // Case sensitivity
  caseSensitive?: boolean;
  // Matching context (optional)
  context?: {
    before?: string;
    after?: string;
  };
  // Capture group index for highlighting (optional, defaults to 0 for entire match)
  highlightGroup?: number;
}

export interface LinkMatch {
  config: LinkConfig;
  pattern: LinkPattern;
  range: {
    start: number;
    end: number;
  };
  text: string;  // Highlighted text
  fullMatch?: string;  // Complete matched text (for variable resolution)
  regexGroups?: string[];  // Regex capture groups
}

// Inline link match result
export interface InlineLinkMatch {
  anchor: string;       // Anchor text (e.g., "framework")
  href: string;         // Link address
  commentRange: {
    start: number;
    end: number;
  };
  codeRange: {
    start: number;
    end: number;
  };
  commentText: string;  // Complete text in comment
  codeText: string;     // Matched text in code
  lineNumber: number;   // Code line number
}

export interface WorkspaceConfig {
  // Configuration file path
  configPath: string;
  // Whether to enable the extension
  enabled: boolean;
  // Auto reload configuration
  autoReload: boolean;
  // Debug mode
  debug: boolean;
  // Whether to enable inline link configuration
  enableInlineLinks?: boolean;
} 