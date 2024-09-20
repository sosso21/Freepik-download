"use client";
import { Nuqs } from "../components/nuqsForm";
import { Cross1Icon, TextAlignRightIcon } from "@radix-ui/react-icons";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useServerTranslation } from "@/lib/use-translation/use-server-translation";
import { LocaleParamsType } from "./types";
import { useState } from "react";

import { getVideos } from "@/server/action";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Download } from "lucide-react";

export default function Home({ params }: LocaleParamsType) {
  const t = useServerTranslation(params.locale, "home");
  const [keyword, setKeyword] = useState<string>("");
  const [toSearch, setToSearch] = useState<string[]>([]);
  const [urls, setUrls] = useState<any[]>([]);
  const [cookies, setCookies] = useState({ showInput: true, content: "" });

  const handleKeywordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setToSearch(
      [...toSearch, ...keyword.split("\n")]
        .map((k) => k.trim().split("  ").join(" "))
        .filter((k) => !!k)
    );
    setKeyword("");
  };

  const handleStartSearch = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    try {
      const result = await getVideos(toSearch, cookies.content);
      setUrls(result);
    } catch (e) {
      setCookies({ showInput: true, content: "" });
      throw new Error("Cookies");
    }
  };

  const handleDownloadAll = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      for (let j = 0; j < url.videos.length; j++) {
        const video = url.videos[j];

        try {
          const videoElement = document.getElementById(video.id);

          // If the element is found, trigger the click event
          if (videoElement) {
            setTimeout(() => {
              videoElement.click();
            }, j * i * 2000);
          } else {
            console.error(`Video element with ID ${video.id} not found`);
          }
        } catch (error) {
          console.error(`Error downloading video with ID ${video.id}`, error);
        }
      }
    }
  };

  return (
    <main className="flex flex-col p-24 min-h-screen">
      <form onSubmit={handleKeywordSubmit} className="w-full wmax-w-96">
        <Textarea
          placeholder={t("enter-keyword")}
          className="w-full min-h-48"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Button type="submit">{t("submit")}</Button>
      </form>
      {toSearch.length > 0 && (
        <section>
          <ul className="my-4 w-full max-w-96">
            {toSearch.map((k, i) => (
              <li key={i} className="flex justify-between">
                {" "}
                <p>{k} </p>{" "}
                <Button
                  variant="outline"
                  onClick={() =>
                    setToSearch(toSearch.filter((_, ii) => ii !== i))
                  }
                >
                  {" "}
                  <Cross1Icon />{" "}
                </Button>{" "}
              </li>
            ))}
          </ul>
          <Button onClick={handleStartSearch}>({t("start-search")})</Button>
        </section>
      )}
      <section className="my-4">
        <Textarea
          placeholder="Cookies"
          value={cookies.content}
          onChange={(e) => setCookies({ ...cookies, content: e.target.value })}
          disabled={!cookies.showInput}
        />
        <Button
          variant={"ghost"}
          disabled={!cookies.showInput}
          onClick={() => setCookies({ ...cookies, showInput: false })}
        >
          {t("save")}
        </Button>
      </section>

      <section
        className={cn("my-4", {
          hidden: !urls.length,
        })}
      >
        {urls.map((url) => (
          <div key={url.keyword} className="my-8">
            <h2 className="text-2xl">{url.keyword} </h2>
            <ul>
              {url.videos.map((video: any) => (
                <li key={video.id} className="flex items-center">
                  <i className="mx-2">#{video.id} </i>{" "}
                  <p className="w-96 overflow-clip">{video.name} </p>
                  <Link
                    id={video.id}
                    href={video.Download}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Button variant="secondary" className="mx-2" size="sm">
                      <Download />{" "}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Button onClick={handleDownloadAll} size={"lg"}>
          <Download /> <p className="mx-2"> {t("download-all")} </p>{" "}
        </Button>
      </section>
    </main>
  );
}
