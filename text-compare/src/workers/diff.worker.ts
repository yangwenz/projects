import { computeDiff } from "@/lib/diff-computation";
import type { WorkerIncoming } from "@/types/diff";

self.onmessage = (event: MessageEvent<WorkerIncoming>) => {
  const { id, leftText, rightText, mode, options } = event.data;
  const result = computeDiff(id, leftText, rightText, mode, options);
  self.postMessage(result);
};
