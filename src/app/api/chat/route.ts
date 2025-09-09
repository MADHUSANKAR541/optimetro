import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateChatCompletion } from '@/lib/aiClient';
import { AI_CONFIG } from '@/lib/apiConfig';

type Role = 'admin' | 'commuter';

function isAppRelatedForCommuter(text: string): boolean {
  const q = text.toLowerCase();
  const allow = [
    'ticket', 'tickets', 'trip', 'trips', 'plan', 'planner', 'route', 'routes',
    'alert', 'alerts', 'settings', 'account', 'login', 'logout', 'signup', 'profile',
    'payment', 'fare', 'pricing', 'help', 'support'
  ];
  return allow.some(k => q.includes(k));
}

function answerForCommuter(text: string): string {
  const q = text.toLowerCase();
  if (q.includes('ticket')) return 'Go to Dashboard → Tickets to view or manage your tickets.';
  if (q.includes('trip') || q.includes('plan') || q.includes('route')) return 'Use Dashboard → Plan to plan a trip and view suggested routes.';
  if (q.includes('alert')) return 'Check Dashboard → Alerts for service updates and disruptions.';
  if (q.includes('setting') || q.includes('account') || q.includes('profile')) return 'Open Dashboard → Settings to update your profile and preferences.';
  if (q.includes('fare') || q.includes('price') || q.includes('payment')) return 'Fares are shown on the trip plan and tickets pages. For issues, contact support via Settings.';
  return 'I can help with tickets, trips/plan, alerts, and settings. What do you need?';
}

function answerForAdmin(text: string): string {
  const q = text.toLowerCase();
  if (q.includes('induction') || q.includes('optimizer') || q.includes('schedule')) return 'Admin → Induction: run the optimizer, review ranked train decisions, and export results.';
  if (q.includes('stabling') || q.includes('depot')) return 'Admin → Stabling: view depot schematic, select trains, and simulate shunting moves.';
  if (q.includes('maintenance') || q.includes('job card')) return 'Admin → Maintenance: review maintenance records and statuses.';
  if (q.includes('kpi') || q.includes('metric')) return 'Admin → KPI: view performance charts like punctuality and energy usage.';
  if (q.includes('conflict')) return 'Admin → Conflicts: inspect conflicts like fitness or job card issues per train.';
  if (q.includes('migrate') || q.includes('supabase')) return 'Admin → Migrate: run migration or generate sample data for Supabase.';
  return 'I can guide you through Induction, Stabling, Maintenance, KPI, Conflicts, and Migrate sections. What would you like to do?';
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role || 'commuter') as Role;

  try {
    const { message } = await request.json();
    const text = String(message || '').trim();
    if (!text) {
      return NextResponse.json({ reply: 'Please enter a question.' });
    }

    // If configured, proxy to FastAPI backend chat
    const fastapiUrl = process.env.INDUCTION_API_URL;
    if (fastapiUrl) {
      try {
        const res = await fetch(`${fastapiUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, role })
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data?.reply === 'string') {
            return NextResponse.json({ reply: String(data.reply).slice(0, 800) });
          }
        }
      } catch (err) {
        // fall through to local handling
      }
    }

    // If no provider configured, keep rule-based replies
    if (!AI_CONFIG.provider || AI_CONFIG.provider === 'none') {
      if (role === 'commuter') {
        if (!isAppRelatedForCommuter(text)) {
          return NextResponse.json({ reply: 'I can only answer app-related commuter questions (tickets, trips, alerts, settings).' });
        }
        return NextResponse.json({ reply: answerForCommuter(text) });
      }
      return NextResponse.json({ reply: answerForAdmin(text) });
    }

    // Build role-aware system prompt with safety and brevity
    const system = role === 'commuter'
      ? 'You are a metro commuter assistant for our app. Only answer questions about tickets, trips (planner), routes, alerts, settings/account, login/signup. Refuse out-of-scope topics politely. Be concise (<= 3 sentences).'
      : 'You are an admin assistant for our metro operations app. Guide the admin on Induction (optimizer), Stabling, Maintenance, KPI, Conflicts, and Migrate. Do not disclose secrets or user data. Be concise (<= 4 sentences).';

    // Additional refusal for commuter
    if (role === 'commuter' && !isAppRelatedForCommuter(text)) {
      return NextResponse.json({ reply: 'I can only answer app-related commuter questions (tickets, trips, alerts, settings).' });
    }

    const reply = await generateChatCompletion([
      { role: 'system', content: system },
      { role: 'user', content: text }
    ]);

    // Final safety: shorten and sanitize
    const safe = String(reply || '').slice(0, 800);
    return NextResponse.json({ reply: safe });
  } catch (e) {
    return NextResponse.json({ reply: 'Sorry, something went wrong.' }, { status: 500 });
  }
}


