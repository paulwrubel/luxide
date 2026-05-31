import CodeMirror, { type Extension } from '@uiw/react-codemirror';
import { basicSetup } from 'codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter, type Diagnostic } from '@codemirror/lint';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import type { EditorView } from '@codemirror/view';
import { RenderConfigSchema, normalizeRenderConfig } from '@/utils/render/config';
import jsonSourceMap from 'json-source-map';

function schemaLintSource(view: EditorView): Diagnostic[] {
  const text = view.state.doc.toString();
  if (!text.trim()) return [];
  try {
    const { data, pointers } = jsonSourceMap.parse(text);
    const normalized = normalizeRenderConfig(data as any);
    const result = RenderConfigSchema.safeParse(normalized);
    if (!result.success) {
      return result.error.issues.map((issue) => {
        const pointer = '/' + issue.path.map(String).join('/');
        const mapping = pointers[pointer];

        if (mapping) {
          return {
            from: mapping.key?.pos ?? mapping.value.pos,
            to: mapping.valueEnd.pos,
            severity: 'error' as const,
            message: `${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`,
          };
        }

        // Fallback: find the line containing the last path segment's key
        const lastSegment = String(issue.path[issue.path.length - 1] ?? '');
        if (lastSegment) {
          const searchIdx = text.indexOf(`"${lastSegment}"`);
          if (searchIdx >= 0) {
            const lineStart = text.lastIndexOf('\n', searchIdx) + 1;
            const lineEnd = text.indexOf('\n', searchIdx);
            return {
              from: lineStart,
              to: lineEnd >= 0 ? lineEnd : text.length,
              severity: 'error' as const,
              message: `${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`,
            };
          }
        }

        // Last resort: highlight entire document
        return {
          from: 0,
          to: text.length,
          severity: 'error' as const,
          message: `${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`,
        };
      });
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
  const extensions: Extension[] = [
    basicSetup,
    json(),
    lintGutter(),
    linter(jsonParseLinter()),
    linter(schemaLintSource, { delay: 400 }),
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
