"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, Italic, List, ListOrdered, 
  Heading1, Heading2, Quote, Link as LinkIcon, Image as ImageIcon 
} from 'lucide-react';
import { useCallback } from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// 1. Починили тип здесь (убрали any, поставили строгий Editor | null)
const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  const addImage = useCallback(() => {
    const url = window.prompt('URL картинки:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL ссылки:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-xl">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition ${editor.isActive('bold') ? 'bg-white dark:bg-slate-800 text-violet-500 shadow-sm' : 'text-slate-500'}`}
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition ${editor.isActive('italic') ? 'bg-white dark:bg-slate-800 text-violet-500 shadow-sm' : 'text-slate-500'}`}
      >
        <Italic size={16} />
      </button>
      
      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition ${editor.isActive('heading', { level: 2 }) ? 'bg-white dark:bg-slate-800 text-violet-500 shadow-sm' : 'text-slate-500'}`}
      >
        <Heading1 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition ${editor.isActive('heading', { level: 3 }) ? 'bg-white dark:bg-slate-800 text-violet-500 shadow-sm' : 'text-slate-500'}`}
      >
        <Heading2 size={16} />
      </button>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition ${editor.isActive('bulletList') ? 'bg-white dark:bg-slate-800 text-violet-500 shadow-sm' : 'text-slate-500'}`}
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition ${editor.isActive('orderedList') ? 'bg-white dark:bg-slate-800 text-violet-500 shadow-sm' : 'text-slate-500'}`}
      >
        <ListOrdered size={16} />
      </button>

      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 self-center" />

      <button type="button" onClick={setLink} className={`p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition ${editor.isActive('link') ? 'bg-white dark:bg-slate-800 text-violet-500 shadow-sm' : 'text-slate-500'}`}>
        <LinkIcon size={16} />
      </button>
      <button type="button" onClick={addImage} className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition text-slate-500">
        <ImageIcon size={16} />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition ${editor.isActive('blockquote') ? 'bg-white dark:bg-slate-800 text-violet-500 shadow-sm' : 'text-slate-500'}`}>
        <Quote size={16} />
      </button>
    </div>
  );
};

export default function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || 'Начните писать...' }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-6 py-4 prose-p:my-2 prose-p:leading-snug prose-li:my-0 prose-ul:my-2 prose-headings:mb-2 prose-headings:mt-4',
      },
    },
    // 2. Починили тип здесь! (Именно на это ругался компилятор)
    onUpdate: ({ editor }: { editor: Editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  return (
    <div className="w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}