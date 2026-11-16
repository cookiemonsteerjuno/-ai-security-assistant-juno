export function getChatSession(_prompt: string) {
  return {
    sendMessage: async ({ message }: { message: string }) => ({
      text: `Security advisory: ${message}`,
    }),
  };
}

export async function generateSpeech(text: string) {
  return text ? new Uint8Array(Buffer.from(text)).buffer : null;
}

export async function decodeAndPlayAudio(_audio: ArrayBuffer | null) {
  return true;
}
