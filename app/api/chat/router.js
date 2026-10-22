
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const messages = body.messages;

    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 30
    ) {
      return NextResponse.json(
        { error: "Danh sách tin nhắn không hợp lệ." },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NINE_ROUTER_BASE_URL;
    const apiKey = process.env.NINE_ROUTER_API_KEY;
    const model = process.env.NINE_ROUTER_MODEL;

    if (!baseUrl || !model) {
      return NextResponse.json(
        { error: "Thiếu cấu hình 9Router." },
        { status: 500 }
      );
    }

    const safeMessages = messages.map((message) => {
      if (
        !["user", "assistant"].includes(message?.role) ||
        typeof message?.content !== "string" ||
        message.content.length > 12000
      ) {
        throw new Error("INVALID_MESSAGES");
      }

      return {
        role: message.role,
        content: message.content,
      };
    });

    const headers = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: safeMessages,
          stream: false,
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!response.ok) {
      console.error("9Router HTTP status:", response.status);

      return NextResponse.json(
        { error: "9Router từ chối yêu cầu. Hãy kiểm tra cấu hình." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (typeof reply !== "string") {
      return NextResponse.json(
        { error: "Phản hồi AI không đúng định dạng." },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    if (error.message === "INVALID_MESSAGES") {
      return NextResponse.json(
        { error: "Tin nhắn không hợp lệ." },
        { status: 400 }
      );
    }

    console.error("Chat API error:", error.name);

    return NextResponse.json(
      { error: "Không thể kết nối đến 9Router." },
      { status: 500 }
    );
  }
}
