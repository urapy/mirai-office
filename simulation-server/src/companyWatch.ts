export interface CompanyWatchReport {
  companyId: 'nvidia';
  companyName: 'NVIDIA';
  roomProductId: 'nvidia-watch';
  sourceType: 'official-press-release';
  sourceName: 'NVIDIA Newsroom';
  sourceUrl: string;
  sourcePublishedAt: string;
  sourceHeadline: string;
  category: 'ai-product' | 'infrastructure' | 'partnership' | 'financial' | 'other';
  activityLabel: string;
  reactionLevel: 1 | 2 | 3;
  cue: 'music';
  whatHappened: string;
  childMeaning: string;
  whatToWatch: string;
  generatedAt: string;
  status: 'live' | 'fallback';
  notice: string;
}

export const NVIDIA_PRESS_RELEASE_FEED = 'https://nvidianews.nvidia.com/cats/press_release.xml';

const FALLBACK_SOURCE_URL =
  'https://nvidianews.nvidia.com/news/nvidia-groq-3-lpx-now-in-full-production-with-world-class-speed-for-agentic-ai';

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(item: string, name: string): string {
  return decodeXml(
    item.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`))?.[1] ?? '',
  );
}

function classify(text: string): CompanyWatchReport['category'] {
  const normalized = text.toLowerCase();
  if (/financial results|revenue|earnings|quarter/.test(normalized)) return 'financial';
  if (/data center|ai factory|infrastructure|gigawatt|rack/.test(normalized)) {
    return 'infrastructure';
  }
  if (/partner|adopts|collaboration|joins forces/.test(normalized)) return 'partnership';
  if (/production|platform|accelerator|gpu|cpu|inference|agentic ai/.test(normalized)) {
    return 'ai-product';
  }
  return 'other';
}

function explanation(
  category: CompanyWatchReport['category'],
): Pick<
  CompanyWatchReport,
  'activityLabel' | 'reactionLevel' | 'whatHappened' | 'childMeaning' | 'whatToWatch'
> {
  switch (category) {
    case 'financial':
      return {
        activityLabel: '決算を確認中',
        reactionLevel: 2,
        whatHappened: 'NVIDIAが、会社の売上や利益について新しい公式発表をしました。',
        childMeaning:
          'AIを動かす計算のしくみが、どれくらい社会で使われたかを数字で確かめる発表です。',
        whatToWatch: '売上だけでなく、開発に使うお金や困っていることも次の発表で確認します。',
      };
    case 'infrastructure':
      return {
        activityLabel: 'AI設備を拡大',
        reactionLevel: 3,
        whatHappened: 'NVIDIAが、AIを動かす大きなコンピューター設備について公式発表をしました。',
        childMeaning:
          'AIには半導体だけでなく、サーバー、通信、電気を一緒に動かす大きな設備が必要です。',
        whatToWatch: '設備が計画どおり作られ、省エネや安全にも配慮されるかを見守ります。',
      };
    case 'partnership':
      return {
        activityLabel: '共同プロジェクト',
        reactionLevel: 2,
        whatHappened: 'NVIDIAが、ほかの会社や団体と進める新しい取り組みを発表しました。',
        childMeaning: '一社だけでは難しい大きな仕事を、得意なことが違う仲間と協力して進めます。',
        whatToWatch: '発表した計画が、実際の製品やサービスとして使われ始めるかを見守ります。',
      };
    case 'ai-product':
      return {
        activityLabel: 'AI製品を開発',
        reactionLevel: 3,
        whatHappened: 'NVIDIAが、AIの計算を支える新しい製品や技術について公式発表をしました。',
        childMeaning:
          'AIが考えたり仕事をしたりするときの計算を、もっと速く効率よくするための取り組みです。',
        whatToWatch: '発表された技術が、実際の会社や研究でどのように使われるかを見守ります。',
      };
    default:
      return {
        activityLabel: '新しい動きを確認',
        reactionLevel: 1,
        whatHappened: 'NVIDIAから新しい公式発表があり、AI調査チームが内容を確認しました。',
        childMeaning: '会社がどんな仕事を進めているかを知るための、新しい手がかりです。',
        whatToWatch: '続報や次の決算で、計画がどこまで進んだかを確認します。',
      };
  }
}

export function analyzeNvidiaFeed(xml: string, now = new Date()): CompanyWatchReport {
  const item = xml.match(/<item>([\s\S]*?)<\/item>/)?.[1];
  if (!item) throw new Error('NVIDIAの公式RSSに発表がありません');
  const sourceHeadline = tag(item, 'title');
  const sourceUrl = tag(item, 'link');
  const description = tag(item, 'description');
  const sourcePublishedAt = new Date(tag(item, 'pubDate')).toISOString();
  if (!sourceHeadline || !sourceUrl || !Number.isFinite(Date.parse(sourcePublishedAt))) {
    throw new Error('NVIDIAの公式RSSを読み取れませんでした');
  }
  const category = classify(`${sourceHeadline} ${description}`);
  return {
    companyId: 'nvidia',
    companyName: 'NVIDIA',
    roomProductId: 'nvidia-watch',
    sourceType: 'official-press-release',
    sourceName: 'NVIDIA Newsroom',
    sourceUrl,
    sourcePublishedAt,
    sourceHeadline,
    category,
    ...explanation(category),
    cue: 'music',
    generatedAt: now.toISOString(),
    status: 'live',
    notice: '公式発表を機械的に分類した学習用の説明です。投資のおすすめではありません。',
  };
}

export function fallbackNvidiaReport(now = new Date()): CompanyWatchReport {
  const category = 'ai-product';
  return {
    companyId: 'nvidia',
    companyName: 'NVIDIA',
    roomProductId: 'nvidia-watch',
    sourceType: 'official-press-release',
    sourceName: 'NVIDIA Newsroom',
    sourceUrl: FALLBACK_SOURCE_URL,
    sourcePublishedAt: '2026-08-24T15:00:00.000Z',
    sourceHeadline:
      'NVIDIA Groq 3 LPX Now in Full Production With World-Class Speed for Agentic AI',
    category,
    ...explanation(category),
    cue: 'music',
    generatedAt: now.toISOString(),
    status: 'fallback',
    notice:
      '公式RSSへ接続できないため、最後に確認済みの公式発表を表示しています。投資のおすすめではありません。',
  };
}

let cache: { expiresAt: number; report: CompanyWatchReport } | null = null;

export async function getNvidiaWatchReport(now = new Date()): Promise<CompanyWatchReport> {
  if (cache && cache.expiresAt > now.getTime()) return cache.report;
  try {
    const response = await fetch(NVIDIA_PRESS_RELEASE_FEED, {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`NVIDIA RSS: ${response.status}`);
    const report = analyzeNvidiaFeed(await response.text(), now);
    cache = { expiresAt: now.getTime() + 15 * 60_000, report };
    return report;
  } catch {
    const report = fallbackNvidiaReport(now);
    cache = { expiresAt: now.getTime() + 5 * 60_000, report };
    return report;
  }
}
