import { useEffect, useState } from 'react';

import { type CompanyWatchReport, loadNvidiaWatchReport } from './realtimeApi.js';

interface CompanyWatchCardProps {
  onReport?: (report: CompanyWatchReport) => void;
}

const date = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'Asia/Tokyo',
});

export function CompanyWatchCard({ onReport }: CompanyWatchCardProps) {
  const [report, setReport] = useState<CompanyWatchReport | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      try {
        const next = await loadNvidiaWatchReport(controller.signal);
        setReport(next);
        setFailed(false);
        onReport?.(next);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5 * 60_000);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [onReport]);

  if (!report) {
    return (
      <div className="mirai-company-watch is-loading">
        <span>AI企業ウォッチ</span>
        <strong>{failed ? '公式情報を読み込めませんでした' : 'NVIDIAの公式発表を確認中…'}</strong>
      </div>
    );
  }

  return (
    <article className="mirai-company-watch" aria-label="NVIDIAのAI企業ウォッチ">
      <div className="mirai-company-watch-heading">
        <div>
          <span>AI企業ウォッチ · 実在企業</span>
          <strong>NVIDIA</strong>
        </div>
        <span className={`mirai-watch-status mirai-watch-status--${report.status}`}>
          {report.status === 'live' ? '公式情報に接続' : '確認済み情報'}
        </span>
      </div>
      <div className="mirai-watch-activity">
        <span>いまの会社活動</span>
        <strong>{report.activityLabel}</strong>
      </div>
      <section>
        <span>なにがあった？</span>
        <p>{report.whatHappened}</p>
      </section>
      <section>
        <span>子どもの言葉では</span>
        <p>{report.childMeaning}</p>
      </section>
      <section>
        <span>つぎに見守ること</span>
        <p>{report.whatToWatch}</p>
      </section>
      <details>
        <summary>公式発表と注意書き</summary>
        <a href={report.sourceUrl} target="_blank" rel="noreferrer">
          {report.sourceHeadline}
        </a>
        <small>
          {report.sourceName} · {date.format(new Date(report.sourcePublishedAt))}
        </small>
        <p>{report.notice}</p>
      </details>
    </article>
  );
}
