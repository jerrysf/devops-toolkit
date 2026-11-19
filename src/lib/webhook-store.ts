/**
 * Idempotency store for processed webhook events.
 *
 * Interface-first so the storage backend can be swapped: in-memory
 * (default — survives only the warm lifetime of a serverless
 * instance), or plug in Vercel KV / a DB later by implementing
 * ProcessedEventStore and setting it via setEventStore.
 *
 * Why interface: the webhook handler must be idempotent — providers
 * retry webhooks, and double-fulfilling a purchase is the worst
 * outcome. A warm-instance in-memory set already dedupes provider
 * retries within a short window; a persistent store dedupes forever.
 */

export interface ProcessedEventStore {
  /** Returns true if this event was already processed. */
  has(eventId: string): Promise<boolean>;
  /** Records an event as processed. */
  add(eventId: string): Promise<void>;
}

class MemoryStore implements ProcessedEventStore {
  private events = new Set<string>();
  private order: string[] = [];
  private readonly cap = 10_000;
  async has(id: string) {
    return this.events.has(id);
  }
  async add(id: string) {
    this.events.add(id);
    this.order.push(id);
    if (this.order.length > this.cap) {
      const evict = this.order.shift()!;
      this.events.delete(evict);
    }
  }
}

let store: ProcessedEventStore = new MemoryStore();

export function getEventStore(): ProcessedEventStore {
  return store;
}

export function setEventStore(s: ProcessedEventStore) {
  store = s;
}
