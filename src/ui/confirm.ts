import * as readline from "readline";
import chalk from "chalk";

export async function askQuestion(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function askChoice(
  prompt: string,
  choices: string[]
): Promise<number> {
  console.log(prompt);
  choices.forEach((c, i) => {
    console.log(chalk.bold.cyan(`  ${i + 1}. `) + c);
  });

  while (true) {
    const answer = await askQuestion("  Choose (number): ");
    const num = parseInt(answer, 10);
    if (!isNaN(num) && num >= 1 && num <= choices.length) {
      return num;
    }
    console.log(`  Please enter a number from 1 to ${choices.length}.`);
  }
}

export async function confirmTransaction(): Promise<boolean> {
  const answer = await askQuestion(
    chalk.yellow("  Confirm transaction? (y/n): ")
  );
  const normalized = answer.trim().toLowerCase();
  return normalized === "y" || normalized === "yes";
}
