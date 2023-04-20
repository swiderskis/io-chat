import { SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "~/components/Button";
import genericToastError from "~/utils/genericToastError";
import { api } from "~/utils/api";
import Loading from "~/components/Loading";

const Home: NextPage = () => {
  const [message, setMessage] = useState("");

  const { data, isLoading: usernameLoading } =
    api.loginRegister.getUsername.useQuery();

  if (usernameLoading) return <Loading />;

  if (!data?.username) return <ChooseUsername />;

  return (
    <>
      <Head>
        <title>io.chat</title>
        <meta name="description" content="io.chat" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen w-screen flex-col">
        <header className="flex w-full bg-zinc-950 px-2 py-1">
          <span className="font-thin">io.chat</span>
          <div className="flex grow justify-end">
            <SignOutButton>
              <button>Sign out</button>
            </SignOutButton>
          </div>
        </header>
        <main className="flex h-full w-full flex-row">
          <nav className="h-full w-72 bg-zinc-800">Navbar</nav>
          <div className="flex grow flex-col">
            <div className="h-16 w-full bg-zinc-900">Name</div>
            <div className="w-full grow">Messages</div>
            <div className="flex h-20 w-full flex-row items-center bg-zinc-900 px-2">
              <input
                className="h-[60px] grow rounded-md bg-zinc-500 p-2 focus:border-2 focus:border-lime-950 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              ></input>
              <div
                className={`ml-2 ${message.length === 0 ? "hidden" : "block"}`}
              >
                <Button text="Send" />
              </div>
            </div>
          </div>
          <div className="h-full w-72 bg-zinc-800">Contact info</div>
        </main>
      </div>
    </>
  );
};

const ChooseUsername = () => {
  const [username, setUsername] = useState("");
  const user = useUser();

  const ctx = api.useContext();

  const { mutate: postUsername, isLoading: isSubmittingUsername } =
    api.loginRegister.setUsername.useMutation({
      onSuccess: () => {
        void ctx.loginRegister.getUsername.invalidate();
      },
      onError: (e) => {
        if (e.data?.zodError) {
          const err = e.data.zodError.fieldErrors.username;

          err && err[0] ? toast.error(err[0]) : genericToastError();

          return;
        }

        if (e.data?.httpStatus === 422) {
          toast.error("This username is already in use");

          return;
        }

        genericToastError();
      },
    });

  const submitUsername = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    postUsername({ username: username });
  };

  return (
    <>
      <Head>
        <title>io.chat - Choose username</title>
        <meta name="description" content="Choose username for io.chat" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-zinc-800 md:items-start md:bg-zinc-700">
        <div className="flex h-full w-full max-w-3xl flex-col justify-center bg-zinc-800 md:mt-16 md:h-fit md:rounded-md md:p-16">
          <div className="w-full py-4 text-center font-mono text-7xl font-thin">
            <h1>io.chat</h1>
          </div>
          {/* TO REMOVE */}
          <span className="flex justify-center py-4">
            <SignOutButton>
              <button>Sign out</button>
            </SignOutButton>
          </span>
          {/* TO REMOVE */}
          {user.user?.profileImageUrl ? (
            <>
              <div className="flex justify-center py-4">
                <Image
                  src={user.user?.profileImageUrl}
                  alt="Profile picture"
                  className="rounded-full"
                  width={256}
                  height={256}
                />
              </div>
            </>
          ) : null}
          <form onSubmit={(e) => submitUsername(e)}>
            <div className="flex justify-center py-4">
              <label className="flex flex-col justify-center">
                <span className="flex justify-center pb-2">
                  Choose username:
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-md bg-zinc-500 p-4"
                  disabled={isSubmittingUsername}
                ></input>
              </label>
            </div>
            <div className="flex justify-center py-4">
              <Button text="Register" disabled={isSubmittingUsername} />
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default Home;
