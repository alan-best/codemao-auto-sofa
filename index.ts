import axios from "axios";
import chalk from "chalk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import inquirer from "inquirer";
import path from "path/posix";
import getHeaders from "./lib/headers";
import { exitWithError } from "./lib/messages";
const dataDir = path.join(__dirname, "./data");
const lastPostPath = path.join(__dirname, "./data/lastPost");
if (!existsSync(dataDir)) mkdirSync(dataDir);
if (!existsSync(lastPostPath)) writeFileSync(lastPostPath, "422840");
interface IPostDetails {
  title: string;
  created_at: number;
  n_replies: number;
}
function getLastPost() {
  return Number(readFileSync(lastPostPath).toString());
}
function setLasPost(num: number) {
  writeFileSync(lastPostPath, num.toString());
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function main() {
  console.clear();
  const headers = await getHeaders();
  let lastPost = getLastPost();
  let retryTimes = 0;
  let { postId } = await inquirer.prompt({
    name: "postId",
    type: "number",
    default: lastPost,
    message: "起始贴号",
  });
  while (true) {
    console.clear();
    console.log(chalk`{blue.bold 自动抢沙发运行中，按Ctrl+C停止}\n\n`);
    let details: IPostDetails;
    try {
      console.log(chalk`{grey 探测帖子${postId}}`);
      details = (
        await axios.get(
          `https://api.codemao.cn/web/forums/posts/${postId}/details`
        )
      ).data;
    } catch (e: any) {
      if (retryTimes >= 5) postId++;
      if(retryTimes>20)exitWithError("现在似乎很冷清？请尝试重新运行")
      if (e.response.status) {
        console.log(chalk`{red 帖子不存在，继续重试(${retryTimes}/5)...}`);
      }
      retryTimes++;
      await sleep(3e3);
      continue;
    }
    retryTimes = 0;
    if (details.n_replies === 0) {
      setLasPost(postId);
      await axios.post(
        `https://api.codemao.cn/web/forums/posts/${postId}/replies`,
        { content: "<p>沙发</p>" },
        { headers }
      );
      console.log(
        chalk`{green 成功在帖子}{grey ${details.title}}{green 抢到沙发！}\n{grey https://shequ.codemao.cn/community/${postId}}`
      );
      await sleep(5e3);
    } else {
      console.log(chalk`{grey 沙发已经被抢...}`);
      await sleep(5e2);
    }

    postId++;
  }
}
main();
