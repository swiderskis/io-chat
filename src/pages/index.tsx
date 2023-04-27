import { SignOutButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import { type FormEvent, Fragment, useState } from "react";
import { api } from "~/utils/api";
import Loading from "~/components/Loading";
import defaultProfilePicture from "~/assets/default-profile-picture.png";
import toast from "react-hot-toast";
import genericToastError from "~/utils/genericToastError";
import { createClient } from "@supabase/supabase-js";
import { env } from "~/env.mjs";
import TextInput from "~/components/TextInput";

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_KEY
);

const Home: NextPage = () => {
  const [selectedChatId, setSelectedChatId] = useState<number>();

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
          <ChatList
            selectedChatId={selectedChatId}
            setSelectedChatId={setSelectedChatId}
          />
          {selectedChatId ? (
            <ChatWindow chatId={selectedChatId} />
          ) : (
            <div className="flex w-2/3 grow flex-col"></div>
          )}
          <div className="h-full w-1/6 bg-zinc-800">Contact info</div>
        </main>
      </div>
    </>
  );
};

interface ChatWindowProps {
  chatId: number;
}

const ChatWindow = (props: ChatWindowProps) => {
  const user = useUser();
  const ctx = api.useContext();

  const { data: messages, isLoading: messagesLoading } =
    api.chat.getMessages.useQuery({
      chatId: props.chatId,
    });

  supabase
    .channel(`${props.chatId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ChatMessage",
        filter: `chatId=eq.${props.chatId}`,
      },
      (_payload) => void ctx.chat.getMessages.invalidate()
    )
    .subscribe();

  if (messagesLoading)
    return (
      <div className="w-2/3">
        <Loading />
      </div>
    );

  if (!user.user || !messages) return <div>Error</div>;

  return (
    <div className="flex w-2/3 grow flex-col">
      <ChatHeader chatId={props.chatId} />
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
      <MessageBar chatId={props.chatId} />
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
          <span>Group chat</span>
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

interface MessageBarProps {
  chatId: number;
}

const MessageBar = (props: MessageBarProps) => {
  const [message, setMessage] = useState("");

  const { mutate: postMessage } = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
    },
    onError: (e) => {
      if (e.data?.zodError) {
        const err = e.data.zodError.fieldErrors.message;

        err && err[0] ? toast.error(err[0]) : genericToastError();

        return;
      }

      if (e.data?.httpStatus === 429) {
        toast.error(
          "Slow down! You are trying to send too many messages at once"
        );

        return;
      }

      genericToastError();
    },
  });

  const sendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    postMessage({ message: message, chatId: props.chatId });
  };

  return (
    <form
      className="flex h-fit w-full flex-row items-center p-2"
      onSubmit={sendMessage}
    >
      <TextInput value={message} onChange={setMessage}>
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
      </TextInput>
    </form>
  );
};

interface ChatListProps {
  selectedChatId: number | undefined;
  setSelectedChatId: (chatId: number) => void;
}

const ChatList = (props: ChatListProps) => {
  const [usernameSearch, setUsernameSearch] = useState("");
  const [showUsernameSearch, setShowUsernameSearch] = useState(false);

  const { data: chatIds, isLoading: chatIdsLoading } =
    api.chat.getChatList.useQuery();

  const { data: chatId, refetch: searchUserQuery } =
    api.chat.openOrCreateChat.useQuery(
      {
        username: usernameSearch,
      },
      {
        enabled: false,
        onSuccess: () => {
          if (chatId) props.setSelectedChatId(chatId);
        },
        onError: (e) => {
          if (e.data?.httpStatus === 404) {
            toast.error("User not found!");
            return;
          }

          genericToastError();
        },
      }
    );

  const searchUser = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    void searchUserQuery();
  };

  if (chatIdsLoading)
    return (
      <div className="w-1/6 bg-zinc-800">
        <Loading />
      </div>
    );

  if (!chatIds) return <div>Error</div>;

  return (
    <nav className="no-scrollbar flex h-full w-1/6 flex-col overflow-y-auto bg-zinc-800 py-1">
      <div className="flex w-full justify-center px-2 py-1">
        <button
          className="z-10 w-full rounded-sm border-2 border-zinc-700 bg-zinc-600 py-1 hover:bg-zinc-500"
          onClick={() => {
            showUsernameSearch ? null : setUsernameSearch("");
            setShowUsernameSearch((showNewChatInput) => !showNewChatInput);
          }}
        >
          Search user
        </button>
      </div>
      <div className="relative">
        <div
          className={`w-full ${
            showUsernameSearch
              ? "translate-y-0"
              : "absolute -translate-y-full duration-0"
          } justify-center px-2 py-1 transition ease-in`}
        >
          <form className="flex" onSubmit={searchUser}>
            <TextInput value={usernameSearch} onChange={setUsernameSearch}>
              <path
                fill-rule="evenodd"
                d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z"
                clip-rule="evenodd"
              />
            </TextInput>
          </form>
        </div>
      </div>
      {chatIds.map((chatId) => (
        <Fragment key={chatId}>
          <ChatListItem
            chatId={chatId}
            setSelectedChatId={props.setSelectedChatId}
            selected={chatId === props.selectedChatId ? true : false}
          />
        </Fragment>
      ))}
    </nav>
  );
};

interface ChatListItemProps {
  chatId: number;
  setSelectedChatId: (chatId: number) => void;
  selected: boolean;
}

const ChatListItem = (props: ChatListItemProps) => {
  const user = useUser();
  const ctx = api.useContext();

  const { data: chatDetails, isLoading: chatDetailsLoading } =
    api.chat.getChatDetails.useQuery({ chatId: props.chatId });

  const { data: lastChatMessage } = api.chat.getLastMessage.useQuery({
    chatId: props.chatId,
  });

  supabase
    .channel(`${props.chatId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "ChatMessage",
        filter: `chatId=eq.${props.chatId}`,
      },
      (_payload) => void ctx.chat.getLastMessage.invalidate()
    )
    .subscribe();

  return (
    <div className="px-2 py-1">
      <button
        className={`flex w-full rounded-md bg-zinc-600 ${
          props.selected ? "bg-opacity-60" : "bg-opacity-40"
        } p-2 text-left hover:bg-opacity-80`}
        onClick={() => {
          props.setSelectedChatId(props.chatId);
        }}
      >
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
        <div className="-mt-[2px] flex flex-col truncate px-3">
          {chatDetailsLoading || !chatDetails || chatDetails.length > 1 ? (
            <span>Group chat</span>
          ) : (
            <span>{chatDetails[0]?.userDetails?.username}</span>
          )}
          <span className="truncate text-xs">
            {lastChatMessage &&
            user.user &&
            user.user.id &&
            lastChatMessage.userId === user.user.id
              ? "You: "
              : ""}
            {lastChatMessage ? lastChatMessage.message : <i>No messages</i>}
          </span>
        </div>
      </button>
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
