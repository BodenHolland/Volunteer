import React from "react";

/** Minimal markdown renderer for our seed content: ##/### headings, - and N. lists, **bold**, paragraphs. */
function inline(text: string, keyBase: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={`${keyBase}-b${i++}`} className="font-semibold text-ink">{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  const lines = children.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (para.length) {
      blocks.push(
        <p key={key++} className="text-body leading-relaxed">
          {inline(para.join(" "), `p${key}`)}
        </p>
      );
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const items = list.items.map((it, idx) => (
        <li key={idx} className="text-body leading-relaxed">{inline(it, `li${key}-${idx}`)}</li>
      ));
      blocks.push(
        list.ordered ? (
          <ol key={key++} className="ml-5 list-decimal space-y-1.5">{items}</ol>
        ) : (
          <ul key={key++} className="ml-5 list-disc space-y-1.5">{items}</ul>
        )
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    if (line.startsWith("### ")) {
      flushPara(); flushList();
      blocks.push(<h3 key={key++} className="mt-4 text-base font-semibold text-ink">{inline(line.slice(4), `h${key}`)}</h3>);
    } else if (line.startsWith("## ")) {
      flushPara(); flushList();
      blocks.push(<h2 key={key++} className="mt-5 text-lg font-semibold text-ink">{inline(line.slice(3), `h${key}`)}</h2>);
    } else if (/^\d+\.\s/.test(line)) {
      flushPara();
      if (!list || !list.ordered) { flushList(); list = { ordered: true, items: [] }; }
      list.items.push(line.replace(/^\d+\.\s/, ""));
    } else if (/^[-*]\s/.test(line)) {
      flushPara();
      if (!list || list.ordered) { flushList(); list = { ordered: false, items: [] }; }
      list.items.push(line.replace(/^[-*]\s/, ""));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();

  return <div className={className ? className : "space-y-3"}>{blocks}</div>;
}
