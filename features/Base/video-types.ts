export type Speaker = "male" | "female";

export type DialogueLine = {
  speaker: Speaker;
  text: string;
  scene: string;
};

export type NarratedLine = DialogueLine & {
  audio: string;
  durationInFrames: number;
};

export type StoryInput = {
  maleCharacter: string;
  femaleCharacter: string;
  story: string;
};
