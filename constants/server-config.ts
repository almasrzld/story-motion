function requiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Konfigurasi server ${name} belum diisi.`);
  }

  return value;
}

export const videoServerConfig = {
  ollamaChatUrl: () => requiredEnvironmentValue("OLLAMA_CHAT_URL"),
  ollamaModel: () => requiredEnvironmentValue("OLLAMA_MODEL"),
  supertonicTtsUrl: () => requiredEnvironmentValue("SUPERTONIC_TTS_URL"),
  supertonicLanguage: () => requiredEnvironmentValue("SUPERTONIC_LANGUAGE"),
  supertonicMaleVoice: () => requiredEnvironmentValue("SUPERTONIC_MALE_VOICE"),
  supertonicFemaleVoice: () => requiredEnvironmentValue("SUPERTONIC_FEMALE_VOICE"),
} as const;
