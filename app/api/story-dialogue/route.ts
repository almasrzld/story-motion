import { videoServerConfig } from "@/constants/server-config";
import type { DialogueLine, Speaker } from "@/features/Base/video-types";

type StoryRequest = {
  maleCharacter?: unknown;
  femaleCharacter?: unknown;
  story?: unknown;
};

const dialogueSchema = {
  type: "object",
  properties: {
    dialogue: {
      type: "array",
      items: {
        type: "object",
        properties: {
          speaker: { type: "string", enum: ["male", "female"] },
          text: { type: "string" },
          scene: { type: "string" },
        },
        required: ["speaker", "text", "scene"],
      },
    },
  },
  required: ["dialogue"],
} as const;

function parseDialogue(value: unknown): DialogueLine[] {
  if (!value || typeof value !== "object" || !("dialogue" in value)) {
    throw new Error("Model tidak mengembalikan struktur dialog yang diminta.");
  }

  const dialogue = value.dialogue;

  if (!Array.isArray(dialogue) || dialogue.length === 0) {
    throw new Error("Model tidak menghasilkan baris dialog.");
  }

  return dialogue.map((line, index) => {
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
  let payload: StoryRequest;

  try {
    payload = (await request.json()) as StoryRequest;
  } catch {
    return Response.json({ error: "Isi permintaan tidak dapat dibaca." }, { status: 400 });
  }

  if (
    typeof payload.maleCharacter !== "string" ||
    typeof payload.femaleCharacter !== "string" ||
    typeof payload.story !== "string" ||
    !payload.maleCharacter.trim() ||
    !payload.femaleCharacter.trim() ||
    !payload.story.trim()
  ) {
    return Response.json({ error: "Nama kedua tokoh dan cerita wajib diisi." }, { status: 400 });
  }

  try {
    const ollamaUrl = videoServerConfig.ollamaChatUrl();
    let response: Response;

    try {
      response = await fetch(ollamaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: videoServerConfig.ollamaModel(),
          stream: false,
          format: dialogueSchema,
          messages: [
            {
              role: "system",
              content:
                "Tulis draf dialog dokumenter romantis dalam Bahasa Indonesia untuk dua tokoh. Gunakan hanya fakta yang tertulis di cerita sumber. Jangan menambah peristiwa, tempat, tindakan, atau percakapan yang tidak ada di sumber. Bagi cerita menjadi urutan adegan yang mewakili momen faktual; tiap baris berisi satu kalimat singkat untuk narasi/dialog dan deskripsi visual yang hanya memakai fakta dari sumber. Pembicara hanya male atau female. Balas sesuai JSON schema.",
            },
            {
              role: "user",
              content: JSON.stringify({
                maleCharacter: payload.maleCharacter.trim(),
                femaleCharacter: payload.femaleCharacter.trim(),
                story: payload.story.trim(),
              }),
            },
          ],
        }),
        cache: "no-store",
      });
    } catch (error) {
      const ollamaHost = new URL(ollamaUrl).host;
      const cause = error instanceof Error && "cause" in error ? error.cause : undefined;
      const causeCode = cause && typeof cause === "object" && "code" in cause ? cause.code : undefined;
      const details = typeof causeCode === "string" ? ` (${causeCode})` : "";

      return Response.json(
        { error: `Tidak dapat terhubung ke Ollama di ${ollamaHost}${details}. Pastikan service Ollama berjalan dan dapat diakses dari server Next.js.` },
        { status: 503 },
      );
    }

    if (!response.ok) {
      const providerMessage = await response.text();
      return Response.json(
        { error: `Ollama gagal menyusun dialog (${response.status}): ${providerMessage}` },
        { status: 502 },
      );
    }

    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || !("message" in result)) {
      throw new Error("Respons Ollama tidak memiliki pesan dialog.");
    }

    const message = result.message;
    if (!message || typeof message !== "object" || !("content" in message)) {
      throw new Error("Respons Ollama tidak memiliki isi dialog.");
    }

    const content = message.content;
    if (typeof content !== "string") {
      throw new Error("Isi dialog dari Ollama bukan teks JSON.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Ollama mengembalikan JSON dialog yang tidak valid.");
    }

    return Response.json({ dialogue: parseDialogue(parsed) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat menyusun dialog.";
    const status = message.startsWith("Konfigurasi server") ? 503 : 502;
    return Response.json({ error: message }, { status });
  }
}
