import { classify } from "../../../shared/bedrock.js";
import { generateSlug } from "../../../shared/validation.js";
import { getNode, listNodeSlugs } from "../../../shared/dynamodb.js";
import { DuplicateError } from "../../../shared/errors.js";
import type { CaptureRequest, ClassificationResult } from "../../../shared/types.js";

interface ClassifyInput {
  input: CaptureRequest;
}

interface ClassifyOutput {
  input: CaptureRequest;
  metadata: ClassificationResult;
  slug: string;
}

export const handler = async (event: ClassifyInput): Promise<ClassifyOutput> => {
  const { input } = event;
  const recentSlugs = await listNodeSlugs(20);
  const metadata = await classify(input.text, recentSlugs, input.language ?? "es");
  const slug = generateSlug(metadata.title);

  const existing = await getNode(slug);
  if (existing) throw new DuplicateError(`Node with slug '${slug}' already exists`);

  return { input, metadata, slug };
};
