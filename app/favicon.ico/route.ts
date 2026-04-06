import { readFile } from "node:fs/promises"
import { join } from "node:path"

export async function GET() {
  const iconPath = join(process.cwd(), "public", "icon-light-32x32.png")
  const icon = await readFile(iconPath)

  return new Response(icon, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  })
}
