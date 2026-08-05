import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({
  children,
  className,
}: {
  children?: string | null;
  className?: string;
}) {
  if (!children) return null;

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children: c }) => (
            <p className="text-sm leading-relaxed text-slate-600">{c}</p>
          ),
          h1: ({ children: c }) => (
            <h1 className="text-xl font-bold text-slate-900">{c}</h1>
          ),
          h2: ({ children: c }) => (
            <h2 className="text-lg font-bold text-slate-900">{c}</h2>
          ),
          h3: ({ children: c }) => (
            <h3 className="text-base font-bold text-slate-900">{c}</h3>
          ),
          h4: ({ children: c }) => (
            <h4 className="text-sm font-bold text-slate-900">{c}</h4>
          ),
          ul: ({ children: c }) => (
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">{c}</ul>
          ),
          ol: ({ children: c }) => (
            <ol className="list-decimal pl-5 space-y-1 text-sm text-slate-600">{c}</ol>
          ),
          li: ({ children: c }) => <li className="leading-relaxed">{c}</li>,
          strong: ({ children: c }) => (
            <strong className="font-bold text-slate-900">{c}</strong>
          ),
          em: ({ children: c }) => <em className="italic">{c}</em>,
          a: ({ href, children: c }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
            >
              {c}
            </a>
          ),
          code: ({ children: c }) => (
            <code className="px-1.5 py-0.5 rounded bg-stone-100 text-[12px] text-rose-600 font-mono">
              {c}
            </code>
          ),
          pre: ({ children: c }) => (
            <pre className="p-3 rounded-lg bg-stone-900 text-stone-100 text-[12px] overflow-x-auto font-mono">
              {c}
            </pre>
          ),
          blockquote: ({ children: c }) => (
            <blockquote className="border-l-4 border-emerald-600/40 pl-4 text-slate-500 italic">
              {c}
            </blockquote>
          ),
          table: ({ children: c }) => (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">{c}</table>
            </div>
          ),
          th: ({ children: c }) => (
            <th className="border border-stone-200 px-3 py-2 text-left font-bold text-slate-900 bg-stone-50">
              {c}
            </th>
          ),
          td: ({ children: c }) => (
            <td className="border border-stone-200 px-3 py-2 text-slate-600">{c}</td>
          ),
          hr: () => <hr className="border-stone-200" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
