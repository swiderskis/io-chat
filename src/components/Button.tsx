interface ButtonProps {
  text: string;
  onClick?: () => void;
}

const Button = (props: ButtonProps) => {
  return (
    <button
      className="rounded-md bg-lime-900 px-8 py-4 font-semibold"
      onClick={props.onClick}
    >
      {props.text}
    </button>
  );
};

export default Button;
