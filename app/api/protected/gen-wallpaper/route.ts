import { respData, respErr } from "@/lib/resp";

import { ImageGenerateParams } from "openai/resources/images.mjs";
import { User } from "@/types/user";
import { Wallpaper } from "@/types/wallpaper";
import { currentUser } from "@clerk/nextjs";
import { downloadAndUploadImage, generatePresignedUrl } from "@/lib/s3";
import { getOpenAIClient } from "@/services/openai";
import { getUserCredits } from "@/services/order";
import { insertWallpaper } from "@/models/wallpaper";
import { saveUser } from "@/services/user";

import txt2img from "./txt2img.json";

const MALETTE_API_KEY: string = process.env.MALETTE_API_KEY || ''
const COMFYUI_ENDPOINT: string = process.env.COMFYUI_ENDPOINT || ''

const requestComfyUI = async (description: string, text?: string) => {
  txt2img['5'].inputs.Text = description;

    const resp = await fetch(`${COMFYUI_ENDPOINT}/prompt_sync`, {
      "headers": {
        "accept": "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7,ja;q=0.6",
        "comfy-user": "undefined",
        "content-type": "application/json",
        "proxy-connection": "keep-alive"
      },
      "referrer": "http://39.105.144.212:8188/",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": JSON.stringify({
        client_id: Math.random().toString(36).substr(2),
        prompt: txt2img
      }),
      "method": "POST",
      "mode": "cors",
      "credentials": "omit"
    });
    const data = await resp.json();
    const result = data.results['19'].images[0];
    const raw_img_url = `http://39.105.144.212:8188/view?filename=${result.filename}&subfolder=${result.subfolder}&type=${result.type}`;
    console.log("raw_img_url", raw_img_url);
    return raw_img_url;
}

const requestMaletteResults = async (taskId: string) => {
  const resp = await fetch(`https://malette.art/open/api/v1/workflow/text-sticker/results`, {
    "headers": {
      "accept": "application/json",
      "content-type": "application/json",
      'x-malette-authorization': MALETTE_API_KEY
    },
    "method": "POST",
    "body": JSON.stringify({
      "taskId": taskId
    })
  });

  const data = await resp.json();
  console.log("malette results", data);
  return data;
}

const requestMalette = async (description: string, text: string) => {
  const resp = await fetch("https://malette.art/open/api/v1/workflow/text-sticker", {
    "headers": {
      "accept": "application/json",
      "content-type": "application/json",
      'x-malette-authorization': MALETTE_API_KEY
    },
    "body": JSON.stringify({
      "string32": description,
      "text24": text
    }),
    "method": "POST"
  });

  const data = await resp.json();

  const taskId = data.data.publicId;
  let results = await requestMaletteResults(taskId);

  while (results.data.stage !== 'FINISHED') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    results = await requestMaletteResults(taskId);
    console.log("malette results", results);
  }

  return results.data.results[0].result.url;
}

export async function POST(req: Request) {
  const client = getOpenAIClient();

  const user = await currentUser();
  if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
    return respErr("no auth");
  }

  try {
    const { description, text="你真棒" } = await req.json();
    if (!description) {
      return respErr("invalid params");
    }

    // save user
    const user_email = user.emailAddresses[0].emailAddress;
    const nickname = user.firstName;
    const avatarUrl = user.imageUrl;
    const userInfo: User = {
      email: user_email,
      nickname: nickname || "",
      avatar_url: avatarUrl,
    };

    await saveUser(userInfo);

    const user_credits = await getUserCredits(user_email);
    if (!user_credits || user_credits.left_credits < 1) {
      return respErr("credits not enough");
    }

    const raw_img_url = await requestMalette(description, text);

    const currentDate = new Date();
    const created_at = currentDate.toISOString();
    const img_name = encodeURIComponent(description);
    const s3_img = await downloadAndUploadImage(
      raw_img_url,
      process.env.AWS_BUCKET || "malette",
      `txt2img/${img_name}.png`
    );
    console.log('s3_img: ', s3_img);
    const wallpaper: Wallpaper = {
      user_email: user_email,
      img_description: description,
      img_size: `512x512`,
      img_url: `txt2img/${img_name}.png`,
      llm_name: '',
      llm_params: '{}',
      created_at,
    };
    await insertWallpaper(wallpaper);

    return respData({
      ...wallpaper,
      img_url: await generatePresignedUrl(
        process.env.AWS_BUCKET || "malette",
        wallpaper.img_url,
        60 * 60 * 24
      )
    });
  } catch (e) {
    console.log("generate wallpaper failed: ", e);
    return respErr("generate wallpaper failed");
  }
}
