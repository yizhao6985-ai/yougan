import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import ffmpegPath from "ffmpeg-static";

import { fetchReferenceAssetBuffer } from "./asset-fetch.js";

const execFileAsync = promisify(execFile);

const MAX_FRAMES = 3;

async function extractFramesFromFile(
  inputPath: string,
  outputDir: string,
): Promise<Buffer[]> {
  if (!ffmpegPath) {
    throw new Error("FFMPEG_NOT_AVAILABLE");
  }

  const outputPattern = join(outputDir, "frame-%02d.jpg");
  await execFileAsync(ffmpegPath, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    inputPath,
    "-vf",
    `fps=1/3`,
    "-frames:v",
    String(MAX_FRAMES),
    outputPattern,
  ]);

  const frames: Buffer[] = [];
  for (let index = 1; index <= MAX_FRAMES; index += 1) {
    const framePath = join(outputDir, `frame-${String(index).padStart(2, "0")}.jpg`);
    try {
      frames.push(await readFile(framePath));
    } catch {
      break;
    }
  }

  return frames;
}

export async function extractReferenceVideoKeyframes(input: {
  url: string;
  extension: string;
}): Promise<Buffer[]> {
  const videoBuffer = await fetchReferenceAssetBuffer(input.url);
  const dir = await mkdtemp(join(tmpdir(), "yougan-ref-frames-"));

  try {
    const inputPath = join(dir, `input.${input.extension}`);
    await writeFile(inputPath, videoBuffer);
    return await extractFramesFromFile(inputPath, dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
