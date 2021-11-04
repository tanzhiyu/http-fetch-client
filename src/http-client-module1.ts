import { PromiseHandler } from "./PromiseHandler";
interface _RequestInit extends RequestInit {
  setXHR?: (xhr: XMLHttpRequest) => void;
  headers?: Record<string, string>;
}

const ajax = (url: string, options: _RequestInit = {}) => {
  const xhr = new XMLHttpRequest();
  const { method = "get", setXHR, body, headers = {} } = options;
  Object.keys(headers).forEach((k) => {
    xhr.setRequestHeader(k, headers[k]);
  });
  const promiser = new Promise<XMLHttpRequest>(function (resolve, reject) {
    xhr.addEventListener("readystatechange", function (e) {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr);
        } else {
          reject(xhr);
        }
      }
    });
    xhr.open(method, url);
    xhr.send(body);
  });
  if (setXHR) {
    setXHR(xhr);
  }
  return promiser;
};
export class HttpClient {
  handler: PromiseHandler<typeof ajax>;
  constructor(props: { concurrency: number }) {
    this.handler = new PromiseHandler({
      ...props,
      start: ajax
    });
  }
  get = (
    url: string,
    options: _RequestInit & { abortHandler?: HttpAbortHandler } = {}
  ) => {
    const { abortHandler, ...__options } = options;
    const promiser = this.handler.add(url, {
      ...__options,
      setXHR: abortHandler?.setXHR
    });
    return promiser;
  };
}

export class HttpAbortHandler {
  xhr?: XMLHttpRequest;
  setXHR = (xhr: XMLHttpRequest) => {
    this.xhr = xhr;
  };
  abort = () => {
    if (this.xhr) {
      this.xhr.abort();
    }
  };
}
