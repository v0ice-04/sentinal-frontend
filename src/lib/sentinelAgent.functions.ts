import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM_PROMPT_ANALYZE = `You are SentinelAI, an expert DevOps risk analysis agent. When given deployment details, you analyze them for risks, red flags, and improvements. Always respond with ONLY a valid JSON object (no markdown, no code fences) in this EXACT structure:

{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "riskScore": number (0-100),
  "redFlags": [
    { "title": string, "description": string, "severity": "warning" | "critical" }
  ],
  "improvements": [
    { "title": string, "description": string, "priority": "low" | "medium" | "high" }
  ],
  "memoriesRecalled": [
    { "type": "DEPLOYMENT" | "INCIDENT" | "PATTERN", "title": string, "date": string, "relevance": number }
  ],
  "summary": string,
  "recommendation": "PROCEED" | "PROCEED_WITH_CAUTION" | "ABORT"
}

Base your judgment on the deployment metadata. Include 2-4 red flags, 2-4 improvements, and 2-3 plausible memoriesRecalled (invented but realistic). Calibrate riskScore to riskLevel (LOW 0-30, MEDIUM 31-60, HIGH 61-85, CRITICAL 86-100).`;

const SYSTEM_PROMPT_CHAT = `You are SentinelAI, an expert memory-driven DevOps intelligence agent. You remember past deployments, incidents, and patterns. Answer concisely with confident, actionable advice. Use light markdown (**bold**, \`code\`, line breaks). When relevant, cite memories like "I recall on Apr 12..." and give a clear risk assessment. Keep responses under 180 words.`;

async function callGateway(body: object): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gateway ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

const DeploymentInput = z.object({
  service: z.string(),
  branch: z.string(),
  environment: z.string(),
  commitMessage: z.string(),
  triggeredBy: z.string(),
  currentCpuUsage: z.number().optional(),
  recentFailures: z.number().optional(),
  lastDeployStatus: z.string().optional(),
});

export const analyzeDeploymentFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => DeploymentInput.parse(d))
  .handler(async ({ data }) => {
    const userPrompt = `Analyze this deployment:
- Service: ${data.service}
- Branch: ${data.branch}
- Environment: ${data.environment}
- Commit Message: ${data.commitMessage}
- Triggered By: ${data.triggeredBy}
- Current CPU Usage: ${data.currentCpuUsage ?? "unknown"}%
- Recent Failures (7d): ${data.recentFailures ?? 0}
- Last Deploy Status: ${data.lastDeployStatus ?? "unknown"}

Return ONLY the JSON object.`;

    const content = await callGateway({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT_ANALYZE },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    // Strip potential code fences
    const cleaned = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(cleaned);
  });

const ChatInput = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
});

export const chatWithAgentFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ChatInput.parse(d))
  .handler(async ({ data }) => {
    const content = await callGateway({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT_CHAT },
        ...data.messages,
      ],
      max_tokens: 600,
    });
    return { content };
  });
