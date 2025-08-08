import * as vscode from 'vscode';

export interface LinkerConfig {
  // Extension settings
  enabled: boolean;
  autoReload: boolean;
  debug: boolean;
  
  // Inline link settings
  enableInlineLinks: boolean;
  inlineLinkPattern: string;
  
  // Path prefix configuration
  pathPrefixes: {
    [key: string]: {
      description: string;
      base: 'workspace' | 'current' | 'parent' | 'child';
    };
  };
}

export const DEFAULT_CONFIG: LinkerConfig = {
  enabled: true,
  autoReload: true,
  debug: false,
  enableInlineLinks: true,
  inlineLinkPattern: "@link\\s+\\[#(?<anchor>.+?)\\]\\((?<link>.+?)\\)",
  pathPrefixes: {
    '#:': {
      description: 'Relative to workspace root',
      base: 'workspace'
    },
    '~:': {
      description: 'Relative to current file directory',
      base: 'current'
    },
    '<:': {
      description: 'Relative to parent of current file directory',
      base: 'parent'
    },
    '>:': {
      description: 'Relative to child directory of current file directory',
      base: 'child'
    }
  }
};

export function getConfig(): LinkerConfig {
  const config = vscode.workspace.getConfiguration('linker');
  
  return {
    enabled: config.get<boolean>('enabled', DEFAULT_CONFIG.enabled),
    autoReload: config.get<boolean>('autoReload', DEFAULT_CONFIG.autoReload),
    debug: config.get<boolean>('debug', DEFAULT_CONFIG.debug),
    enableInlineLinks: config.get<boolean>('enableInlineLinks', DEFAULT_CONFIG.enableInlineLinks),
    inlineLinkPattern: config.get<string>('inlineLinkPattern', DEFAULT_CONFIG.inlineLinkPattern),
    pathPrefixes: config.get('pathPrefixes', DEFAULT_CONFIG.pathPrefixes)
  };
}

// Plugin configuration file
export const PluginConfig = {
  // Text file extension list
  textFileExtensions: [
    // Programming language files
    '.txt', '.md', '.json', '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', 
    '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
    '.html', '.css', '.scss', '.sass', '.less', '.xml', '.yaml', '.yml', '.toml',
    '.ini', '.cfg', '.conf', '.log', '.sql', '.sh', '.bash', '.zsh', '.fish',
    '.dockerfile', '.gitignore', '.gitattributes', '.editorconfig', '.eslintrc',
    '.prettierrc', '.babelrc', '.env', '.env.example', '.env.local', '.env.production',
    // Other text files
    '.csv', '.tsv', '.rss', '.atom', '.rdf', '.svg', '.tex', '.rst', '.adoc',
    '.wiki', '.text', '.asc', '.rtf', '.odt', '.fodt', '.sxw', '.stw'
  ],

  // Default icon configuration
  defaultIcons: {
    url: '🌐',
    file: '📁',
    command: '⚡',
    default: '🔗'
  },

  // Decorator configuration
  decorations: {
    linkColor: 'transparent',  // Transparent, no color display
    linkDecoration: 'none',    // No decoration
    cursor: 'default'          // Default cursor
  },

  // Hover tooltip configuration
  hover: {
    showMatchText: false,  // Whether to show matched text
    showTargetLink: true,  // Whether to show target link
    showOperationTips: true  // Whether to show operation tips
  },

  // CodeLens configuration
  codeLens: {
    showIcons: true,  // Whether to show icons
    showDescription: false  // Whether to show description
  }
};

// Get text file extension list
export function getTextFileExtensions(): string[] {
  return PluginConfig.textFileExtensions;
}

// Check if it's a text file
export function isTextFile(filePath: string): boolean {
  const fileExtension = filePath.toLowerCase().split('.').pop();
  if (!fileExtension) return true; // Files without extension default to text files
  
  return PluginConfig.textFileExtensions.includes(`.${fileExtension}`);
}

// Get default icon
export function getDefaultIcon(type: 'url' | 'file' | 'command'): string {
  return PluginConfig.defaultIcons[type] || PluginConfig.defaultIcons.default;
} 