import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { limparMarcadores } from "@/lib/conteudo";

const COMPONENTES: Components = {
  h1: ({ children }) => <h2 className="text-titulo-2">{children}</h2>,
  h2: ({ children }) => <h2 className="text-titulo-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-titulo-3">{children}</h3>,
  p: ({ children }) => <p>{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-tinta">{children}</strong>,
  ul: ({ children }) => <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-primaria">{children}</ul>,
  ol: ({ children }) => <ol className="flex list-decimal flex-col gap-1.5 pl-5 marker:font-bold marker:text-primaria">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="rounded-cartao bg-primaria-suave px-4 py-3 font-semibold [&>p]:m-0">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto rounded-cartao border-2 border-tinta bg-superficie">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b-2 border-tinta bg-primaria-suave px-3 py-2 font-bold">{children}</th>,
  td: ({ children }) => <td className="border-t border-trilho px-3 py-2 align-top">{children}</td>,
  a: ({ children, href }) => (
    <a href={href} className="font-bold text-primaria underline underline-offset-2">
      {children}
    </a>
  ),
};

export function Markdown({ texto }: { texto: string }) {
  return (
    <div className="flex flex-col gap-4 leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTES} skipHtml>
        {limparMarcadores(texto)}
      </ReactMarkdown>
    </div>
  );
}
