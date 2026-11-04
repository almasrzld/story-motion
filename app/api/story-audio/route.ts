import { videoServerConfig } from "@/constants/server-config";
import type { DialogueLine, Speaker } from "@/features/Base/video-types";

type AudioRequest = {
  dialogue?: unknown;
};

type SynthesizedLine = DialogueLine & { audio: string };

function parseApprovedDialogue(value: unknown): DialogueLine[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Setujui dialog yang tidak kosong sebelum membuat suara.");
  }

  return value.map((line, index) => {
    if (!line || typeof line !== "object") {
      throw new Error(`Baris dialog ke-${index + 1} tidak valid.`);
    }

    const { speaker, text, scene } = line as Record<string, unknown>;
    if (
      (speaker !== "male" && speaker !== "female") ||
      typeof text !== "string" ||
      !text.trim() ||
      typeof scene !== "string" ||
      !scene.trim()
    ) {
      throw new Error(`Baris dialog ke-${index + 1} tidak lengkap.`);
    }

    return { speaker: speaker as Speaker, text: text.trim(), scene: scene.trim() };
  });
}

export async function POST(request: Request) {
  let payload: AudioRequest;
  try {
    payload = (await request.json()) as AudioRequest;
  } catch {
    return Response.json({ error: "Isi permintaan tidak dapat dibaca." }, { status: 400 });
  }

  let dialogue: DialogueLine[];
  try {
    dialogue = parseApprovedDialogue(payload.dialogue);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dialog tidak valid.";
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    const endpoint = videoServerConfig.supertonicTtsUrl();
    const language = videoServerConfig.supertonicLanguage();
    const maleVoice = videoServerConfig.supertonicMaleVoice();
    const femaleVoice = videoServerConfig.supertonicFemaleVoice();
    const synthesized: SynthesizedLine[] = [];

    for (const line of dialogue) {
      const voice = line.speaker === "male" ? maleVoice : femaleVoice;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: line.text,
          voice,
          lang: language,
          response_format: "wav",
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        const providerMessage = await response.text();
        throw new Error(`Supertonic lokal gagal (${response.status}): ${providerMessage}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("audio/wav")) {
        throw new Error("Supertonic lokal tidak mengembalikan audio WAV.");
      }

      const audio = Buffer.from(await response.arrayBuffer()).toString("base64");
      if (!audio) throw new Error("Supertonic lokal mengembalikan audio kosong.");
      synthesized.push({ ...line, audio });
    }

    return Response.json({ dialogue: synthesized });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat membuat suara.";
    const status = message.startsWith("Konfigurasi server") ? 503 : 502;
    return Response.json({ error: message }, { status });
  }
}
