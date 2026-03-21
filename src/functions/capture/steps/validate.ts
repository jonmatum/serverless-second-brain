import { validateCaptureRequest } from "../../../shared/validation.js";
import type { CaptureRequest } from "../../../shared/types.js";

interface ValidateOutput {
  input: CaptureRequest;
}

export const handler = async (event: string | Record<string, unknown>): Promise<ValidateOutput> => {
  const parsed = typeof event === "string" ? JSON.parse(event) : event;
  const input = validateCaptureRequest(parsed);
  return { input };
};
