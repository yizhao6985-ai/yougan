/**
 * 阿里百炼非实时语音识别（Fun-ASR / Paraformer）。
 * @see https://help.aliyun.com/zh/model-studio/non-realtime-speech-recognition-user-guide
 */
import { env } from "#agent/env.js";

const TRANSCRIPTION_PATH = "/services/audio/asr/transcription";
const TASK_POLL_INTERVAL_MS = 2_000;
const TASK_TIMEOUT_MS = 120_000;

type TranscriptionSubmitResponse = {
  request_id?: string;
  code?: string;
  message?: string;
  output?: {
    task_id?: string;
    task_status?: string;
  };
};

type TranscriptionTaskResponse = {
  output?: {
    task_status?: string;
    results?: Array<{
      subtask_status?: string;
      transcription_url?: string;
      message?: string;
    }>;
    result?: {
      transcription_url?: string;
    };
    message?: string;
  };
  message?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractTranscriptText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;

  const transcripts = root.transcripts;
  if (Array.isArray(transcripts)) {
    const parts = transcripts
      .map((item) => {
        if (!item || typeof item !== "object") return "";
        const text = (item as { text?: string }).text;
        return typeof text === "string" ? text.trim() : "";
      })
      .filter(Boolean);
    if (parts.length) return parts.join("\n");
  }

  const text = root.text;
  if (typeof text === "string" && text.trim()) return text.trim();

  const result = root.result;
  if (result && typeof result === "object") {
    const nested = (result as { text?: string }).text;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }

  return null;
}

async function downloadTranscription(url: string): Promise<string | null> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`DASHSCOPE_ASR_RESULT_FETCH_FAILED: ${response.status}`);
  }
  const payload = (await response.json()) as unknown;
  return extractTranscriptText(payload);
}

async function pollTranscriptionTask(taskId: string): Promise<string> {
  const started = Date.now();

  while (Date.now() - started < TASK_TIMEOUT_MS) {
    const response = await fetch(`${env.dashscopeApiBaseUrl}/tasks/${taskId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${env.dashscopeApiKey}`,
        "X-DashScope-Async": "enable",
      },
    });

    const payload = (await response.json()) as TranscriptionTaskResponse;
    if (!response.ok) {
      throw new Error(
        payload.message ??
          `DASHSCOPE_ASR_TASK_QUERY_FAILED: ${response.status}`,
      );
    }

    const status = payload.output?.task_status?.toUpperCase();
    if (status === "SUCCEEDED") {
      const resultUrl =
        payload.output?.results?.find(
          (item) => item.subtask_status?.toUpperCase() === "SUCCEEDED",
        )?.transcription_url ?? payload.output?.result?.transcription_url;

      if (!resultUrl) {
        throw new Error("DASHSCOPE_ASR_MISSING_TRANSCRIPTION_URL");
      }

      const transcript = await downloadTranscription(resultUrl);
      if (!transcript) {
        throw new Error("DASHSCOPE_ASR_EMPTY_TRANSCRIPT");
      }
      return transcript;
    }

    if (status === "FAILED" || status === "UNKNOWN") {
      throw new Error(
        payload.output?.message ??
          payload.message ??
          "DASHSCOPE_ASR_TASK_FAILED",
      );
    }

    await sleep(TASK_POLL_INTERVAL_MS);
  }

  throw new Error("DASHSCOPE_ASR_TASK_TIMEOUT");
}

export async function transcribeRemoteMedia(fileUrl: string): Promise<string> {
  if (!env.dashscopeApiKey) {
    throw new Error("DASHSCOPE_API_KEY_MISSING");
  }

  const response = await fetch(
    `${env.dashscopeApiBaseUrl}${TRANSCRIPTION_PATH}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.dashscopeApiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable",
      },
      body: JSON.stringify({
        model: env.llmModelAsr,
        input: {
          file_urls: [fileUrl],
        },
        parameters: {
          channel_id: [0],
          language_hints: ["zh", "en"],
        },
      }),
    },
  );

  const payload = (await response.json()) as TranscriptionSubmitResponse;
  if (!response.ok) {
    throw new Error(
      payload.message ??
        `DASHSCOPE_ASR_SUBMIT_FAILED: ${response.status}`,
    );
  }

  const taskId = payload.output?.task_id;
  if (!taskId) {
    throw new Error(payload.message ?? "DASHSCOPE_ASR_MISSING_TASK_ID");
  }

  return pollTranscriptionTask(taskId);
}
