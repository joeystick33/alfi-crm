'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn('prose-sm max-w-none prose-slate [&>*:first-child]:mt-0', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-[1.7] text-[13px] text-slate-700">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-slate-500 italic">{children}</em>
          ),
          h1: ({ children }) => (
            <h3 className="text-[15px] font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-100">{children}</h3>
          ),
          h2: ({ children }) => (
            <h4 className="text-[14px] font-bold text-slate-900 mt-3.5 mb-1.5 flex items-center gap-1.5">{children}</h4>
          ),
          h3: ({ children }) => (
            <h5 className="text-[13px] font-semibold text-slate-800 mt-3 mb-1">{children}</h5>
          ),
          ul: ({ children }) => (
            <ul className="ml-0.5 mb-2.5 space-y-1 list-none">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-4 mb-2.5 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-[1.65] text-[13px] text-slate-700 flex items-start gap-1.5 before:content-['–'] before:text-slate-400 before:font-medium before:shrink-0 before:mt-px">{children}</li>
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isInline = !codeClassName
            return isInline ? (
              <code className="bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded text-[11.5px] font-mono font-medium" {...props}>{children}</code>
            ) : (
              <code className={cn('block bg-slate-900 text-slate-100 p-3 rounded-xl text-xs font-mono overflow-x-auto my-2.5', codeClassName)} {...props}>{children}</code>
            )
          },
          pre: ({ children }) => <div className="my-2.5">{children}</div>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-violet-400 bg-violet-50/40 pl-3 py-2 my-2.5 rounded-r-lg text-slate-600 text-[13px] italic">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 shadow-sm">
              <table className="min-w-full text-[12px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50/80 text-slate-600">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-2.5 py-1.5 text-left font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-2.5 py-2 border-b border-slate-50 text-slate-700">{children}</td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-25 transition-colors">{children}</tr>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 underline decoration-violet-300 underline-offset-2 transition-colors">
              {children}
            </a>
          ),
          hr: () => <hr className="my-3.5 border-slate-150" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
