"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import Underline from "@tiptap/extension-underline";

interface TiptapTextProps {
  content: string;

  onContentChange?: (content: string) => void;
  className?: string;
  placeholder?: string;

}

const TiptapText: React.FC<TiptapTextProps> = ({
  content,
  onContentChange,
  className = "",
  placeholder = "Enter text...",
}) => {
  const editor = useEditor({
    extensions: [StarterKit, Markdown, Underline],
    content: content || placeholder,

    editorProps: {
      attributes: {
        class: `outline-none focus:outline-none transition-all duration-200 ${className}`,
        "data-placeholder": placeholder,
      },
    },
    onBlur: ({ editor }) => {
      const markdown = (editor?.storage as { markdown?: { getMarkdown: () => string } })?.markdown?.getMarkdown() ?? "";
      if (onContentChange) {
        onContentChange(markdown);
      }
    },
    editable: true,
    immediatelyRender: false,
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (!editor) return;
    // Compare against current plain text to avoid unnecessary updates
    const currentText = (editor?.storage as { markdown?: { getMarkdown: () => string } })?.markdown?.getMarkdown() ?? "";
    if ((content || "") !== currentText) {
      editor.commands.setContent(content || "");
    }
  }, [content, editor]);



  if (!editor) {
    return <div className={className}>{content || placeholder}</div>;
  }

  return (
    <EditorContent
      editor={editor}
      className={`tiptap-text-editor w-full`}
      style={{
        // Ensure the editor maintains the same visual appearance
        lineHeight: "inherit",
        fontSize: "inherit",
        fontWeight: "inherit",
        fontFamily: "inherit",
        color: "inherit",
        textAlign: "inherit",
      }}
    />
  );
};

export default TiptapText;
