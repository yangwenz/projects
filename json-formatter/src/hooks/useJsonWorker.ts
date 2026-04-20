"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import {
  FormatResult,
  MinifyResult,
  WorkerRequest,
  WorkerResponse,
  IndentOption,
  SortKeysOption,
} from "@/lib/types";

let idCounter = 0;
function nextId(): string {
  return `req-${++idCounter}-${Date.now()}`;
}

function handleMessage(
  resp: WorkerResponse,
  latestId: string,
  setFormatResult: (r: FormatResult) => void,
  setMinifyResult: (r: MinifyResult) => void,
  setError: (e: string | null) => void
) {
  if (resp.id !== latestId) return;
  if (resp.type === "error") {
    setError(resp.error);
  } else if (resp.type === "format") {
    setFormatResult(resp.result);
    setError(null);
  } else if (resp.type === "minify") {
    setMinifyResult(resp.result);
    setError(null);
  }
}

export function useJsonWorker() {
  const workerRef = useRef<Worker | null>(null);
  const latestIdRef = useRef<string>("");
  const [formatResult, setFormatResult] = useState<FormatResult | null>(null);
  const [minifyResult, setMinifyResult] = useState<MinifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function initWorker() {
      const w = new Worker(
        new URL("../workers/json.worker.ts", import.meta.url)
      );
      w.onmessage = (e: MessageEvent<WorkerResponse>) => {
        handleMessage(
          e.data,
          latestIdRef.current,
          setFormatResult,
          setMinifyResult,
          setError
        );
      };
      w.onerror = () => {
        workerRef.current?.terminate();
        workerRef.current = initWorker();
      };
      workerRef.current = w;
      return w;
    }

    initWorker();
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const sendFormat = useCallback(
    (input: string, indent: IndentOption, sortKeys: SortKeysOption) => {
      const id = nextId();
      latestIdRef.current = id;
      const msg: WorkerRequest = {
        id,
        type: "format",
        payload: { input, indent, sortKeys },
      };
      workerRef.current?.postMessage(msg);
    },
    []
  );

  const sendMinify = useCallback((input: string) => {
    const id = nextId();
    latestIdRef.current = id;
    const msg: WorkerRequest = { id, type: "minify", payload: { input } };
    workerRef.current?.postMessage(msg);
  }, []);

  const reset = useCallback(() => {
    setFormatResult(null);
    setMinifyResult(null);
    setError(null);
  }, []);

  return { formatResult, minifyResult, error, sendFormat, sendMinify, reset };
}
