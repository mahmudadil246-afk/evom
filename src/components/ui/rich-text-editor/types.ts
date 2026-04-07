export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  minHeight?: string;
  disabled?: boolean;
  readOnly?: boolean;
  toolbar?: "full" | "minimal";
}
