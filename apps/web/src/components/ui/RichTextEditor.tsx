import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	Bold,
	Italic,
	List,
	ListOrdered,
	Quote,
	Redo,
	Undo,
} from "lucide-react";

interface RichTextEditorProps {
	content: string;
	onChange: (content: string) => void;
	disabled?: boolean;
}

export function RichTextEditor({
	content,
	onChange,
	disabled,
}: RichTextEditorProps) {
	const editor = useEditor({
		extensions: [StarterKit],
		content,
		editable: !disabled,
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
		editorProps: {
			attributes: {
				class:
					"w-full min-h-[150px] border border-slate-200 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800",
			},
		},
	});

	if (!editor) return null;

	return (
		<div className={`flex flex-col ${disabled ? "opacity-60" : ""}`}>
			<style>{`
				.ProseMirror { outline: none; min-height: 150px; padding: 12px; }
				.ProseMirror p { margin-bottom: 0.5em; }
				.ProseMirror ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.5em; }
				.ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 0.5em; }
				.ProseMirror blockquote { border-left: 3px solid #cbd5e1; padding-left: 1em; color: #64748b; font-style: italic; margin-bottom: 0.5em; }
			`}</style>
			<div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border border-slate-200 border-b-0 rounded-t-md">
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBold().run()}
					disabled={
						!editor.can().chain().focus().toggleBold().run() || disabled
					}
					className={`p-1.5 rounded hover:bg-slate-200 ${
						editor.isActive("bold")
							? "bg-slate-200 text-slate-900"
							: "text-slate-600"
					}`}
					title="Bold"
				>
					<Bold className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleItalic().run()}
					disabled={
						!editor.can().chain().focus().toggleItalic().run() || disabled
					}
					className={`p-1.5 rounded hover:bg-slate-200 ${
						editor.isActive("italic")
							? "bg-slate-200 text-slate-900"
							: "text-slate-600"
					}`}
					title="Italic"
				>
					<Italic className="w-4 h-4" />
				</button>

				<div className="w-px h-5 bg-slate-300 mx-1" />

				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					disabled={disabled}
					className={`p-1.5 rounded hover:bg-slate-200 ${
						editor.isActive("bulletList")
							? "bg-slate-200 text-slate-900"
							: "text-slate-600"
					}`}
					title="Bullet List"
				>
					<List className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					disabled={disabled}
					className={`p-1.5 rounded hover:bg-slate-200 ${
						editor.isActive("orderedList")
							? "bg-slate-200 text-slate-900"
							: "text-slate-600"
					}`}
					title="Numbered List"
				>
					<ListOrdered className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					disabled={disabled}
					className={`p-1.5 rounded hover:bg-slate-200 ${
						editor.isActive("blockquote")
							? "bg-slate-200 text-slate-900"
							: "text-slate-600"
					}`}
					title="Quote"
				>
					<Quote className="w-4 h-4" />
				</button>

				<div className="w-px h-5 bg-slate-300 mx-1" />

				<button
					type="button"
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().chain().focus().undo().run() || disabled}
					className="p-1.5 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30"
					title="Undo"
				>
					<Undo className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().chain().focus().redo().run() || disabled}
					className="p-1.5 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30"
					title="Redo"
				>
					<Redo className="w-4 h-4" />
				</button>
			</div>
			<EditorContent editor={editor} />
		</div>
	);
}
