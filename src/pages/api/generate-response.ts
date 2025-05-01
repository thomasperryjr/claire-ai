import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, context, responseGoal } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('style_embedding')
    .eq('user_id', userId)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User style embedding not found' });
  }

  const prompt = `
    Response goal: ${responseGoal}
    Context: ${context}
    Match this user's communication style embedding: ${JSON.stringify(user.style_embedding)}
    Provide a concise, effective reply clearly matching their tone:
  `;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = completion.choices[0].message.content;

  res.status(200).json({ response: responseText });
}
