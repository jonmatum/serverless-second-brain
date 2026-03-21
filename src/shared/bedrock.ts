import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import type { ClassificationResult } from "./types.js";
import { BedrockError } from "./errors.js";

const bedrock = new BedrockRuntimeClient({});
const MODEL_ID = process.env.BEDROCK_MODEL_ID!;

export async function classify(
  text: string,
  existingSlugs: string[],
  language: "es" | "en",
): Promise<ClassificationResult> {
  const prompt = `You are a knowledge graph classifier. Given the following text, generate structured metadata for a knowledge node.

Text:
${text}

Existing nodes in the graph (suggest cross-references from these): ${existingSlugs.slice(0, 50).join(", ")}

Input language: ${language}

Respond with ONLY valid JSON matching this schema:
{
  "title": "short title in the content's primary language",
  "title_es": "Spanish title",
  "title_en": "English title",
  "summary_es": "2-3 sentence Spanish summary",
  "summary_en": "2-3 sentence English summary",
  "tags": ["tag1", "tag2", "tag3"],
  "concepts": ["existing-slug-1", "existing-slug-2"]
}

Rules:
- tags: 3-7 lowercase hyphenated tags
- concepts: only slugs from the existing nodes list that are genuinely related
- summaries: concrete and specific, not generic
- title: concise, no articles`;

  const response = await bedrock.send(new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  }));

  const body = JSON.parse(new TextDecoder().decode(response.body));
  const content = body.content?.[0]?.text;

  if (!content) {
    throw new BedrockError("Empty response from Bedrock");
  }

  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new BedrockError("No JSON found in Bedrock response");
  }

  return JSON.parse(jsonMatch[0]) as ClassificationResult;
}
