import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import type { NarratedLine, Speaker } from "./video-types";

export type StoryFilmProps = {
  maleCharacter: string;
  femaleCharacter: string;
  lines: NarratedLine[];
};

const scenePalettes = [
  { sky: "#17213e", glow: "#f4b2a6", accent: "#ffdc9e" },
  { sky: "#344253", glow: "#f8c7ad", accent: "#fee8bd" },
  { sky: "#263f50", glow: "#e7b0a7", accent: "#f8d4ad" },
  { sky: "#47384f", glow: "#f1afa9", accent: "#f8d89a" },
];

function CharacterPortrait({ speaker, name, isSpeaking }: { speaker: Speaker; name: string; isSpeaking: boolean }) {
  const frame = useCurrentFrame();
  const isFemale = speaker === "female";
  const hair = isFemale ? "#33243d" : "#202b3f";
  const clothing = isFemale ? "#b96f82" : "#657ca8";
  const bob = Math.sin(frame / 8 + (isFemale ? Math.PI : 0)) * 9;
  const sway = Math.sin(frame / 20 + (isFemale ? Math.PI : 0)) * 1.4;
  const mouthOpen = isSpeaking && frame % 10 < 5;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, transform: `translateY(${bob}px) rotate(${sway}deg)`, transformOrigin: "center bottom" }}>
      <svg width="400" height="500" viewBox="0 0 400 500" role="img" aria-label={name}>
        <ellipse cx="200" cy="465" rx="145" ry="22" fill="rgba(5,10,24,.28)" />
        <path d="M64 458c10-105 58-154 136-154s126 49 136 154v12H64z" fill={clothing} />
        <path d="M119 143c0-77 35-114 83-114 65 0 92 45 85 130l-13 98c-9 57-39 89-76 89s-69-32-77-90z" fill={hair} />
        <path d="M127 174c0-65 30-97 73-97s76 32 76 97v61c0 70-34 111-76 111s-73-42-73-111z" fill="#f1c2a7" />
        <path d={isFemale ? "M119 180c-5-103 44-151 99-151 68 0 103 50 91 156l-25 29-8-89c-42 7-88-2-120-23-7 29-16 51-30 78z" : "M119 180c-4-104 45-151 96-151 64 0 94 45 88 140l-25-12-9-48c-41 15-82 13-121-9-7 26-16 51-29 80z"} fill={hair} />
        <path d="M150 206c11-8 25-8 36 0" fill="none" stroke="#49343b" strokeWidth="7" strokeLinecap="round" />
        <path d="M218 206c11-8 25-8 36 0" fill="none" stroke="#49343b" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="169" cy="230" rx="10" ry="15" fill="#46537e" />
        <ellipse cx="237" cy="230" rx="10" ry="15" fill="#46537e" />
        <circle cx="172" cy="225" r="3" fill="white" />
        <circle cx="240" cy="225" r="3" fill="white" />
        {mouthOpen ? (
          <ellipse cx="201" cy="280" rx="9" ry="12" fill="#8e4657" />
        ) : (
          <path d="M188 278c8 7 18 7 26 0" fill="none" stroke="#ae6870" strokeWidth="5" strokeLinecap="round" />
        )}
        <path d="M129 326c-22 30-39 75-45 132m187-132c24 30 42 74 48 132" fill="none" stroke="#f1c2a7" strokeWidth="22" strokeLinecap="round" />
        <path d="M171 308l29 40 29-40" fill="#f4e7df" />
      </svg>
      <span style={{ color: "#fff4e4", fontSize: 27, fontWeight: 700, letterSpacing: 1 }}>{name}</span>
    </div>
  );
}

function StoryScene({
  line,
  maleCharacter,
  femaleCharacter,
  sceneIndex,
}: {
  line: NarratedLine;
  maleCharacter: string;
  femaleCharacter: string;
  sceneIndex: number;
}) {
  const frame = useCurrentFrame();
  const palette = scenePalettes[sceneIndex % scenePalettes.length];
  const enter = interpolate(frame, [0, 24], [40, 0], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, line.durationInFrames], [1.04, 1.12]);

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        color: "#fff8ee",
        background: `radial-gradient(ellipse at 50% 24%, ${palette.glow}55 0%, transparent 34%), linear-gradient(180deg, ${palette.sky} 0%, #131a2d 70%, #0e1425 100%)`,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ position: "absolute", inset: -40, transform: `translateY(${enter}px) scale(${scale})` }}>
        <div style={{ position: "absolute", top: 185, left: 0, right: 0, height: 4, background: `${palette.accent}45` }} />
        <div style={{ position: "absolute", top: 760, left: -60, width: 1200, height: 500, borderRadius: "50% 50% 0 0", background: "#1c2940" }} />
        <div style={{ position: "absolute", top: 970, left: -100, width: 1300, height: 600, borderRadius: "50% 50% 0 0", background: "#111b30" }} />
        {Array.from({ length: 12 }, (_, index) => (
          <span
            key={index}
            style={{
              position: "absolute",
              top: 110 + ((index * 173) % 520),
              left: 45 + ((index * 127) % 980),
              width: index % 3 === 0 ? 8 : 5,
              height: index % 3 === 0 ? 8 : 5,
              borderRadius: "50%",
              background: palette.accent,
              opacity: 0.35 + ((index % 4) * 0.12) + (Math.sin(frame / 8 + index) + 1) * 0.12,
              transform: `translateY(${(frame * (index % 3 + 1) * 0.35) % 24}px)`,
            }}
          />
        ))}
      </div>

      <div style={{ position: "absolute", top: 155, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <span style={{ height: 1, width: 70, background: `${palette.accent}a0` }} />
        <span style={{ fontSize: 24, letterSpacing: 6, color: "#f6d7b1", textTransform: "uppercase" }}>Sebuah kisah</span>
        <span style={{ height: 1, width: 70, background: `${palette.accent}a0` }} />
      </div>

      <div style={{ position: "absolute", top: 350, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 4 }}>
        <CharacterPortrait speaker="male" name={maleCharacter} isSpeaking={line.speaker === "male"} />
        <CharacterPortrait speaker="female" name={femaleCharacter} isSpeaking={line.speaker === "female"} />
      </div>

      <div style={{ position: "absolute", left: 80, right: 80, bottom: 155, padding: "34px 38px", border: "1px solid #ffffff45", borderRadius: 28, background: "rgba(12, 17, 31, .78)", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
        <p style={{ margin: 0, color: "#f4c890", fontSize: 22, letterSpacing: 3, textTransform: "uppercase" }}>{line.scene}</p>
        <p style={{ margin: "20px 0 0", fontSize: 38, lineHeight: 1.35, fontWeight: 600, textAlign: "center", textShadow: "0 2px 16px #0008" }}>{line.text}</p>
      </div>
      <div style={{ position: "absolute", bottom: 54, left: 0, right: 0, textAlign: "center", color: "#f1d8c5", fontSize: 20, letterSpacing: 7 }}>KISAH YANG DIRANGKAI BERSAMA</div>
      <Audio src={`data:audio/wav;base64,${line.audio}`} />
    </AbsoluteFill>
  );
}

function sequenceStartFrame(lines: NarratedLine[], index: number) {
  return lines.slice(0, index).reduce((total, line) => total + line.durationInFrames, 0);
}

export function StoryFilm({ maleCharacter, femaleCharacter, lines }: Partial<StoryFilmProps>) {
  if (!maleCharacter || !femaleCharacter || !lines?.length) {
    return <AbsoluteFill style={{ backgroundColor: "#101727" }} />;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#101727" }}>
      {lines.map((line, index) => {
        return (
          <Sequence key={`${index}-${line.speaker}`} from={sequenceStartFrame(lines, index)} durationInFrames={line.durationInFrames}>
            <StoryScene
              line={line}
              maleCharacter={maleCharacter}
              femaleCharacter={femaleCharacter}
              sceneIndex={index}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
