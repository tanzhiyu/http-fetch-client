export class EventEmmiter<
  T extends (...args: any) => any,
  K extends string = string
> {
  listeners = new Map<K, T[]>();
  on = (type: K, fn: T) => {
    let eves = this.listeners.get(type) || [];
    eves.push(fn);
    this.listeners.set(type, eves);
  };
  emit = (type: K, ...args: Parameters<T>) => {
    let eves = this.listeners.get(type) || [];
    for (let i = 0; i < eves.length; i++) {
      eves[i](...args);
    }
  };
}

export const animationFrame = (fn: any) => setTimeout(fn, 2000);

export interface PromiseHandlerProps<T extends (...args: any) => Promise<any>> {
  concurrency: number;
  start?: T;
}
interface QueueItem<T> {
  status?: "init" | "fetching" | "fetched" | "error";
  promiser: () => Promise<T> | undefined;
  emmiter: EventEmmiter<(args: T) => void, "resolve" | "reject">;
  response?: any;
  error?: any;
}
export class PromiseHandler<T extends (...args: any[]) => Promise<any>>
  implements PromiseHandlerProps<T> {
  concurrency;
  start;
  queue: QueueItem<ReturnType<T>>[];
  constructor(props: PromiseHandlerProps<T>) {
    this.concurrency = props.concurrency;
    this.start = props.start;
    this.queue = [];
    this.loop();
  }

  add = (...args: Parameters<T>) => {
    const t = this;
    const emmiter = new EventEmmiter<
      (args: ReturnType<T>) => void,
      "resolve" | "reject"
    >();
    const resolve = new Promise<ReturnType<T>>(function (resolve, reject) {
      emmiter.on("resolve", resolve);
      emmiter.on("reject", reject);
    });
    const item: QueueItem<ReturnType<T>> = {
      status: "init",
      promiser: () => t.start && t.start(...args),
      emmiter
    };
    this.queue.push(item);
    return resolve;
  };

  loop = () => {
    const t = this;
    const len = this.queue.length;
    let len_fetching = 0;
    let len_fetched = 0;
    let len_error = 0;
    let queue_init = [];

    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      switch (item.status) {
        case "init":
          queue_init.push(item);
          break;
        case "fetching":
          len_fetching++;
          break;
        case "fetched":
          len_fetched++;
          break;
        case "error":
          len_error++;
          break;
      }
    }

    if (len > 0 && len === len_error + len_fetched) {
      t.queue.forEach((item) => {
        switch (item.status) {
          case "error":
            item.emmiter.emit("reject", item.error);
            break;
          case "fetched":
            item.emmiter.emit("resolve", item.response);
        }
      });
      t.queue = [];
    } else if (len_fetching === t.concurrency) {
      // 需要等待
    } else if (queue_init.length > 0) {
      for (
        let i = 0;
        i < queue_init.length && i < t.concurrency - len_fetching;
        i++
      ) {
        (function (item) {
          if (item.status === "init") {
            item.status = "fetching";
            item
              .promiser()
              ?.then((response) => {
                item.status = "fetched";
                item.response = response;
              })
              .catch((error) => {
                item.status = "error";
                item.error = error;
              });
          }
        })(queue_init[i]);
      }
    }
    animationFrame(t.loop);
  };
}
