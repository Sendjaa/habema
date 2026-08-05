"use client";

import { useEffect, useRef } from "react";
import OverType, { type OverTypeInstance } from "overtype";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Tulis di sini...",
  minHeight = "140px",
  maxHeight = "420px",
  className,
}: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<OverTypeInstance | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const [editor] = new OverType(containerRef.current, {
      value,
      placeholder,
      autoResize: true,
      minHeight,
      maxHeight,
      toolbar: true,
      smartLists: true,
      showStats: false,
      onChange: (nextValue) => onChangeRef.current(nextValue),
    });
    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getValue() !== value) {
      editor.setValue(value);
    }
  }, [value]);

  return <div ref={containerRef} className={className} />;
}
