import { window } from "vscode";

async function promptAnswers(
  questions: [string, string][],
): Promise<[string, string | undefined][]> {
  const [first, ...rest] = questions;
  const [key, prompt] = first;
  const firstAnswer = await window.showInputBox({ prompt });
  return rest.length > 0
    ? [[key, firstAnswer], ...(await promptAnswers(rest))]
    : [[key, firstAnswer]];
}

export default async function ask(questions: object | undefined) {
  if (!questions) return {};
  const answers = await promptAnswers(Object.entries(questions));
  return answers
    .filter(([, value]) => value)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}
