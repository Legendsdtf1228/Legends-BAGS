import type { LoaderFunctionArgs } from "react-router";
import { handleBuilderLaunchRequest } from "../lib/builder-launch-handler.server";

export async function loader({ request }: LoaderFunctionArgs) {
  return handleBuilderLaunchRequest(request);
}

export default function BuilderLaunchRoute() {
  return null;
}
