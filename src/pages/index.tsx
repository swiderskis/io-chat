import { SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { Fragment, useState } from "react";
import { api } from "~/utils/api";
import Loading from "~/components/Loading";
import defaultProfilePicture from "~/assets/default-profile-picture.png";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>io.chat</title>
        <meta name="description" content="io.chat" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen w-screen flex-col">
        <header className="flex h-fit w-full bg-zinc-950 px-2 py-1">
          <span>io.chat</span>
          <div className="flex grow justify-end">
            <SignOutButton>
              <button>Sign out</button>
            </SignOutButton>
          </div>
        </header>
        <main className="flex h-[calc(100%-36px)] w-full flex-row">
          <nav className="h-full w-1/6 bg-zinc-800">Navbar</nav>
          <ChatWindow />
          <div className="h-full w-1/6 bg-zinc-800">Contact info</div>
        </main>
      </div>
    </>
  );
};

const ChatWindow = () => {
  const [message, setMessage] = useState("");
  const [chatId, setChatId] = useState(1);
  const user = useUser();

  const { data: messages, isLoading: messagesLoading } =
    api.chat.getMessages.useQuery({
      chatId,
    });

  if (messagesLoading) return <Loading />;

  if (!user.user || !messages) return <div>Error</div>;

  return (
    <div className="flex w-2/3 grow flex-col">
      <ChatHeader chatId={chatId} />
      <div className="no-scrollbar scroll flex h-full w-full flex-col-reverse overflow-y-auto pt-1">
        {messages.map((messageDetails) => (
          <Fragment key={messageDetails.message.id}>
            <ChatMessage
              message={messageDetails.message.message}
              senderId={messageDetails.message.userId}
              userId={user.user.id}
              profileImageDetails={messageDetails.userDetails}
            />
          </Fragment>
        ))}
      </div>
      <div className="flex h-fit w-full flex-row items-center p-2">
        <input
          className="h-10 grow rounded-full bg-zinc-500 px-4 py-2 focus:outline-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></input>
        <div className={`ml-2 ${message.length === 0 ? "hidden" : "block"}`}>
          <button className="rounded-full bg-lime-950 p-2 hover:rounded-xl active:bg-lime-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

interface ChatHeaderProps {
  chatId: number;
}

const ChatHeader = (props: ChatHeaderProps) => {
  const { data: chatDetails, isLoading: chatDetailsLoading } =
    api.chat.getChatDetails.useQuery({ chatId: props.chatId });

  return (
    <div className="flex h-16 w-full flex-row bg-zinc-900 p-2">
      {chatDetails ? (
        <ProfilePictureOrDefault
          width={44}
          height={44}
          profileImageUrl={
            chatDetailsLoading || !chatDetails || chatDetails.length > 1
              ? undefined
              : chatDetails[0]?.userDetails?.profileImageUrl
          }
        />
      ) : (
        <ProfilePictureOrDefault width={44} height={44} />
      )}
      <div className="-mt-[2px] flex flex-col px-3">
        {chatDetailsLoading || !chatDetails || chatDetails.length > 1 ? (
          <span>Chat</span>
        ) : (
          <span>{chatDetails[0]?.userDetails?.username}</span>
        )}
        <span className="text-xs">Last online PLACEHOLDER</span>
      </div>
    </div>
  );
};

interface ChatMessageProps {
  message: string;
  senderId: string;
  userId: string;
  profileImageDetails: { id: string; profileImageUrl: string } | undefined;
}

const ChatMessage = (props: ChatMessageProps) => {
  return (
    <div
      className={`flex px-2 py-1${
        props.senderId === props.userId ? " justify-end" : ""
      }`}
    >
      {props.senderId === props.userId ? null : (
        <div className="pr-2">
          <ProfilePictureOrDefault
            width={44}
            height={44}
            profileImageUrl={props.profileImageDetails?.profileImageUrl}
          />
        </div>
      )}
      <div
        className={`flex min-w-[44px] max-w-[66.66667%] justify-center rounded-3xl px-4 py-2 ${
          props.senderId === props.userId ? "bg-lime-800" : "bg-zinc-500"
        }`}
      >
        <span>{props.message}</span>
      </div>
    </div>
  );
};

interface ProfilePictureOrDefaultProps {
  width: number;
  height: number;
  profileImageUrl?: string | undefined;
}

const ProfilePictureOrDefault = (props: ProfilePictureOrDefaultProps) => {
  return (
    <>
      {props.profileImageUrl ? (
        <Image
          src={props.profileImageUrl}
          alt="Profile picture"
          width={props.width}
          height={props.height}
          className="rounded-full"
        ></Image>
      ) : (
        <Image
          src={defaultProfilePicture}
          alt="Profile picture"
          width={props.width}
          height={props.height}
          className="rounded-full"
        ></Image>
      )}
    </>
  );
};

export default Home;
