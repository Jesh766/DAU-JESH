import net from "node:net";
import { logger } from "../lib/logger";

type RedisValue = string | number;

function encodeCommand(parts: RedisValue[]) {
  return `*${parts.length}\r\n${parts
    .map((part) => `$${String(part).length}\r\n${part}\r\n`)
    .join("")}`;
}

export class RedisCoordinator {
  private readonly url: URL | null;

  constructor(redisUrl = process.env.REDIS_URL) {
    this.url = redisUrl ? new URL(redisUrl) : null;
  }

  get configured() {
    return this.url !== null;
  }

  async ping() {
    if (!this.url) return false;
    const response = await this.command(["PING"]);
    return response === "PONG";
  }

  async set(key: string, value: string, ttlSeconds = 60) {
    if (!this.url) return false;
    const response = await this.command([
      "SET",
      key,
      value,
      "EX",
      ttlSeconds,
    ]);
    return response === "OK";
  }

  private command(parts: RedisValue[]): Promise<string> {
    if (!this.url) return Promise.resolve("");
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({
        host: this.url!.hostname,
        port: Number(this.url!.port || 6379),
      });
      let buffer = "";
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error("Redis command timed out"));
      }, 1_500);
      socket.once("connect", () => {
        if (this.url?.username || this.url?.password) {
          socket.write(
            encodeCommand([
              "AUTH",
              this.url.username || "default",
              decodeURIComponent(this.url.password),
            ]),
          );
        }
        socket.write(encodeCommand(parts));
      });
      socket.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        if (buffer.includes("\r\n")) {
          clearTimeout(timeout);
          socket.end();
          const payload = buffer.slice(1, buffer.indexOf("\r\n"));
          resolve(payload);
        }
      });
      socket.once("error", (error) => {
        clearTimeout(timeout);
        logger.warn({ err: error }, "Redis coordinator unavailable");
        reject(error);
      });
    });
  }
}

export const redisCoordinator = new RedisCoordinator();