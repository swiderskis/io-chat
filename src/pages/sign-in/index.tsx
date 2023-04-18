import { SignInButton } from "@clerk/nextjs";
import { NextPage } from "next";
import Head from "next/head";
import Button from "~/components/Button";

const SignIn: NextPage = () => {
  return (
    <>
      <Head>
        <title>io.chat - Sign in</title>
        <meta name="description" content="Sign in to io.chat"></meta>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-zinc-800 md:items-start md:bg-zinc-700">
        <div className="mt-0 flex h-full w-full max-w-3xl flex-col justify-center bg-zinc-800 md:mt-16 md:h-fit md:rounded-md md:p-16">
          <div className="w-full py-4 text-center font-mono text-7xl font-thin">
            <h1>io.chat</h1>
          </div>
          <div className="flex w-full items-end justify-center py-4">
            <div>
              <SignInButton mode="modal">
                <Button text="Sign in" />
              </SignInButton>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default SignIn;
