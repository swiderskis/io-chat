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
  const [showChatListMobile, setShowChatListMobile] = useState(true);

  return (
    <>
      <Head>
        <title>io.chat</title>
        <meta name="description" content="io.chat" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className="flex h-screen w-screen flex-col">
        <header className="flex h-fit w-full bg-zinc-950 px-2 py-1">
          <button
            className="block md:hidden"
            onClick={() =>
              setShowChatListMobile((showChatListMobile) => !showChatListMobile)
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <span className="pl-2 md:pl-0">io.chat</span>
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
            showChatListMobile={showChatListMobile}
            setShowChatListMobile={() => setShowChatListMobile(false)}
          />
          {selectedChatId ? (
            <ChatWindow
              chatId={selectedChatId}
              showChatListMobile={showChatListMobile}
            />
          ) : (
            <div
              className={`${
                showChatListMobile ? "hidden md:flex" : "flex"
              } w-screen flex-col md:w-[calc(100%-384px)]`}
            ></div>
          )}
        </main>
      </div>
    </>
  );
};

interface ChatWindowProps {
  chatId: number;
  showChatListMobile: boolean;
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
      (_payload) => {
        void ctx.chat.getMessages.invalidate();
        void ctx.chat.getChatList.invalidate();
      }
    )
    .subscribe();

  if (messagesLoading)
    return (
      <div
        className={`${
          props.showChatListMobile ? "hidden md:flex" : "flex"
        } w-screen flex-col md:w-[calc(100%-384px)]`}
      >
        <Loading />
      </div>
    );

  if (!user.user || !messages)
    return (
      <div
        className={`${
          props.showChatListMobile ? "hidden md:flex" : "flex"
        } w-screen flex-col md:w-[calc(100%-384px)]`}
      >
        Error
      </div>
    );

  return (
    <div
      className={`${
        props.showChatListMobile ? "hidden md:flex" : "flex"
      } w-screen flex-col md:w-[calc(100%-384px)]`}
    >
      <ChatHeader chatId={props.chatId} />
      <div className="no-scrollbar scroll flex h-full w-full flex-col-reverse overflow-y-auto pt-1">
        {messages.map((messageDetails) => (
          <Fragment key={messageDetails.message.id}>
            <ChatMessage
              message={messageDetails.message.message}
              timestamp={messageDetails.message.sentAt}
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
      <div className="-mt-[2px] flex items-center px-3 pb-1 text-2xl">
        {chatDetailsLoading || !chatDetails || chatDetails.length > 1 ? (
          <span>User</span>
        ) : (
          <span>{chatDetails[0]?.userDetails?.username}</span>
        )}
      </div>
    </div>
  );
};

interface ChatMessageProps {
  message: string;
  timestamp: Date;
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
      {props.senderId === props.userId ? (
        <span className="flex items-end pb-2 pr-2 text-xs">
          {props.timestamp.getDate()}/
          {`0${props.timestamp.getMonth() + 1}`.slice(-2)}{" "}
          {props.timestamp.getHours()}:
          {`0${props.timestamp.getMinutes()}`.slice(-2)}
        </span>
      ) : null}
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
      {props.senderId === props.userId ? null : (
        <span className="flex items-end pb-2 pl-2 text-xs">
          {props.timestamp.getDate()}/
          {`0${props.timestamp.getMonth() + 1}`.slice(-2)}{" "}
          {props.timestamp.getHours()}:
          {`0${props.timestamp.getMinutes()}`.slice(-2)}
        </span>
      )}
    </div>
  );
};

interface MessageBarProps {
  chatId: number;
}

const MessageBar = (props: MessageBarProps) => {
  const [message, setMessage] = useState("");

  const { mutate: postMessage, isLoading: postMessageLoading } =
    api.chat.sendMessage.useMutation({
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
      <TextInput
        value={message}
        onChange={setMessage}
        disabled={postMessageLoading}
      >
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
      </TextInput>
    </form>
  );
};

interface ChatListProps {
  selectedChatId: number | undefined;
  setSelectedChatId: (chatId: number) => void;
  showChatListMobile: boolean;
  setShowChatListMobile: () => void;
}

const ChatList = (props: ChatListProps) => {
  const [usernameSearch, setUsernameSearch] = useState("");
  const [showUsernameSearch, setShowUsernameSearch] = useState(false);

  const { data: chatList, isLoading: chatIdListLoading } =
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

  if (chatIdListLoading)
    return (
      <div
        className={`no-scrollbar ${
          props.showChatListMobile ? "flex" : "hidden md:flex"
        } h-full w-screen flex-col overflow-y-auto bg-zinc-800 py-1 md:w-96`}
      >
        <Loading />
      </div>
    );

  if (!chatList)
    return (
      <div
        className={`no-scrollbar ${
          props.showChatListMobile ? "flex" : "hidden md:flex"
        } h-full w-screen flex-col overflow-y-auto bg-zinc-800 py-1 md:w-96`}
      >
        Error
      </div>
    );

  return (
    <nav
      className={`no-scrollbar ${
        props.showChatListMobile ? "flex" : "hidden md:flex"
      } h-full w-screen flex-col overflow-y-auto bg-zinc-800 py-1 md:w-96`}
    >
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
            <TextInput
              value={usernameSearch}
              onChange={setUsernameSearch}
              disabled={false}
            >
              <path
                fill-rule="evenodd"
                d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z"
                clip-rule="evenodd"
              />
            </TextInput>
          </form>
        </div>
      </div>
      {chatList.map((chatDetails) => (
        <Fragment key={chatDetails.chatId}>
          <ChatListItem
            chatId={chatDetails.chatId}
            setSelectedChatId={props.setSelectedChatId}
            selected={chatDetails.chatId === props.selectedChatId}
            lastMessage={chatDetails.message}
            lastMessageUserId={chatDetails.userId}
            lastMessageSentAt={chatDetails.sentAt}
            setShowChatListMobile={props.setShowChatListMobile}
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
  lastMessage: string;
  lastMessageUserId: string;
  lastMessageSentAt: Date;
  setShowChatListMobile: () => void;
}

const ChatListItem = (props: ChatListItemProps) => {
  const user = useUser();

  const { data: chatDetails, isLoading: chatDetailsLoading } =
    api.chat.getChatDetails.useQuery({ chatId: props.chatId });

  return (
    <div className="px-2 py-1">
      <button
        className={`flex w-full rounded-md bg-zinc-600 ${
          props.selected ? "bg-opacity-60" : "bg-opacity-40"
        } p-2 text-left hover:bg-opacity-80`}
        onClick={() => {
          props.setSelectedChatId(props.chatId);
          props.setShowChatListMobile();
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
            <span>User</span>
          ) : (
            <span>{chatDetails[0]?.userDetails?.username}</span>
          )}
          <span className="truncate text-xs">
            {props.lastMessage &&
            user.user &&
            user.user.id &&
            props.lastMessageUserId === user.user.id
              ? "You: "
              : ""}
            {props.lastMessage}
          </span>
        </div>
        <div className="flex grow flex-col p-1 text-end text-xs">
          <span>
            {props.lastMessageSentAt.getDate()}/
            {`0${props.lastMessageSentAt.getMonth() + 1}`.slice(-2)}
          </span>
          <span>
            {props.lastMessageSentAt.getHours()}:
            {`0${props.lastMessageSentAt.getMinutes()}`.slice(-2)}
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
