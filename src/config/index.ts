import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

/**
 * Configuration for a single LLM provider, keyed by capability name.
 */
export interface LlmProviderConfig {
    apiKey: string
    model: string
    endpoint: string
}

/**
 * The full Monet configuration schema.
 */
export interface MonetConfig {
    workspacePath?: string
    llmProviders: Record<string, LlmProviderConfig>
}

/**
 * Loaded configuration with resolved paths.
 */
export interface ResolvedMonetConfig {
    workspacePath: string
    llmProviders: Record<string, LlmProviderConfig>
}

const GLOBAL_CONFIG_PATH = path.join(os.homedir(), '.monet', 'config')
const LOCAL_CONFIG_RELATIVE = path.join('.monet', 'config')

/**
 * Read and parse a JSON config file. Returns null if the file doesn't exist.
 */
function readConfigFile(filePath: string): MonetConfig | null {
    try {
        const raw = fs.readFileSync(filePath, 'utf-8')
        const parsed = JSON.parse(raw) as MonetConfig
        return parsed
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            return null
        }
        throw new Error(
            `Failed to read config file at ${filePath}: ${(err as Error).message}`
        )
    }
}

/**
 * Validate a parsed config object and return a list of error messages.
 */
function validateConfig(config: MonetConfig, source: string): string[] {
    const errors: string[] = []

    if (!config.llmProviders || typeof config.llmProviders !== 'object') {
        errors.push(`${source}: "llmProviders" must be an object`)
        return errors
    }

    for (const [name, provider] of Object.entries(config.llmProviders)) {
        if (!provider.apiKey || typeof provider.apiKey !== 'string') {
            errors.push(`${source}: llmProviders["${name}"] is missing a valid "apiKey"`)
        }
        if (!provider.model || typeof provider.model !== 'string') {
            errors.push(`${source}: llmProviders["${name}"] is missing a valid "model"`)
        }
        if (!provider.endpoint || typeof provider.endpoint !== 'string') {
            errors.push(`${source}: llmProviders["${name}"] is missing a valid "endpoint"`)
        }
    }

    return errors
}

/**
 * Load and resolve the Monet configuration.
 *
 * Reads from the global config at `~/.monet/config` first, then merges
 * per-project overrides from `<workspace>/.monet/config`. Project-level
 * `llmProviders` override global ones by key.
 *
 * @param workspacePath - Optional explicit workspace path. If not provided,
 *   the current working directory is used.
 * @returns The resolved configuration.
 * @throws If no config is found or validation fails.
 */
export function getConfig(workspacePath?: string): ResolvedMonetConfig {
    const resolvedWorkspace = workspacePath ?? process.cwd()
    const localConfigPath = path.join(resolvedWorkspace, LOCAL_CONFIG_RELATIVE)

    // Load global config
    const globalConfig = readConfigFile(GLOBAL_CONFIG_PATH)

    // Load local (per-project) config
    const localConfig = readConfigFile(localConfigPath)

    // If neither exists, throw
    if (!globalConfig && !localConfig) {
        throw new Error(
            `No configuration found.\n` +
            `  Looked for global config at: ${GLOBAL_CONFIG_PATH}\n` +
            `  Looked for project config at: ${localConfigPath}\n` +
            `Create a config file at one of these locations. See src/node.md for the schema.`
        )
    }

    // Validate both configs
    const allErrors: string[] = []
    if (globalConfig) {
        allErrors.push(...validateConfig(globalConfig, 'Global config'))
    }
    if (localConfig) {
        allErrors.push(...validateConfig(localConfig, 'Project config'))
    }
    if (allErrors.length > 0) {
        throw new Error(`Configuration validation failed:\n  ${allErrors.join('\n  ')}`)
    }

    // Merge: start with global, overlay local
    const merged: MonetConfig = {
        workspacePath: localConfig?.workspacePath ?? globalConfig?.workspacePath,
        llmProviders: {
            ...(globalConfig?.llmProviders ?? {}),
            ...(localConfig?.llmProviders ?? {}),
        },
    }

    return {
        workspacePath: merged.workspacePath ?? resolvedWorkspace,
        llmProviders: merged.llmProviders,
    }
}

/**
 * Get the configuration for a specific named LLM provider.
 *
 * @param providerName - The capability name, e.g. "analyze", "plan", "coding".
 * @param config - Optional pre-loaded config. If not provided, loads fresh.
 * @returns The provider configuration.
 * @throws If the named provider is not configured.
 */
export function getLlmProvider(
    providerName: string,
    config?: ResolvedMonetConfig
): LlmProviderConfig {
    const cfg = config ?? getConfig()
    const provider = cfg.llmProviders[providerName]
    if (!provider) {
        throw new Error(
            `No LLM provider configured for "${providerName}".\n` +
            `  Add an entry to llmProviders in your config file.\n` +
            `  Available providers: ${Object.keys(cfg.llmProviders).join(', ') || '(none)'}`
        )
    }
    return provider
}
