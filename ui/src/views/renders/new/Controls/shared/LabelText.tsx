export type LabelTextProps = {
  text: string;
  type: 'bold' | 'light';
};

export function LabelText(props: LabelTextProps) {
  const { text, type } = props;

  switch (type) {
    case 'bold': {
      return <h2 className="text-xl font-bold">{text}</h2>;
    }
    case 'light': {
      return <h2 className="text-lg font-light italic">{text}</h2>;
    }
  }
}
