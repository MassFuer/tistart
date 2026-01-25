
const { performance } = require('perf_hooks');

// Simulation of the deleteFile function
const SIMULATED_LATENCY_MS = 200;
const IMAGE_COUNT = 20;
const BATCH_SIZE = 5;

// Mock deleteFile function
const deleteFileMock = async (url, artistId) => {
  return new Promise(resolve => setTimeout(() => resolve(true), SIMULATED_LATENCY_MS));
};

const images = Array.from({ length: IMAGE_COUNT }, (_, i) => `http://example.com/image${i}.jpg`);
const artistId = "mock-artist-id";

async function runSequential() {
  const start = performance.now();
  for (const imageUrl of images) {
    await deleteFileMock(imageUrl, artistId);
  }
  const end = performance.now();
  return end - start;
}

async function runParallelUnbounded() {
  const start = performance.now();
  await Promise.all(images.map(img => deleteFileMock(img, artistId)));
  const end = performance.now();
  return end - start;
}

async function runParallelBatched() {
  const start = performance.now();
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const chunk = images.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(img => deleteFileMock(img, artistId)));
  }
  const end = performance.now();
  return end - start;
}

async function main() {
  console.log(`\n--- Deletion Benchmark (Images: ${IMAGE_COUNT}, Latency: ${SIMULATED_LATENCY_MS}ms) ---`);

  // Sequential
  console.log("Running Sequential...");
  const seqTime = await runSequential();
  console.log(`Sequential Time: ${seqTime.toFixed(2)}ms`);

  // Parallel Unbounded
  console.log("Running Parallel (Unbounded)...");
  const parTime = await runParallelUnbounded();
  console.log(`Parallel (Unbounded) Time: ${parTime.toFixed(2)}ms`);

  // Parallel Batched
  console.log(`Running Parallel (Batched, size=${BATCH_SIZE})...`);
  const batchTime = await runParallelBatched();
  console.log(`Parallel (Batched) Time: ${batchTime.toFixed(2)}ms`);

  console.log("\n--- Results ---");
  console.log(`Sequential vs Batched Improvement: ${(seqTime / batchTime).toFixed(2)}x faster`);
}

main().catch(console.error);
