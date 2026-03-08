import { PostgrestConfig } from "../config.js";
import { requestJson } from "./request-json.js";

type QueryParams = Record<string, string | number | undefined>;

export class PostgrestClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly schema: string;

  public constructor(config: PostgrestConfig) {
    this.baseUrl = config.POSTGREST_URL.replace(/\/$/, "");
    this.timeoutMs = config.POSTGREST_TIMEOUT_MS;
    this.schema = config.POSTGREST_SCHEMA;
  }

  public async select<T>(resource: string, params: QueryParams = {}): Promise<T[]> {
    const url = new URL(`${this.baseUrl}/${resource}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    return requestJson<T[]>({
      url: url.toString(),
      timeoutMs: this.timeoutMs,
      retryAttempts: 0,
      retryBackoffMs: 0,
      upstream: "postgrest",
      headers: {
        Accept: "application/json",
        "Accept-Profile": this.schema,
        "Content-Profile": this.schema,
      },
    });
  }

  public async checkReadiness(): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/`, {
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }
}
