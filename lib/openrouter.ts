export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const OPENROUTER_DEFAULT_MODEL = "openai/gpt-4o-mini";
export const OPENROUTER_CLIENT_CONFIG = {
  baseURL: OPENROUTER_BASE_URL,
};

type ChatCompletionOptions = {
  messages: any[];
  model?: string | null;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: any;
};

export function getOpenRouterApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured.");
  }
  return apiKey;
}

export function getOpenRouterModel(model?: string | null) {
  const selectedModel = (model || process.env.OPENROUTER_MODEL || OPENROUTER_DEFAULT_MODEL).trim();
  if (!selectedModel.includes("/")) {
    throw new Error(`OpenRouter model must include a provider prefix. Received "${selectedModel}".`);
  }
  return selectedModel;
}

export function hasOpenRouterApiKey() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export async function createOpenRouterChatCompletion(options: ChatCompletionOptions) {
  const apiKey = getOpenRouterApiKey();
  const model = getOpenRouterModel(options.model);

  return fetch(`${OPENROUTER_CLIENT_CONFIG.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://winsproposal.com",
      "X-Title": "WinsProposal",
    },
    body: JSON.stringify({
      model,
      messages: options.messages,
      temperature: options.temperature,
      max_tokens: options.max_tokens,
      stream: options.stream,
      response_format: options.response_format,
    }),
  });
}
