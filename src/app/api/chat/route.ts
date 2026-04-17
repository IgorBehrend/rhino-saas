import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

// Converte o formato Anthropic para Gemini e vice-versa
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
    messages: { role: string; content: string | { type: string; text?: string; source?: { data: string; media_type: string } }[] }[];
    max_tokens?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  try {
    // Monta o systemInstruction
    const systemInstruction = body.system
      ? { parts: [{ text: body.system }] }
      : undefined;

    // Converte messages do formato Anthropic para Gemini
    const contents = body.messages.map((msg) => {
      const role = msg.role === 'assistant' ? 'model' : 'user';

      if (typeof msg.content === 'string') {
        return { role, parts: [{ text: msg.content }] };
      }

      // Conteúdo misto (texto + documento PDF)
      const parts: object[] = [];
      for (const block of msg.content) {
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
      return { role, parts };
    });

    const geminiBody = {
      systemInstruction,
      contents,
      generationConfig: {
        maxOutputTokens: body.max_tokens ?? 4000,
        temperature: 0.3,
      },
    };

    const model = 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return NextResponse.json(
        { error: `Gemini retornou ${response.status}: ${errText}` },
        { status: response.status }
      );
    }

    const geminiData = await response.json();

    // Converte resposta Gemini → formato Anthropic (que o frontend espera)
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return NextResponse.json({
      content: [{ type: 'text', text }],
    });
  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json(
      { error: 'Erro ao conectar com o Gemini.' },
      { status: 500 }
    );
  }
}
