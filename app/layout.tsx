import type { Metadata } from "next";
import { Golos_Text, Playfair_Display } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { CookieBanner } from "@/components/cookie-banner";

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["cyrillic", "latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["cyrillic", "latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Репетитор.Платформа — кабинет репетитора по математике и английскому",
  description:
    "Платформа для репетиторов по математике и английскому: банк задач, программа по кодификатору, тесты с автопроверкой, рабочие листы, расписание и оплаты.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${golos.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
