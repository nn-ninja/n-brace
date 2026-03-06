import { Events } from "obsidian";

import type { EventRef } from "obsidian";


import { AsyncQueue } from "@/util/AsyncQueue";

/**
 *  Event bus for internal Plugin communication
 *
 * the on method is patched to add the callback to an async queue
 */
export class AsyncEventBus extends Events {
  asyncQueue = new AsyncQueue();

  trigger(name: string, ...data: unknown[]): void {
    super.trigger(name, ...data);
  }

  /**
   * add the callback to an async queue to make sure that the callback is executed one after one
   */
  on(name: string, callback: (...data: unknown[]) => void | Promise<void>, ctx?: unknown): EventRef {
    const pushToAsyncQueue = (...data: unknown[]) => {
      // add this callback to async queue
      this.asyncQueue.push(() => callback(...data));
    };

    return super.on(name, pushToAsyncQueue, ctx);
  }
}

export const eventBus = new AsyncEventBus();
