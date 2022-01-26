import chalk from "chalk";

export function exitWithError(error: string) {
  console.log(chalk`{red.bold 错误：${error}}`);
  process.exit(1);
}
