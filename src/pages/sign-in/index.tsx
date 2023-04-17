import { SignInButton } from "@clerk/nextjs";
import { NextPage } from "next";
import Head from "next/head";

const SignIn: NextPage = () => {
  return (
    <>
      <Head>
        <title>io.chat - Sign in</title>
        <meta name="description" content="Sign in to io.chat"></meta>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen items-start justify-center">
        <div className="flex h-full w-full max-w-3xl flex-col bg-zinc-800 md:mt-32 md:h-fit md:rounded-md md:p-16">
          <div className="h-8 md:hidden"></div>
          <div className="w-full py-4 text-center font-mono text-7xl font-semibold">
            <h1>io.chat</h1>
          </div>
          <div className="h-8"></div>
          <div className="flex w-full grow items-end justify-center py-4">
            <div>
              <SignInButton mode="modal">
                <button className="rounded-md bg-lime-900 px-8 py-4 font-semibold">
                  Sign in
                </button>
              </SignInButton>
            </div>
          </div>
          <div className="h-16 md:hidden"></div>
        </div>
      </main>
    </>
  );
};

export default SignIn;
