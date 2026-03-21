import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;

export async function putBody(
  nodeType: string,
  slug: string,
  body: string,
  language: "es" | "en" = "es",
): Promise<void> {
  const suffix = language === "en" ? "body.en.mdx" : "body.mdx";
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `content/${nodeType}/${slug}/${suffix}`,
    Body: body,
    ContentType: "text/markdown; charset=utf-8",
  }));
}
