import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { task, audience, style, context } = req.body;

  if (!task) {
    return res.status(400).json({ error: 'task is required' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const metaPrompt = `Du bist ein Experte für das Schreiben von präzisen, wirkungsvollen Prompts für KI-Assistenten wie Claude.

Ein Nutzer hat folgende Angaben gemacht:

AUFGABE: ${task}
${audience ? `ZIELGRUPPE / FÜR WEN: ${audience}` : ''}
${style ? `STIL / TON / LÄNGE: ${style}` : ''}
${context ? `WEITERER KONTEXT: ${context}` : ''}

Schreibe jetzt einen vollständigen, direkt verwendbaren Prompt auf Deutsch. Interpretiere die Angaben des Nutzers intelligent — ergänze sinnvolle Details, die er nicht explizit genannt hat, aber die den Prompt besser machen. Der Prompt soll:
- Direkt und konkret sein, keine Floskeln
- Eine passende Rollenanweisung für Claude enthalten (sofern sinnvoll)
- Die Aufgabe klar und präzise beschreiben
- Ton, Stil und Länge konkret vorgeben (basierend auf den Angaben oder sinnvoll abgeleitet)
- Direkt an Claude gerichtet sein

Gib NUR den fertigen Prompt zurück — keine Erklärungen, keine Einleitung, kein Kommentar.`;

  try {
    const stream = await client.messages.stream({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      messages: [{ role: 'user', content: metaPrompt }],
    });

    const message = await stream.finalMessage();
    const generatedPrompt = message.content[0].text;

    return res.status(200).json({ prompt: generatedPrompt });
  } catch (error) {
    console.error('Claude API error:', error);
    return res.status(500).json({ error: 'Fehler beim Generieren des Prompts' });
  }
}
