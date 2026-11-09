import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Deskripsi produk dari editor Quill tersimpan sebagai HTML, sedangkan konten
// lama tersimpan sebagai Markdown. Deteksi sederhana: konten yang diawali tag
// HTML dirender sebagai HTML; sisanya lewat ReactMarkdown.
const HTML_PATTERN = /^\s*(<([a-z][\w-]*)\b[^>]*>|<!--)/i;

export function Markdown({
  children,
  className,
}: {
  children?: string | null;
  className?: string;
}) {
  if (!children) return null;

  if (HTML_PATTERN.test(children)) {
    return (
      <div
        className={`rte-content ql-editor text-sm leading-relaxed text-muted-foreground ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: children }}
      />
    );
  }

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children: c }) => (
            <p className="text-sm leading-relaxed text-muted-foreground">{c}</p>
          ),
          h1: ({ children: c }) => (
            <h1 className="text-xl font-bold text-foreground">{c}</h1>
          ),
          h2: ({ children: c }) => (
            <h2 className="text-lg font-bold text-foreground">{c}</h2>
          ),
          h3: ({ children: c }) => (
            <h3 className="text-base font-bold text-foreground">{c}</h3>
          ),
          h4: ({ children: c }) => (
            <h4 className="text-sm font-bold text-foreground">{c}</h4>
          ),
          ul: ({ children: c }) => (
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">{c}</ul>
          ),
          ol: ({ children: c }) => (
            <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">{c}</ol>
          ),
          li: ({ children: c }) => <li className="leading-relaxed">{c}</li>,
          strong: ({ children: c }) => (
            <strong className="font-bold text-foreground">{c}</strong>
          ),
          em: ({ children: c }) => <em className="italic">{c}</em>,
          a: ({ href, children: c }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-info underline underline-offset-2 hover:text-info/80"
            >
              {c}
            </a>
          ),
          code: ({ children: c }) => (
            <code className="px-1.5 py-0.5 rounded-full bg-muted text-[12px] text-secondary font-mono">
              {c}
            </code>
          ),
          pre: ({ children: c }) => (
            <pre className="p-3 rounded-lg bg-foreground text-background text-[12px] overflow-x-auto font-mono">
              {c}
            </pre>
          ),
          blockquote: ({ children: c }) => (
            <blockquote className="border-l-4 border-primary/40 pl-4 text-muted-foreground italic">
              {c}
            </blockquote>
          ),
          table: ({ children: c }) => (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">{c}</table>
            </div>
          ),
          th: ({ children: c }) => (
            <th className="border border-border px-3 py-2 text-left font-bold text-foreground bg-muted">
              {c}
            </th>
          ),
          td: ({ children: c }) => (
            <td className="border border-border px-3 py-2 text-muted-foreground">{c}</td>
          ),
          hr: () => <hr className="border-border" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
