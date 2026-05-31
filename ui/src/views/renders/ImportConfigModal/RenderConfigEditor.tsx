import CodeMirror, { basicSetup } from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import type { EditorView } from '@codemirror/view';
import { RenderConfigSchema, normalizeRenderConfig } from '@/utils/render/config';

function schemaLintSource(view: EditorView): Diagnostic[] {
  const text = view.state.doc.toString();
  if (!text.trim()) return [];
  try {
    const parsed = JSON.parse(text);
    const normalized = normalizeRenderConfig(parsed as any);
    const result = RenderConfigSchema.safeParse(normalized);
    if (!result.success) {
      return result.error.issues.map((issue) => ({
        from: 0,
        to: text.length,
        severity: 'error' as const,
        message: `${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

interface RenderConfigEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RenderConfigEditor({ value, onChange }: RenderConfigEditorProps) {
  const extensions = [
    ...basicSetup(),
    json(),
    lintGutter(),
    linter(jsonParseLinter()),
    linter(schemaLintSource),
  ];

  return (
    <CodeMirror
      value={value}
      onChange={(val) => onChange(val)}
      extensions={extensions}
      theme={vscodeDark}
      height="24rem"
      className="overflow-hidden rounded-lg border border-zinc-600"
    />
  );
}
