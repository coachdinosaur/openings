export default async function Home() {
  const { default: CatalanApp } = await import("./CatalanApp");
  return <CatalanApp />;
}
