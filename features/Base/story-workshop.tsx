"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Player } from "@remotion/player";
import { Download, LoaderCircle, Mic2, Plus, Sparkles, Trash2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryFilm } from "@/features/Base/story-film";
import type { DialogueLine, NarratedLine, Speaker, StoryInput } from "@/features/Base/video-types";
import { videoConfig } from "@/constants/config";

type Stage = "story" | "dialogue" | "video";

async function readError(response: Response) {
  const result: unknown = await response.json().catch(() => undefined);
  if (result && typeof result === "object" && "error" in result && typeof result.error === "string") {
    return result.error;
  }
  return `Permintaan gagal (${response.status}).`;
}

async function getAudioDurationInFrames(audioContent: string) {
  const context = new AudioContext();

  try {
    const binary = atob(audioContent);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    const audioBuffer = await context.decodeAudioData(bytes.buffer);
    return Math.ceil(audioBuffer.duration * videoConfig.fps);
  } finally {
    await context.close();
  }
}

export function StoryWorkshop() {
  const [story, setStory] = useState<StoryInput>({ maleCharacter: "", femaleCharacter: "", story: "" });
  const [dialogue, setDialogue] = useState<DialogueLine[]>([]);
  const [narratedLines, setNarratedLines] = useState<NarratedLine[]>([]);
  const [stage, setStage] = useState<Stage>("story");
  const [busy, setBusy] = useState<"dialogue" | "audio" | "render" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<number | null>(null);

  const durationInFrames = useMemo(
    () => narratedLines.reduce((total, line) => total + line.durationInFrames, 0),
    [narratedLines],
  );

  function updateStory(field: keyof StoryInput, value: string) {
    setStory((current) => ({ ...current, [field]: value }));
  }

  async function generateDialogue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy("dialogue");

    try {
      const response = await fetch("/api/story-dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(story),
      });

      if (!response.ok) throw new Error(await readError(response));
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("dialogue" in result) || !Array.isArray(result.dialogue)) {
        throw new Error("Respons draf dialog tidak valid.");
      }

      const nextDialogue = result.dialogue as DialogueLine[];
      if (!nextDialogue.length) throw new Error("Draf dialog kosong.");
      setDialogue(nextDialogue);
      setNarratedLines([]);
      setStage("dialogue");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal menyusun dialog.");
    } finally {
      setBusy(null);
    }
  }

  async function approveAndGenerateAudio() {
    setError(null);
    setBusy("audio");

    try {
      const response = await fetch("/api/story-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dialogue }),
      });

      if (!response.ok) throw new Error(await readError(response));
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("dialogue" in result) || !Array.isArray(result.dialogue)) {
        throw new Error("Respons audio tidak valid.");
      }

      const audioLines = result.dialogue as Array<DialogueLine & { audio: string }>;
      if (audioLines.length !== dialogue.length) {
        throw new Error("Jumlah audio tidak sama dengan dialog yang disetujui.");
      }

      const completeLines = await Promise.all(audioLines.map(async (line) => ({
        ...line,
        durationInFrames: await getAudioDurationInFrames(line.audio),
      })));

      setNarratedLines(completeLines);
      setStage("video");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal membuat suara.");
    } finally {
      setBusy(null);
    }
  }

  function updateDialogue(index: number, key: keyof DialogueLine, value: string) {
    setDialogue((current) => current.map((line, lineIndex) =>
      lineIndex === index ? { ...line, [key]: value } : line,
    ));
  }

  function removeDialogueLine(index: number) {
    setDialogue((current) => current.filter((_, lineIndex) => lineIndex !== index));
  }

  function addDialogueLine(speaker: Speaker) {
    setDialogue((current) => [...current, { speaker, text: "", scene: "" }]);
  }

  async function renderVideo() {
    setError(null);
    setRenderProgress(0);
    setBusy("render");

    try {
      if (!("VideoEncoder" in window)) {
        throw new Error("Browser ini belum mendukung ekspor video WebCodecs. Buka aplikasi dengan Chrome versi terbaru.");
      }

      const { renderMediaOnWeb } = await import("@remotion/web-renderer");
      const compositionProps = {
        maleCharacter: story.maleCharacter,
        femaleCharacter: story.femaleCharacter,
        lines: narratedLines,
      };
      const output = await renderMediaOnWeb({
        composition: {
          id: "story-film",
          component: StoryFilm,
          width: videoConfig.width,
          height: videoConfig.height,
          fps: videoConfig.fps,
          durationInFrames,
          defaultProps: compositionProps,
        },
        inputProps: compositionProps,
        container: "mp4",
        videoCodec: "h264",
        audioCodec: "aac",
        onProgress: ({ progress }) => setRenderProgress(progress),
      });

      const blob = await output.getBlob();
      if (blob.type !== "video/mp4" || blob.size === 0) {
        throw new Error("Renderer tidak menghasilkan file MP4 yang valid.");
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cerita-kita.mp4";
      link.click();
      URL.revokeObjectURL(url);
      setRenderProgress(1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gagal merender video.");
    } finally {
      setBusy(null);
    }
  }

  const steps: Array<{ id: Stage; label: string }> = [
    { id: "story", label: "Cerita" },
    { id: "dialogue", label: "Dialog" },
    { id: "video", label: "Video" },
  ];

  return (
    <main className="min-h-svh bg-[#f7f6fa] text-[#24212b]">
      <div className="mx-auto flex min-h-svh max-w-6xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between border-b border-[#e9e6ee] pb-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-[#282431] text-white"><WandSparkles aria-hidden="true" size={19} /></span>
            <span><span className="block text-sm font-semibold">Studio Cerita</span><span className="block text-xs text-[#77727f]">Cerita menjadi animasi</span></span>
          </div>
          <span className="rounded-full border border-[#e5dff0] bg-white px-3 py-1.5 text-xs font-medium text-[#665486]">Anime · 9:16</span>
        </header>

        <nav aria-label="Tahapan pembuatan video" className="flex gap-2 py-5">
          {steps.map((step, index) => {
            const active = step.id === stage;
            const done = steps.findIndex((item) => item.id === stage) > index;
            return <div key={step.id} className={`rounded-full px-4 py-2 text-sm ${active ? "bg-[#302b39] text-white" : done ? "bg-[#e9e2f5] text-[#58427d]" : "bg-white text-[#928d98]"}`}>{index + 1}. {step.label}</div>;
          })}
        </nav>

        {error ? <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</div> : null}

        {stage === "story" ? (
          <section className="mx-auto w-full max-w-3xl py-6">
            <p className="mb-2 text-sm font-medium text-[#755cb0]">Langkah 1 · Cerita</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Mulai dari cerita kalian.</h1>
            <p className="mt-3 text-sm leading-6 text-[#77727f]">Draf dialog dibuat di Ollama yang berjalan di komputer Anda. Cerita tidak dikirim ke penyedia AI cloud.</p>

            <form onSubmit={generateDialogue} className="mt-7 space-y-5 rounded-3xl border border-[#e9e6ee] bg-white p-5 shadow-sm sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block"><span className="mb-2 block text-sm font-medium">Nama tokoh pria</span><input required value={story.maleCharacter} onChange={(event) => updateStory("maleCharacter", event.target.value)} className="h-11 w-full rounded-xl border border-[#e5e1e9] px-3.5 text-sm outline-none focus:border-[#9b83ce] focus:ring-4 focus:ring-[#eee8fa]" /></label>
                <label className="block"><span className="mb-2 block text-sm font-medium">Nama tokoh wanita</span><input required value={story.femaleCharacter} onChange={(event) => updateStory("femaleCharacter", event.target.value)} className="h-11 w-full rounded-xl border border-[#e5e1e9] px-3.5 text-sm outline-none focus:border-[#9b83ce] focus:ring-4 focus:ring-[#eee8fa]" /></label>
              </div>
              <label className="block"><span className="mb-2 block text-sm font-medium">Cerita kalian</span><textarea required rows={12} value={story.story} onChange={(event) => updateStory("story", event.target.value)} className="w-full resize-y rounded-xl border border-[#e5e1e9] px-3.5 py-3 text-sm leading-6 outline-none focus:border-[#9b83ce] focus:ring-4 focus:ring-[#eee8fa]" /><span className="mt-2 block text-xs text-[#928d98]">{story.story.length} karakter · tidak disimpan setelah halaman ditutup</span></label>
              <div className="flex flex-col gap-4 border-t border-[#f0edf2] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-md text-xs leading-5 text-[#827d89]">Cerita dikirim ke Ollama lokal untuk membuat draf. Anda dapat mengedit dan menyetujui setiap baris sebelum audio dibuat.</p>
                <Button disabled={busy !== null} type="submit" className="h-11 gap-2 rounded-xl bg-[#302b39] px-5 text-white hover:bg-[#453c54]">
                  {busy === "dialogue" ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />} Susun draf dialog
                </Button>
              </div>
            </form>
          </section>
        ) : null}

        {stage === "dialogue" ? (
          <section className="mx-auto w-full max-w-3xl py-6">
            <p className="mb-2 text-sm font-medium text-[#755cb0]">Langkah 2 · Tinjau dialog</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Periksa setiap baris dialog.</h1>
            <p className="mt-3 text-sm leading-6 text-[#77727f]">Audio hanya dibuat setelah Anda menyetujui draf. Ubah atau hapus bagian yang tidak sesuai cerita.</p>

            <div className="mt-7 space-y-4">
              {dialogue.map((line, index) => (
                <article key={index} className="rounded-2xl border border-[#e9e6ee] bg-white p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-3 text-sm font-medium"><span className="grid size-9 place-items-center rounded-xl bg-[#f0edf6] text-[#715aa0]"><Mic2 size={17} /></span><span className="sr-only">Pembicara baris {index + 1}</span><select value={line.speaker} onChange={(event) => updateDialogue(index, "speaker", event.target.value as Speaker)} className="rounded-lg border border-[#e5e1e9] bg-white px-3 py-2"><option value="male">{story.maleCharacter}</option><option value="female">{story.femaleCharacter}</option></select></label>
                    <Button type="button" variant="ghost" aria-label={`Hapus baris ${index + 1}`} onClick={() => removeDialogueLine(index)} className="text-[#918a98]"><Trash2 size={17} /></Button>
                  </div>
                  <label className="mb-3 block"><span className="mb-1.5 block text-xs font-medium text-[#827d89]">Adegan</span><input value={line.scene} onChange={(event) => updateDialogue(index, "scene", event.target.value)} className="h-10 w-full rounded-xl border border-[#e5e1e9] px-3 text-sm outline-none focus:border-[#9b83ce]" /></label>
                  <label className="block"><span className="mb-1.5 block text-xs font-medium text-[#827d89]">Dialog</span><textarea rows={2} value={line.text} onChange={(event) => updateDialogue(index, "text", event.target.value)} className="w-full resize-y rounded-xl border border-[#e5e1e9] px-3 py-2 text-sm leading-6 outline-none focus:border-[#9b83ce]" /></label>
                </article>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => addDialogueLine("male")} className="gap-2 rounded-xl border-dashed"><Plus size={16} />Tambah suara {story.maleCharacter}</Button>
              <Button type="button" variant="outline" onClick={() => addDialogueLine("female")} className="gap-2 rounded-xl border-dashed"><Plus size={16} />Tambah suara {story.femaleCharacter}</Button>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <p className="text-sm leading-6 text-[#514d58]">Dialog yang disetujui akan diubah menjadi suara oleh Supertonic yang berjalan lokal di komputer ini. Tidak perlu API key atau billing cloud.</p>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setStage("story")}>Kembali ke cerita</Button>
              <Button type="button" disabled={busy !== null || !dialogue.length || dialogue.some((line) => !line.text.trim() || !line.scene.trim())} onClick={approveAndGenerateAudio} className="h-11 gap-2 rounded-xl bg-[#302b39] px-5 text-white hover:bg-[#453c54]">
                {busy === "audio" ? <LoaderCircle className="animate-spin" size={16} /> : <Mic2 size={16} />} Setujui dialog & buat suara
              </Button>
            </div>
          </section>
        ) : null}

        {stage === "video" ? (
          <section className="mx-auto w-full max-w-4xl py-6">
            <p className="mb-2 text-sm font-medium text-[#755cb0]">Langkah 3 · Preview & ekspor</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Preview cerita kalian.</h1>
            <p className="mt-3 text-sm leading-6 text-[#77727f]">Audio asli dari TTS menentukan durasi tiap adegan dan subtitle.</p>

            <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(260px,360px)_minmax(0,1fr)] lg:items-start">
              <div className="overflow-hidden rounded-3xl border border-[#302b39] bg-[#111827] shadow-xl">
                <Player
                  component={StoryFilm}
                  inputProps={{ maleCharacter: story.maleCharacter, femaleCharacter: story.femaleCharacter, lines: narratedLines }}
                  durationInFrames={durationInFrames}
                  compositionWidth={videoConfig.width}
                  compositionHeight={videoConfig.height}
                  fps={videoConfig.fps}
                  controls
                  style={{ width: "100%", aspectRatio: `${videoConfig.width} / ${videoConfig.height}` }}
                />
              </div>
              <div className="rounded-3xl border border-[#e9e6ee] bg-white p-5 sm:p-7">
                <h2 className="text-lg font-semibold">Ekspor video</h2>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-[#827d89]">Format</dt><dd className="font-medium">MP4 · H.264</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-[#827d89]">Resolusi</dt><dd className="font-medium">{videoConfig.width} × {videoConfig.height}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-[#827d89]">Durasi</dt><dd className="font-medium">{Math.floor(durationInFrames / videoConfig.fps)} detik</dd></div>
                </dl>
                <p className="mt-5 text-xs leading-5 text-[#827d89]">Ekspor berlangsung di browser dan membutuhkan Chrome dengan dukungan WebCodecs. Cerita serta audio tidak dikirim ke layanan render.</p>
                <Button type="button" disabled={busy !== null} onClick={renderVideo} className="mt-6 h-11 w-full gap-2 rounded-xl bg-[#302b39] text-white hover:bg-[#453c54]">
                  {busy === "render" ? <LoaderCircle className="animate-spin" size={16} /> : <Download size={16} />}
                  {busy === "render" ? `Merender ${Math.round((renderProgress ?? 0) * 100)}%` : "Unduh MP4"}
                </Button>
                {renderProgress !== null && busy === "render" ? <progress value={renderProgress} max={1} className="mt-3 w-full" aria-label="Progres render" /> : null}
                <Button type="button" variant="ghost" onClick={() => setStage("dialogue")} className="mt-2 w-full">Kembali mengedit dialog</Button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
