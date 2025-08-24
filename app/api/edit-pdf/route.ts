import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type ReplaceInstruction = {
  operation: "replace";
  target: string;        // exact text to find
  replacement: string;   // replacement text
};

type Instruction = ReplaceInstruction;

/**
 * Tries to coerce freeform prompt to a JSON instruction via Gemini.
 * Falls back to a naive parser if Gemini doesn't give valid JSON.
 */
async function promptToInstruction(prompt: string): Promise<Instruction> {
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyB7lyic9u7nAN-nXAzMfdztaHMnm7ZxrJA`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      `Convert the user's request into STRICT JSON with this schema:\n` +
                      `{"operation":"replace","target":"<string>","replacement":"<string>"}\n\n` +
                      `User request:\n${prompt}\n\nOnly output JSON, no commentary.`,
                  },
                ],
              },
            ],
          }),
        }
      );
      const data = await res.json();
      const txt =
        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
      const jsonText = txt.replace(/```json|```/g, "").trim();
      const obj = JSON.parse(jsonText);
      if (
        obj &&
        obj.operation === "replace" &&
        typeof obj.target === "string" &&
        typeof obj.replacement === "string"
      ) {
        return obj as Instruction;
      }
    } catch {
      // fall back to naive
    }
  }

  // Naive fallback "Replace all 'X' with 'Y'"
  const m =
    prompt.match(/replace\s+all\s+["'“”]?(.+?)["'“”]?\s+with\s+["'“”]?(.+?)["'“”]?/i) ||
    prompt.match(/change\s+["'“”]?(.+?)["'“”]?\s+to\s+["'“”]?(.+?)["'“”]?/i);
  if (m) {
    return { operation: "replace", target: m[1], replacement: m[2] };
  }
  // Last resort: treat entire prompt as target->replacement using "->" syntax
  const arrow = prompt.match(/(.+?)\s*->\s*(.+)/);
  if (arrow) {
    return { operation: "replace", target: arrow[1].trim(), replacement: arrow[2].trim() };
  }
  // Default dummy (won't edit anything)
  return { operation: "replace", target: "", replacement: "" };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const prompt = (form.get("prompt") as string | null) ?? "";

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const instruction = await promptToInstruction(prompt);

    const buf = Buffer.from(await file.arrayBuffer());

    // Load the PDF with pdf-lib
    const pdfDoc = await PDFDocument.load(buf);
    const pages = pdfDoc.getPages();
    
    // This is a simplified example of text replacement. 
    // A robust solution would require a more sophisticated method 
    // of finding text coordinates.
    const { target, replacement } = instruction;
    if (target && replacement) {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      for (const page of pages) {
        const { width, height } = page.getSize();
        // This is a naive approach: we'll just draw the replacement text
        // at a fixed position. A real implementation would need to find
        // the coordinates of the target text.
        page.drawText(replacement, {
          x: 50,
          y: height - 50, 
          font,
          size: 24,
          color: rgb(0.95, 0.1, 0.1),
        });
      }
    }

    // Save the modified PDF
    const outBytes = await pdfDoc.save();
    return new NextResponse(outBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="edited.pdf"',
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Failed to edit PDF" },
      { status: 500 }
    );
  }
}
