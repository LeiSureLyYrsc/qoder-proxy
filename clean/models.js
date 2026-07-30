const MODELS = [
  { id: 'qoder-cn', name: 'Qoder CN Auto', cliModel: 'auto', reasoning: true, backends: ['cn'] },
  { id: 'auto', name: 'Auto', cliModel: 'auto', cliModels: { cn: 'auto', global: 'Auto' }, reasoning: true, backends: ['cn', 'global'] },
  { id: 'ultimate', name: 'Ultimate', cliModel: 'Ultimate', reasoning: true, backends: ['global'] },
  { id: 'performance', name: 'Performance', cliModel: 'Performance', reasoning: true, backends: ['global'] },
  { id: 'efficient', name: 'Efficient', cliModel: 'Efficient', reasoning: true, backends: ['global'] },
  { id: 'lite', name: 'Lite', cliModel: 'Lite', reasoning: true, backends: ['global'] },
  { id: 'cantus', name: 'Cantus', cliModel: 'Cantus', reasoning: true, backends: ['global'] },
  { id: 'qwen3.8-max-preview', name: 'Qwen3.8-Max-Preview', cliModel: 'Qwen3.8-Max-Preview', reasoning: true, backends: ['cn', 'global'] },
  { id: 'qwen3.8-max-preview-effort-low', name: 'Qwen3.8-Max-Preview low', cliModel: 'Qwen3.8-Max-Preview', reasoning: true, effortAlias: true, backends: ['cn', 'global'] },
  { id: 'qwen3.8-max-preview-effort-medium', name: 'Qwen3.8-Max-Preview medium', cliModel: 'Qwen3.8-Max-Preview', reasoning: true, effortAlias: true, backends: ['cn', 'global'] },
  { id: 'qwen3.8-max-preview-effort-high', name: 'Qwen3.8-Max-Preview high', cliModel: 'Qwen3.8-Max-Preview', reasoning: true, effortAlias: true, backends: ['cn', 'global'] },
  { id: 'qwen3.8-max-preview-effort-max', name: 'Qwen3.8-Max-Preview max', cliModel: 'Qwen3.8-Max-Preview', reasoning: true, effortAlias: true, backends: ['cn', 'global'] },
  { id: 'qwen3.7-max', name: 'Qwen3.7-Max', cliModel: 'Qwen3.7-Max', reasoning: true, backends: ['cn', 'global'] },
  { id: 'qwen3.7-max-effort-low', name: 'Qwen3.7-Max low', cliModel: 'Qwen3.7-Max', reasoning: true, effortAlias: true, backends: ['cn', 'global'] },
  { id: 'qwen3.7-max-effort-medium', name: 'Qwen3.7-Max medium', cliModel: 'Qwen3.7-Max', reasoning: true, effortAlias: true, backends: ['cn', 'global'] },
  { id: 'qwen3.7-max-effort-high', name: 'Qwen3.7-Max high', cliModel: 'Qwen3.7-Max', reasoning: true, effortAlias: true, backends: ['cn', 'global'] },
  { id: 'qwen3.7-max-effort-max', name: 'Qwen3.7-Max max', cliModel: 'Qwen3.7-Max', reasoning: true, effortAlias: true, backends: ['cn', 'global'] },
  { id: 'qwen3.7-plus', name: 'Qwen3.7-Plus', cliModel: 'Qwen3.7-Plus', reasoning: true, backends: ['cn', 'global'] },
  { id: 'kimi-k3', name: 'Kimi-K3', cliModel: 'Kimi-K3', reasoning: true, backends: ['global'] },
  { id: 'kimi-k2.7-code', name: 'Kimi-K2.7-Code', cliModel: 'Kimi-K2.7-Code', reasoning: true, backends: ['cn', 'global'] },
  { id: 'glm-5.2', name: 'GLM-5.2', cliModel: 'GLM-5.2', reasoning: true, backends: ['cn', 'global'] },
  { id: 'minimax-m3', name: 'MiniMax-M3', cliModel: 'MiniMax-M3', reasoning: true, backends: ['global'] },
  { id: 'minimax-m2.7', name: 'MiniMax-M2.7', cliModel: 'MiniMax-M2.7', reasoning: true, backends: ['cn'] },
  { id: 'qwen3.6-flash', name: 'Qwen3.6-Flash', cliModel: 'Qwen3.6-Flash', reasoning: true, backends: ['cn'] },
  { id: 'deepseek-v4-pro', name: 'DeepSeek-V4-Pro', cliModel: 'DeepSeek-V4-Pro', reasoning: true, backends: ['cn', 'global'] },
  { id: 'deepseek-v4-flash', name: 'DeepSeek-V4-Flash', cliModel: 'DeepSeek-V4-Flash', reasoning: true, backends: ['cn', 'global'] },
];

const DEFAULT_MODEL_ID = 'qoder-cn';
const EFFORT_SUFFIX_RE = /^(.*)-effort-(low|medium|high|max)$/;

function getModel(modelId) {
  return MODELS.find((model) => model.id === modelId);
}

function resolveCliModel(modelId, backend) {
  const model = getModel(modelId);
  if (model) return model.cliModels?.[backend] || model.cliModel;
  // Fallback to auto for unknown models (e.g. claude-haiku, gpt-4, etc.)
  return backend === 'global' ? 'Auto' : 'auto';
}

function resolveModelRoute(modelId, backend) {
  const match = modelId ? String(modelId).match(EFFORT_SUFFIX_RE) : null;
  const baseModelId = match ? match[1] : modelId;
  return {
    baseModelId,
    cliModel: resolveCliModel(baseModelId, backend),
    reasoningEffort: match?.[2],
  };
}

module.exports = {
  DEFAULT_MODEL_ID,
  MODELS,
  getModel,
  resolveCliModel,
  resolveModelRoute,
};
