import { PromiseHandler } from "./PromiseHandler";

interface _RequestInit {
  timeout?: number;
  abortHandler?: HttpAbortHandler;
}
const timeouter = (info: string, init: _RequestInit = {}) => {
  const { timeout = 1000, abortHandler } = init;
  return new Promise(function (resolve, reject) {
    let timer = setTimeout(function () {
      resolve(info);
    }, timeout);
    if (abortHandler) {
      abortHandler.setAbort(function () {
        clearTimeout(timer);
        reject("canceled");
      });
    }
  });
};

export class HttpClient {
  handler: PromiseHandler<typeof timeouter>;
  constructor(props: { concurrency: number }) {
    this.handler = new PromiseHandler({
      ...props,
      start: timeouter
    });
  }
  get = (url: string, options: _RequestInit = {}) => {
    return this.handler.add(url, options);
  };
}

export class HttpAbortHandler {
  abort = () => {};
  setAbort = (abort?: () => void) => {
    this.abort = abort;
  };
}
