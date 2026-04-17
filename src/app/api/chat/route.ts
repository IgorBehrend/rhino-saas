import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY não configurada no Vercel.' },
      { status: 500 }
    );
  }

  let body: {
    system?: string;
    messages: { role: string; content: unknown }[];
    max_tokens?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  try {
    const systemInstruction = body.system
      ? { parts: [{ text: body.system }] }
      : undefined;

    const contents = body.messages.map((msg) => {
      const role = msg.role === 'assistant' ? 'model' : 'user';

      // content pode ser string ou array de blocos (Anthropic format)
      if (typeof msg.content === 'string') {
        return { role, parts: [{ text: msg.content }] };
      }

      if (Array.isArray(msg.content)) {
        const parts: object[] = [];
        for (const block of msg.content as { type: string; text?: string; source?: { data: string; media_type: string } }[]) {
          if (block.type === 'text' && block.text) {
            parts.push({ text: block.text });
          } else if (block.type === 'document' && block.source) {
            parts.push({
              inlineData: {
                mimeType: block.source.media_type,
                data: block.source.data,
              },
            });
          }
        }
        return { role, parts: parts.length ? parts : [{ text: '' }] };
      }

      return { role, parts: [{ text: String(msg.content) }] };
    });

    const geminiBody = {
      systemInstruction,
      contents,
      generationConfig: {
        maxOutputTokens: body.max_tokens ?? 4000,
        temperature: 0.3,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini error:', response.status, errText);
      return NextResponse.json(
        { error: `Gemini ${response.status}: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return NextResponse.json({ content: [{ type: 'text', text }] });

  } catch (err) {
    console.error('Erro:', err);
    return NextResponse.json(
      { error: 'Erro ao conectar: ' + String(err) },
      { status: 500 }
    );
  }
}
