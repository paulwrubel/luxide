export type LabelTextProps = {
  text: string;
  type: 'bold' | 'light';
  className?: string;
  title?: string;
};

export function LabelText(props: LabelTextProps) {
  const { text, type, className, title } = props;

  switch (type) {
    case 'bold': {
      return (
        <h2 className={`text-xl font-bold ${className ?? ''}`} title={title}>
          {text}
        </h2>
      );
    }
    case 'light': {
      return (
        <h2 className={`text-lg font-light italic ${className ?? ''}`} title={title}>
          {text}
        </h2>
      );
    }
  }
}
