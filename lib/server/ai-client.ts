export interface AiRuntimeStatus {
  configured: boolean;
  provider: string;
  model: string;
  baseUrl: string;
  modeLabel: string;
}

export function getAiStatus(): AiRuntimeStatus {
  const apiKey = (process.env.AI_API_KEY || "").trim();
  const provider = (process.env.AI_PROVIDER || "deepseek").trim();
  const baseUrl = (process.env.AI_BASE_URL || "https://api.deepseek.com/v1").replace(/\/+$/, "");
  const model = (process.env.AI_MODEL || "deepseek-chat").trim();
  const configured = apiKey.length >= 8;

  return {
    configured,
    provider,
    model,
    baseUrl,
    modeLabel: configured ? `${provider.toUpperCase()} (${model})` : "Smart Local Engine",
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callAiJson<T = Record<string, any>>(params: {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}): Promise<{ ok: true; data: T; provider: string; model: string } | { ok: false; reason: string }> {
  const status = getAiStatus();
  const apiKey = (process.env.AI_API_KEY || "").trim();
  if (!status.configured || !apiKey) {
    return { ok: false, reason: "AI_API_KEY not configured" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    const res = await fetch(`${status.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: status.model,
        temperature: params.temperature ?? 0.35,
        max_tokens: params.maxTokens ?? 1800,
        response_format: { type: "json_object" },
        messages: params.messages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, reason: `HTTP ${res.status}: ${errText.slice(0, 180)}` };
    }

    const json = await res.json();
    const rawContent: string = json?.choices?.[0]?.message?.content || "";
    if (!rawContent) {
      return { ok: false, reason: "Empty model response" };
    }

    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as T;
    return { ok: true, data: parsed, provider: status.provider, model: status.model };
  } catch (err: any) {
    return { ok: false, reason: err?.message || "AI request failed" };
  }
}

export const ANTI_HALLUCINATION_RULE =
  "STRICT ANTI-HALLUCINATION RULE: Never invent metrics, percentages, revenue figures, team sizes, dates, degrees, or employers that are not present in the user's resume. Whenever a metric would strengthen a bullet point but is not provided, insert a clear bracketed placeholder such as [X%], [N users], or [$Xk] so the user can fill in their real number.";