import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const openRouterSource = read("lib/openrouter.ts");
assert(openRouterSource.includes('OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"'), "OpenRouter helper must use the OpenRouter base URL");
assert(openRouterSource.includes("baseURL: OPENROUTER_BASE_URL"), "OpenRouter helper must expose an OpenAI-compatible baseURL setting");
assert(openRouterSource.includes("process.env.OPENROUTER_API_KEY"), "OpenRouter helper must use OPENROUTER_API_KEY");
assert(openRouterSource.includes('OPENROUTER_DEFAULT_MODEL = "openai/gpt-4o-mini"'), "OpenRouter helper must default to an OpenRouter-compatible model ID");
assert(openRouterSource.includes("OpenRouter API key is not configured."), "OpenRouter helper must expose the required missing-key error");

const llmFiles = [
  "app/api/rfp/parse/route.ts",
  "app/api/proposals/generate/route.ts",
  "app/api/tbe/[rfpId]/generate/route.ts",
  "app/api/vault/process/route.ts",
  "lib/visualization-service.ts",
];

for (const file of llmFiles) {
  const source = read(file);
  assert(source.includes("createOpenRouterChatCompletion"), `${file} must use the shared OpenRouter helper`);
  assert(!/api\.openai\.com/i.test(source), `${file} must not call api.openai.com directly`);
  assert(!/apps\.abacus\.ai\/v1\/chat\/completions/i.test(source), `${file} must not call the old chat completion endpoint`);
  assert(!/model\s*:\s*["']gpt-4o(?:["']|-)/i.test(source), `${file} must not use an unprefixed gpt-4o model`);
  assert(!/OPENAI_API_KEY/.test(source), `${file} must not use OPENAI_API_KEY`);
}

const rfpParser = read("app/api/rfp/parse/route.ts");
assert(rfpParser.includes("mammoth.extractRawText"), "DOCX RFP flow should still extract DOCX text with mammoth");
assert(rfpParser.includes("getOpenRouterModel()"), "RFP parser must use the OpenRouter model helper");

console.log("OpenRouter LLM configuration verified.");
