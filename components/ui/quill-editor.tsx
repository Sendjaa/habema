"use client";

import { useEffect, useRef, useState } from "react";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function QuillEditor({
  value,
  onChange,
  placeholder = "Deskripsi produk...",
  className = "",
  readOnly = false,
}: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const [quillModule, setQuillModule] = useState<any>(null);
  onChangeRef.current = onChange;

  // Load Quill dynamically on client side only
  useEffect(() => {
    let mounted = true;
    import("quill")
      .then((mod) => {
        if (!mounted) return;
        const m = mod as any;
        // Quill bisa berbentuk class langsung (CJS interop) atau namespace
        // dengan default. Ambil yang benar-benar berupa constructor.
        const QuillClass =
          typeof m === "function"
            ? m
            : typeof m?.default === "function"
              ? m.default
              : m?.default?.default ?? m?.Quill;
        // Penting: setQuillModule(function) akan dianggap React sebagai updater
        // function dan dipanggil tanpa `new` -> "Class constructor Quill cannot be
        // invoked without 'new'". Bungkus dalam closure agar kelasnya disimpan apa adanya.
        setQuillModule(() => QuillClass);
      })
      .catch((e) => console.error("Gagal memuat Quill:", e));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!editorRef.current || quillRef.current || !quillModule) return;

    // Validate it's a constructor
    if (typeof quillModule !== "function") {
      console.error("Quill module is not a function:", quillModule);
      return;
    }

    let quill: any;
    try {
      quill = new quillModule(editorRef.current, {
        theme: "snow",
        placeholder,
        readOnly,
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"],
          ],
        },
      });
    } catch (e) {
      console.error("Failed to create Quill instance:", e);
      return;
    }

    quillRef.current = quill;
    quill.root.innerHTML = value;

    quill.on("text-change", () => {
      onChangeRef.current(quill.root.innerHTML);
    });

    return () => {
      quillRef.current = null;
    };
  }, [placeholder, readOnly, quillModule]);

  useEffect(() => {
    const quill = quillRef.current;
    if (quill && quill.root.innerHTML !== value) {
      quill.root.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="rte-editor">
      <div ref={editorRef} className={className} />
    </div>
  );
}