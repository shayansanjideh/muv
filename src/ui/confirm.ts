export async function confirmTransaction(preview: string): Promise<boolean> {
  console.log(preview);

  return new Promise((resolve) => {
    const onData = (data: Buffer): void => {
      process.stdin.removeListener("data", onData);
      const normalized = data.toString().trim().toLowerCase();
      resolve(normalized === "y" || normalized === "yes");
    };
    process.stdin.once("data", onData);
  });
}
