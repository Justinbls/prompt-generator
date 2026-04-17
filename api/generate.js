import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { task, role, audience, format, tone, length, context } = req.body;

  if (!task) {
    return res.status(400).json({ error: 'task is required' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const metaPrompt = `Du bist ein Experte für das Schreiben von präzisen, wirkungsvollen Prompts für KI-Assistenten wie Claude.

Deine Aufgabe: Erstelle einen hochwertigen, direkt einsetzbaren Prompt basierend auf diesen Angaben:

- Aufgabe: ${task}
- Rolle von Claude: ${role || 'Assistent'}
- Zielgruppe des Outputs: ${audience || 'allgemein'}
- Gewünschtes Format: ${format || 'Fließtext'}
- Ton: ${tone || 'professionell'}
- Länge des Outputs: ${length || 'angemessen'}${context ? `\n- Zusätzlicher Kontext: ${context}` : ''}

Schreibe jetzt einen vollständigen, direkt verwendbaren Prompt auf Deutsch. Der Prompt soll:
- Eine klare Rollenanweisung enthalten
- Die Aufgabe präzise beschreiben
- Format, Ton und Länge konkret vorgeben
- Professionell und klar formuliert sein
- Direkt an Claude gerichtet sein (Du-Form)

Gib NUR den fertigen Prompt zurück, ohne Erklärungen oder Metakommentare davor oder danach.`;

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
