import { useEffect, useState } from "react";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

interface MarkedOptions {
  gfm: boolean;
  breaks: boolean;
  headerIds: boolean;
  mangle: false;
  highlight?: (code: string, lang: string) => string;
}

const MarkdownRenderer = ({ text }: { text: string }) => {
  const [html, setHtml] = useState("");

  const markedOptions: MarkedOptions = {
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false,
    highlight: (code: string, lang: string): string => code,
  };

  marked.setOptions(markedOptions);

  useEffect(() => {
    const parseMarkdown = async () => {
      let cleanText = text.trim(); //.replace(/;+\s*$/, "");
      let parsed = await marked.parse(cleanText);
      setHtml(parsed.trim() /*.replace(/;+\s*$/, "")*/);
    };
    parseMarkdown();
  }, [text]);

  const sanitizedData = () => ({
    __html: DOMPurify.sanitize(html),
  });

  return <div dangerouslySetInnerHTML={sanitizedData()}></div>;
};

export { MarkdownRenderer };
