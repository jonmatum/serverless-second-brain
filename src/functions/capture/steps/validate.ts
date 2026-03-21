import { validateCaptureRequest } from "../../../shared/validation.js";
import { listNodeSlugs } from "../../../shared/dynamodb.js";
import { ValidationError } from "../../../shared/errors.js";
import type { CaptureRequest } from "../../../shared/types.js";

interface ValidateInput {
  body: string;
}

interface ValidateOutput {
  input: CaptureRequest;
  existingSlugs: string[];
}

export const handler = async (event: ValidateInput): Promise<ValidateOutput> => {
  const parsed = JSON.parse(event.body);
  const input = validateCaptureRequest(parsed);
  const existingSlugs = await listNodeSlugs();
  return { input, existingSlugs };
};
