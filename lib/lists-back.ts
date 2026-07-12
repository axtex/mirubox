const STORAGE_KEY = "mirubox-lists-type";
const VALID_TYPES = new Set(["official", "community", "mine"]);

export type ListsTabType = "official" | "community" | "mine";

function parseListsType(value: string | null): ListsTabType {
  if (value && VALID_TYPES.has(value)) return value as ListsTabType;
  return "official";
}

/** Call before navigating to a list detail page. */
export function rememberListsBackTab(): void {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  const onCommunityLists =
    path === "/community" && (tab === "lists" || tab === null);

  if (onCommunityLists) {
    sessionStorage.setItem(STORAGE_KEY, parseListsType(params.get("type")));
  } else {
    sessionStorage.setItem(STORAGE_KEY, "official");
  }
}

export function getListsBackHref(): string {
  const type = parseListsType(
    typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null
  );
  return `/community?tab=lists&type=${type}`;
}
