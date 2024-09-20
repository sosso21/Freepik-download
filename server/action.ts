"use server";

import { AuthProviderSchema, AuthProviderEnum } from "./type";
import { signIn } from "@/auth";
import { headers } from "next/headers";
import { kv } from "@vercel/kv";
import { Download } from "lucide-react";

export const signInWithProvider = async (provider: AuthProviderEnum) => {
  AuthProviderSchema.parse(provider);
  await signIn(provider);
};

export async function sayHello() {
  const reqHeaders = headers();

  const data = {
    ip: reqHeaders.get("x-forwarded-for") as string,
    userAgent: reqHeaders.get("user-agent"),
    xAppVersion: reqHeaders.get("sec-ch-ua"),
  };

  const key = `${process.env.PROJECT_NAME ?? ""}_${data.ip}`;
  const kv_ip = await kv.get(key);

  await kv.set(key, "OK", {
    ex: +(process.env.TTS_TIME as string) ?? 10,
  });

  if (!kv_ip && process.env.NODE_ENV == "production") {
    //  await prisma.log.create({  data: data, });
  }

  return "OK";
}

export const getVideos = async (keywords: string[], cookies: string) => {
  const freePikUrl = "https://fr.freepik.com";
  const results = [];
  for (let index = 0; index < keywords.length; index++) {
    const elementToSearch = keywords[index];
    const searchCallApi = `${freePikUrl}/api/videos?format[search]=1&license[premium]=1&locale=fr&term=${elementToSearch
      .split(" ")
      .join("+")}&type[search]=1&type[video]=1`;

    const response = await fetch(searchCallApi).then((r) => r.json());

    if (response.items) {
      const videos = [];
      for (let index2 = 0; index2 < 2; index2++) {
        const element = response.items[index2];
        const videoOptionApi = `${freePikUrl}/api/video?id=${element.id}&locale=fr`;
        const responseOptions = await fetch(videoOptionApi).then((r) =>
          r.json()
        );

        const idToDownload = responseOptions.options.filter(
          ({ quality, container, active }: any) =>
            quality !== "4K" && container !== "mov" && active == true
        )[0].id;
        const req3url = `${freePikUrl}/api/video/${element.id}/download?optionId=${idToDownload}`;

        try {
          const response3 = await fetch(req3url, {
            headers: {
              Cookie: cookies,
            },
          }).then((r) => r.json());
          videos.push({
            id: element.id,
            name: element.name,
            Download: response3.url,
          });
        } catch (e) {
          console.log("e:", e);
          throw new Error("COOKIES");
        }
      }

      results.push({
        keyword: elementToSearch,
        videos: [...videos],
      });
    }
  }
  return results;
};
