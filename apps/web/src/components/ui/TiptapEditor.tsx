"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
	Bold,
	Code,
	Heading1,
	Heading2,
	Italic,
	List,
	ListOrdered,
	Quote,
	Redo,
	Strikethrough,
	Undo,
} from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
	content: string;
	onChange: (content: string) => void;
	placeholder?: string;
}

export function TiptapEditor({
	content,
	onChange,
	placeholder,
}: TiptapEditorProps) {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
			}),
		],
		content,
		editorProps: {
			attributes: {
				class:
					"prose prose-sm sm:prose-base focus:outline-none max-w-none min-h-[150px] p-4 bg-white border border-t-0 rounded-b-md",
			},
		},
		onUpdate: ({ editor }) => {
			onChange(editor.getHTML());
		},
	});

	// Update content when prop changes externally (e.g., reset form)
	useEffect(() => {
		if (editor && content !== editor.getHTML()) {
			editor.commands.setContent(content);
		}
	}, [content, editor]);

	if (!editor) return null;

	const ToolButton = ({
		isActive,
		onClick,
		disabled,
		children,
		"aria-label": ariaLabel,
	}: any) => (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={ariaLabel}
			className={cn(
				"p-1.5 rounded-sm hover:bg-slate-200 transition-colors focus:outline-none",
				isActive ? "bg-slate-200 text-primary" : "text-slate-600",
				disabled && "opacity-50 cursor-not-allowed",
			)}
		>
			{children}
		</button>
	);

	return (
		<div className="flex flex-col w-full border border-slate-200 rounded-md overflow-hidden">
			<div className="flex flex-wrap items-center gap-1 bg-slate-50 p-2 border-b border-slate-200">
				<ToolButton
					isActive={editor.isActive("bold")}
					onClick={() => editor.chain().focus().toggleBold().run()}
					aria-label="Toggle bold"
				>
					<Bold className="h-4 w-4" />
				</ToolButton>
				<ToolButton
					isActive={editor.isActive("italic")}
					onClick={() => editor.chain().focus().toggleItalic().run()}
					aria-label="Toggle italic"
				>
					<Italic className="h-4 w-4" />
				</ToolButton>
				<ToolButton
					isActive={editor.isActive("strike")}
					onClick={() => editor.chain().focus().toggleStrike().run()}
					aria-label="Toggle strikethrough"
				>
					<Strikethrough className="h-4 w-4" />
				</ToolButton>
				<div className="w-px h-6 bg-slate-200 mx-1" />
				<ToolButton
					isActive={editor.isActive("heading", { level: 1 })}
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 1 }).run()
					}
					aria-label="Toggle heading 1"
				>
					<Heading1 className="h-4 w-4" />
				</ToolButton>
				<ToolButton
					isActive={editor.isActive("heading", { level: 2 })}
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
					aria-label="Toggle heading 2"
				>
					<Heading2 className="h-4 w-4" />
				</ToolButton>
				<div className="w-px h-6 bg-slate-200 mx-1" />
				<ToolButton
					isActive={editor.isActive("bulletList")}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					aria-label="Toggle bullet list"
				>
					<List className="h-4 w-4" />
				</ToolButton>
				<ToolButton
					isActive={editor.isActive("orderedList")}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					aria-label="Toggle ordered list"
				>
					<ListOrdered className="h-4 w-4" />
				</ToolButton>
				<ToolButton
					isActive={editor.isActive("blockquote")}
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					aria-label="Toggle blockquote"
				>
					<Quote className="h-4 w-4" />
				</ToolButton>
				<div className="w-px h-6 bg-slate-200 mx-1" />
				<ToolButton
					isActive={editor.isActive("codeBlock")}
					onClick={() => editor.chain().focus().toggleCodeBlock().run()}
					aria-label="Toggle code block"
				>
					<Code className="h-4 w-4" />
				</ToolButton>
				<div className="flex-1" />
				<ToolButton
					onClick={() => editor.chain().focus().undo().run()}
					disabled={!editor.can().undo()}
					aria-label="Undo"
				>
					<Undo className="h-4 w-4" />
				</ToolButton>
				<ToolButton
					onClick={() => editor.chain().focus().redo().run()}
					disabled={!editor.can().redo()}
					aria-label="Redo"
				>
					<Redo className="h-4 w-4" />
				</ToolButton>
			</div>
			<EditorContent editor={editor} />
		</div>
	);
}
