import Redis from "ioredis";
import { env } from "../config/env";

type RedisValue = string | number;
type RedisExpiryMode = "EX";
type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: RedisValue, mode?: RedisExpiryMode, seconds?: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  quit(): Promise<unknown>;
  connect?: () => Promise<unknown>;
  status?: string;
};

class UpstashRestRedis implements RedisClient {
  private readonly baseUrl = env.UPSTASH_REDIS_REST_URL!.replace(/\/$/, "");
  private readonly token = env.UPSTASH_REDIS_REST_TOKEN!;

  private async command<T>(command: RedisValue[]): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(command)
    });

    const body = await response.json().catch(() => ({})) as { result?: T; error?: string };
    if (!response.ok || body.error) {
      throw new Error(body.error ?? `Upstash Redis request failed with ${response.status}`);
    }

    return body.result as T;
  }

  get(key: string) {
    return this.command<string | null>(["GET", key]);
  }

  set(key: string, value: RedisValue, mode?: RedisExpiryMode, seconds?: number) {
    const command: RedisValue[] = ["SET", key, value];
    if (mode && seconds) command.push(mode, seconds);
    return this.command(command);
  }

  del(key: string) {
    return this.command<number>(["DEL", key]);
  }

  incr(key: string) {
    return this.command<number>(["INCR", key]);
  }

  expire(key: string, seconds: number) {
    return this.command<number>(["EXPIRE", key, seconds]);
  }

  async quit() {
    return "OK";
  }
}

class IORedisClient implements RedisClient {
  private readonly client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    lazyConnect: true
  });

  get(key: string) {
    return this.client.get(key);
  }

  set(key: string, value: RedisValue, mode?: RedisExpiryMode, seconds?: number) {
    if (mode && seconds) return this.client.set(key, value, mode, seconds);
    return this.client.set(key, value);
  }

  del(key: string) {
    return this.client.del(key);
  }

  incr(key: string) {
    return this.client.incr(key);
  }

  expire(key: string, seconds: number) {
    return this.client.expire(key, seconds);
  }

  quit() {
    return this.client.quit();
  }

  connect() {
    return this.client.connect();
  }

  get status() {
    return this.client.status;
  }
}

export const redis: RedisClient = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new UpstashRestRedis()
  : new IORedisClient();

export async function connectRedis() {
  if (redis.status === "wait" && redis.connect) {
    await redis.connect();
  }
}
