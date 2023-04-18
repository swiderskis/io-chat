import { SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const { data, isLoading: usernameLoading } =
    api.loginRegister.getUsername.useQuery();

  if (usernameLoading) return <div>Loading</div>;

  if (!data?.username) return <ChooseUsername />;

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen justify-center">
        <div className="h-screen w-full max-w-3xl">
          <span className="flex w-full justify-center">
            <SignOutButton>
              <button>Sign out</button>
            </SignOutButton>
          </span>
          {data.username}
        </div>
      </main>
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
    });

  const submitUsername = () => {
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
        <div className="flex h-full w-full max-w-3xl flex-col justify-center bg-zinc-800 md:mt-32 md:h-fit md:rounded-md md:p-16">
          <span className="flex justify-center">
            <SignOutButton>
              <button>Sign out</button>
            </SignOutButton>
          </span>
          <div className="h-8"></div>
          {user.user?.profileImageUrl ? (
            <>
              <div className="flex justify-center">
                <Image
                  src={user.user?.profileImageUrl}
                  alt="Profile picture"
                  className="rounded-full"
                  width={256}
                  height={256}
                />
              </div>
              <div className="h-8"></div>
            </>
          ) : null}
          <div className="flex justify-center">
            <label className="flex flex-col justify-center">
              <span className="flex justify-center pb-2">Choose username:</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="p-4 text-black"
                disabled={isSubmittingUsername}
              ></input>
            </label>
          </div>
          <div className="h-8"></div>
          <div className="flex justify-center">
            <button
              className="rounded-md bg-lime-900 px-8 py-4 font-semibold"
              onClick={submitUsername}
            >
              Register
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
