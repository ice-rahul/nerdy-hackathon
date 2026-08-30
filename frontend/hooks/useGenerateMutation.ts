import { useMutation } from "@tanstack/react-query";
import { generate, type ChatMessage } from "@/lib/api";

export function useGenerateMutation() {
  return useMutation({
    mutationFn: (messages: ChatMessage[]) => generate({ messages }),
  });
}
