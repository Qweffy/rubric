import { redirect } from "next/navigation";

/**
 * App root. There is no standalone "home" — the console opens on the Suites
 * control tower, so "/" permanently redirects to "/suites".
 */
export default function AppRootPage(): never {
  redirect("/suites");
}
