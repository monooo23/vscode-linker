/**
 * Path Prefix Demo
 * 
 * This file demonstrates how to use path prefixes in inline links
 * to specify the relative base directory for file paths.
 */

// @link [#package](#:package.json)
// @link [#readme](#:README.md)
// @link [#config](#:src/config.ts)
// @link [#types](#:src/types.ts)

// @link [#helper](~:helper.ts)
// @link [#utils](~:utils/index.ts)
// @link [#constants](~:constants.ts)

// @link [#parent](<:../parent.ts)
// @link [#shared](<:../shared/utils.ts)
// @link [#config](<:../config/database.ts)

// @link [#component](>:components/Button.tsx)
// @link [#service](>:services/api.ts)
// @link [#test](>:tests/unit/helper.test.ts)

// Example usage in code:
const packageInfo = require('package.json');
const readmeContent = fs.readFileSync('README.md', 'utf8');
const config = loadConfig();
const types = require('./types');

const helper = require('./helper');
const utils = require('./utils');
const constants = require('./constants');

const parent = require('../parent');
const shared = require('../shared/utils');
const dbConfig = require('../config/database');

const Button = require('./components/Button');
const api = require('./services/api');
const testHelper = require('./tests/unit/helper');

/**
 * Path Prefix Reference:
 * 
 * #: - Relative to workspace root
 *     Example: #:package.json -> /workspace/root/package.json
 * 
 * ~: - Relative to current file directory
 *     Example: ~:helper.ts -> /workspace/root/src/helper.ts
 * 
 * <: - Relative to parent of current file directory
 *     Example: <:../utils.ts -> /workspace/utils.ts
 * 
 * >: - Relative to child directory of current file directory
 *     Example: >:components/Button.tsx -> /workspace/root/src/components/Button.tsx
 * 
 * No prefix - Relative to workspace root (existing behavior)
 *     Example: config.json -> /workspace/root/config.json
 */
