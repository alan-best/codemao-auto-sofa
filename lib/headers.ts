import axios from "axios";
import chalkTemplate from "chalk";
import { existsSync, readFileSync, writeFileSync } from "fs";
import inquirer from "inquirer";
import path from "path";
import { exitWithError } from "./messages";
interface IAccount {
  auth: {
    token: string;
  };
  user_info: {
    id: number;
    nickname: string;
  };
}
const accountFilePath = path.join(__dirname, "../data/account.json");
console.log(accountFilePath);
export default async function getHeaders() {
  let account: IAccount | null = null;
  if (existsSync(accountFilePath)) {
    account = JSON.parse(readFileSync(accountFilePath).toString());
    if (
      !(
        await inquirer.prompt({
          name: "confirm",
          type: "confirm",
          message:
            "你已登录账号：" + account!.user_info.nickname + "，继续使用？",
        })
      ).confirm
    ) {
      account = null;
    }
  }
  if (!account) {
    const loginModes = ["账号密码常规登录", "输入Token"];
    const loginMode = loginModes.indexOf(
      (
        await inquirer.prompt([
          {
            name: "loginMode",
            message: "登录方式",
            type: "list",
            choices: loginModes,
          },
        ])
      ).loginMode
    );
    if (loginMode === 0) {
      const { username, password } = await inquirer.prompt([
        { type: "input", name: "username", message: "用户名/手机号" },
        { type: "password", name: "password", message: "密码（盲打）" },
      ]);
      console.log(chalkTemplate`{yellow 正在获取Ticket}`);

      try {
        const ticket = (
          await axios.post("https://open-service.codemao.cn/captcha/rule", {
            identity: username,
            pid: "65edCTyg",
            timestamp: new Date().getTime(),
          })
        ).data.ticket;
        console.log(chalkTemplate`{yellow 正在登录}`);
        const { data: userData } = await axios.post(
          "https://api.codemao.cn/tiger/v3/web/accounts/login/security",
          {
            identity: username,
            password,
            pid: "65edCTyg",
          },
          { headers: { "X-Captcha-Ticket": ticket } }
        );
        account = userData;
        writeFileSync(accountFilePath, JSON.stringify(userData));
        console.log(userData);
      } catch (e: any) {
        if (e.response) {
          exitWithError(e.response.data.error_message);
        } else {
          exitWithError(e.toString());
        }
      }
    } else {
    }
    console.log(loginMode);
  }
  
  return {Authorization:account!.auth.token};
}
