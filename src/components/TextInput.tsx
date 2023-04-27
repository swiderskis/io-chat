interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

const TextInput = (props: TextInputProps) => {
  return (
    <>
      <input
        className="h-10 grow rounded-full bg-zinc-500 px-4 py-2 focus:outline-none"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      ></input>
      <div className={`ml-2 ${props.value.length === 0 ? "hidden" : "block"}`}>
        <button className="rounded-full bg-lime-950 p-2 hover:rounded-xl active:bg-lime-900">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            {props.children}
          </svg>
        </button>
      </div>
    </>
  );
};

export default TextInput;
