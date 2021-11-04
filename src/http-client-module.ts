import { PromiseHandler } from "./PromiseHandler";

export class HttpClient {
  handler: PromiseHandler<typeof fetch>;
  constructor(props: { concurrency: number }) {
    this.handler = new PromiseHandler({
      ...props,
      start: fetch
    });
  }
  get = (
    url: string,
    options: RequestInit & { abortHandler?: HttpAbortHandler } = {}
  ) => {
    const { abortHandler, ...__options } = options;
    return this.handler.add(url, {
      ...__options,
      signal: abortHandler?.controller.signal
    });
  };
}

export class HttpAbortHandler {
  controller: AbortController;
  abort: () => void;
  constructor() {
    this.controller = new AbortController();
    this.abort = this.controller.abort;
  }
}
