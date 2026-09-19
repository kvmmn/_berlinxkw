import "server-only";

import OpenAI from "openai";
import { z } from "zod";
import { parseDailySnapshots, parseWeekMetrics } from "./metrics-parse";
import type { DailySnapshot, WeekMetrics } from "./types";

const ExtractedSchema = z.object({
  metrics: z.object({
    followers: z.number(),
    reach: z.number(),
    posts: z.number(),
    engagementRate: z.number(),
    saves: z.number(),
    profileVisits: z.number(),
  }),
  dailySnapshots: z
    .array(
      z.object({
        date: z.string(),
        followers: z.number(),
        reach: z.number(),
        engagementRate: z.number(),
      }),
    )
    .optional(),
  summary: z.string().optional(),
});

export type MetricsImportResult = {
  metrics: WeekMetrics;
  dailySnapshots?: DailySnapshot[];
  summary?: string;
};

const SYSTEM_PROMPT = `You extract Instagram Professional account weekly metrics for @berlinxkw from pasted Insights text or screenshots.
Input may be Persian (fa) or English. Map labels like followers/دنبال‌کننده, reach/بازدید, engagement/تعامل, saves/ذخیره, profile visits/بازدید پروفایل.
Return JSON only matching the schema. Use 0 for unknown fields. engagementRate is a percentage number (e.g. 4.2 for 4.2%).
Dates in dailySnapshots as ISO YYYY-MM-DD when visible.`;

export async function extractMetricsFromInsights(input: {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
}): Promise<MetricsImportResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const text = input.text?.trim() ?? "";
  const hasImage = Boolean(input.imageBase64?.trim());
  if (!text && !hasImage) {
    throw new Error("Paste Insights text or upload a screenshot");
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini";

  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
  if (text) {
    userContent.push({
      type: "text",
      text: `Extract week metrics from this Instagram Insights paste:\n\n${text}`,
    });
  }
  if (hasImage) {
    const mime = input.mimeType?.trim() || "image/png";
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${mime};base64,${input.imageBase64!.trim()}`,
      },
    });
    if (!text) {
      userContent.unshift({
        type: "text",
        text: "Extract week metrics from this Instagram Insights screenshot.",
      });
    }
  }

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Model returned empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Could not parse model JSON");
  }

  const validated = ExtractedSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error("Extracted metrics did not match expected shape");
  }

  const metrics = parseWeekMetrics(validated.data.metrics);
  if (!metrics) {
    throw new Error("Invalid metrics numbers from extraction");
  }

  const dailySnapshots = parseDailySnapshots(validated.data.dailySnapshots);
  const summary = validated.data.summary?.trim();

  return {
    metrics,
    dailySnapshots: dailySnapshots?.length ? dailySnapshots : undefined,
    summary: summary || undefined,
  };
}
