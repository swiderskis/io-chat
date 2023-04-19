interface ButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
}

const Button = (props: ButtonProps) => {
  return (
    <button
      className="rounded-md bg-lime-900 px-8 py-4 font-semibold"
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.text}
    </button>
  );
};

export default Button;
