import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Đọc câu hỏi
    let body: { message?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Dữ liệu gửi lên không phải JSON hợp lệ." },
        { status: 400 }
      );
    }

    const message = body.message;

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập câu hỏi." },
        { status: 400 }
      );
    }

    // 2. Đọc cấu hình từ .env.local
    const baseUrl = process.env.NINE_ROUTER_BASE_URL?.trim();
    const apiKey = process.env.NINE_ROUTER_API_KEY?.trim();
    const model = process.env.NINE_ROUTER_MODEL?.trim();

    if (!baseUrl || !apiKey || !model) {
      console.error("[Nova AI] Thiếu cấu hình NINE_ROUTER_*.");

      return NextResponse.json(
        { error: "Thiếu cấu hình 9Router trong file .env.local." },
        { status: 500 }
      );
    }

    // 3. Gọi 9Router
    let response: Response;

    try {
      response = await fetch(
        `${baseUrl.replace(/\/+$/, "")}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "user",
                content: message.trim(),
              },
            ],
            stream: false,
          }),
          signal: AbortSignal.timeout(60000),
          cache: "no-store",
        }
      );
    } catch (error) {
      console.error(
        "[Nova AI] Lỗi kết nối:",
        error instanceof Error ? error.message : "Unknown error"
      );

      return NextResponse.json(
        {
          error:
            "Không kết nối được 9Router. Hãy kiểm tra máy chủ và địa chỉ API.",
        },
        { status: 502 }
      );
    }

    // 4. Đọc phản hồi từ 9Router
    const raw = await response.text();

    let data: any = null;

    try {
      data = JSON.parse(raw);
    } catch {
      // Nhà cung cấp có thể trả về nội dung không phải JSON
    }

    if (!response.ok) {
      const providerMessage =
        data?.error?.message ||
        data?.error?.detail ||
        data?.message ||
        (raw ? raw.slice(0, 400) : "Không có chi tiết lỗi.");

      console.error("[Nova AI] Lỗi từ 9Router:", {
        status: response.status,
        model,
        error: providerMessage,
      });

      return NextResponse.json(
        {
          error: `9Router lỗi HTTP ${response.status}: ${providerMessage}`,
        },
        { status: 502 }
      );
    }

    if (!data) {
      console.error("[Nova AI] Phản hồi không phải JSON hợp lệ.");

      return NextResponse.json(
        { error: "9Router trả về dữ liệu không hợp lệ." },
        { status: 502 }
      );
    }

    // 5. Lấy câu trả lời AI
    const content = data?.choices?.[0]?.message?.content;

    let reply: string;

    if (typeof content === "string") {
      reply = content;
    } else if (
      Array.isArray(content) &&
      content.every((item: any) => item?.type === "text")
    ) {
      reply = content
        .map((item: any) => item.text || "")
        .join("");
    } else {
      console.error("[Nova AI] Không tìm thấy câu trả lời.", {
        model,
        responseKeys: Object.keys(data),
      });

      return NextResponse.json(
        { error: "AI chưa trả về nội dung. Hãy kiểm tra model đã chọn." },
        { status: 502 }
      );
    }

    if (!reply.trim()) {
      return NextResponse.json(
        { error: "AI trả về câu trả lời rỗng. Vui lòng thử lại." },
        { status: 502 }
      );
    }

    // 6. Trả kết quả về giao diện
    return NextResponse.json({ reply });
  } catch (error) {
    console.error(
      "[Nova AI] Lỗi xử lý API:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Lỗi máy chủ Nova AI. Hãy kiểm tra Terminal." },
      { status: 500 }
    );
  }
}
