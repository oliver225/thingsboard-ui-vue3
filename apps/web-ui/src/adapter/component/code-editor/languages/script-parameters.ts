import type { ScriptParameter } from '../types';

const parameterScopes = new Map<string, ScriptParameter[]>();

function copyParameters(
  parameters: ScriptParameter[],
  ancestors = new Set<ScriptParameter>(),
): ScriptParameter[] {
  return parameters.flatMap((parameter) => {
    if (ancestors.has(parameter)) return [];
    ancestors.add(parameter);
    const copy: ScriptParameter = {
      description: parameter.description,
      name: parameter.name,
      type: parameter.type,
      properties: parameter.properties
        ? copyParameters(parameter.properties, ancestors)
        : undefined,
    };
    ancestors.delete(parameter);
    return [copy];
  });
}

/** A parameter set belongs to one model; disposing an old registration is safe. */
export function setScriptParameters(
  modelUri: string,
  parameters: ScriptParameter[],
): () => void {
  const scope = copyParameters(parameters);
  parameterScopes.set(modelUri, scope);
  return () => {
    if (parameterScopes.get(modelUri) === scope)
      parameterScopes.delete(modelUri);
  };
}

export function getScriptParameters(modelUri: string): ScriptParameter[] {
  return parameterScopes.get(modelUri) ?? [];
}

export function clearScriptParameters(modelUri: string) {
  parameterScopes.delete(modelUri);
}
