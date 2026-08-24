import { API } from "~/constants";
import Ajax from "./AjaxService";
import { StorageService } from "./StorageService";

/** Intents Swa tags a reply with; `null` is an open-ended, AI-answered reply. */
export type SwaIntentCode =
  | "LOYALTY_BALANCE"
  | "BILLING_DUES"
  | "ORDER_STATUS"
  | null;

export interface SwaMessageData {
  reply: string;
  intentCode: SwaIntentCode;
  /** Which path the server used — "sse" when the stream is connected. */
  deliveredVia?: string;
}

export interface SwaMessageResponse {
  success: boolean;
  data: SwaMessageData;
  requestId?: string;
  timestamp?: string;
}

/**
 * One stored turn of the thread. The server names the side either as a `role`
 * or as a `direction`, and the text either as `text`, `message` or `reply`, so
 * both spellings are accepted and normalised in the chat helper.
 */
export interface SwaHistoryMessage {
  id?: string | number;
  role?: "user" | "assistant" | "swa" | string;
  direction?: "in" | "out";
  text?: string;
  message?: string;
  reply?: string;
  intentCode?: SwaIntentCode;
  createdAt?: string;
  timestamp?: string;
}

export interface SwaHistoryResponse {
  success: boolean;
  /** Oldest-first list, either bare or wrapped in `{ messages }`. */
  data:
    | SwaHistoryMessage[]
    | {
        messages?: SwaHistoryMessage[];
        /** Paging hints, when the server sends them. */
        hasMore?: boolean;
        total?: number;
      };
}

/** A proactive alert pushed on the stream (not a reply to anything asked). */
export interface SwaStreamMessage {
  text: string;
  intentCode?: SwaIntentCode;
  skillUsed?: string;
}

export interface SwaStreamHandlers {
  onConnected?: (data: any) => void;
  onMessage?: (message: SwaStreamMessage) => void;
  onError?: (error: unknown) => void;
}

/**
 * Swa — the shop assistant behind the home chat. One request/response endpoint
 * for what the retailer asks, and a server-sent stream for what Swa raises on
 * its own.
 */
class SwaService {
  static readonly BASE_URL = API + "swa";
  private static readonly TOKEN_KEY = "_t";

  /** Sends one message; the answer is on `data.reply` of the response itself. */
  static sendMessage(text: string) {
    return Ajax.request<SwaMessageResponse>(
      this.BASE_URL + "/message",
      "POST",
      {
        text,
      },
    );
  }

  /**
   * The stored thread, `limit` turns at a time. `offset` skips that many of the
   * most recent turns, which is how the chat pages further back as the retailer
   * scrolls up.
   */
  static getHistory(limit: number = 50, offset: number = 0) {
    return Ajax.request<SwaHistoryResponse>(
      this.BASE_URL + "/message/history",
      "GET",
      offset ? { limit, offset } : { limit },
    );
  }

  /**
   * Opens the proactive-alert stream. `EventSource` cannot carry the JWT
   * header, so the stream is read off `fetch` and the SSE frames are parsed
   * here. Returns a function that closes it.
   */
  static openStream(handlers: SwaStreamHandlers): () => void {
    const controller = new AbortController();
    const token = StorageService.get<string>(this.TOKEN_KEY);

    const read = async () => {
      try {
        const response = await fetch(this.BASE_URL + "/stream", {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
            ...(token ? { Authorization: `JWT ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Swa stream failed with status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Frames are separated by a blank line; anything after the last one is
        // a partial frame, so it stays in the buffer for the next chunk.
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          frames.forEach((frame) => this.handleFrame(frame, handlers));
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        handlers.onError?.(error);
      }
    };

    read();

    return () => controller.abort();
  }

  /** Turns one `event:`/`data:` frame into the matching handler call. */
  private static handleFrame(frame: string, handlers: SwaStreamHandlers) {
    let event = "message";
    const dataLines: string[] = [];

    frame.split("\n").forEach((line) => {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    });

    if (!dataLines.length) return;

    let payload: any;
    try {
      payload = JSON.parse(dataLines.join("\n"));
    } catch {
      payload = { text: dataLines.join("\n") };
    }

    if (event === "connected") handlers.onConnected?.(payload);
    else if (event === "message") handlers.onMessage?.(payload);
  }
}

export default SwaService;
