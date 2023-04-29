# io-chat

![logo](docs/images/logo.png)

## About

A chat app that allows you to message your friends in real time! 📲
Built using the [T3 Stack](https://create.t3.gg/).

This app is powered by [Supabase](https://supabase.com/), [Clerk](https://clerk.com/), and [Upstash](https://upstash.com/).

## Setting up

After cloning the repo and installing the required packages using `npm i`:

1. Set up projects on [Supabase](https://supabase.com/), [Clerk](https://clerk.com/), and [Upstash](https://upstash.com/), and set the environment variables from them.
2. Migrate the Prisma schema to Supabase using `npx prisma db push`.
3. Enable realtime for ChatMessage table on Supabase (details [here](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)).
4. _(Optional)_ Deploy the project to a platform, such as [Vercel](https://vercel.com/) (recommended) or [Netlify](https://www.netlify.com/).
5. Enjoy!

## Credits

[Flowbite](https://flowbite.com/docs/components/spinner/) - loading spinner

[Heroicons](https://heroicons.com/) - send icon, search icon, burger icon

[Icons8](https://icons8.com/icon/13751/speech-bubble) - favicon
