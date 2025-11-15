import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useLibraryStore } from "./useLibraryStore";

const getSelectedIds = () =>
  Array.from(useLibraryStore.getState().selectedMangaIds.values());

describe("useLibraryStore", () => {
  beforeEach(() => {
    useLibraryStore.setState({
      selectedMangaIds: new Set(),
      viewMode: "grid",
      sortBy: "title",
    });
  });

  it("adds unique manga ids when selecting", () => {
    act(() => {
      const { selectManga } = useLibraryStore.getState();
      selectManga("a");
      selectManga("a");
    });

    expect(getSelectedIds()).toEqual(["a"]);
  });

  it("removes ids when deselecting", () => {
    act(() => {
      const { selectManga, deselectManga } = useLibraryStore.getState();
      selectManga("a");
      selectManga("b");
      deselectManga("a");
    });

    expect(getSelectedIds()).toEqual(["b"]);
  });

  it("clears the selection only when needed", () => {
    act(() => {
      useLibraryStore.getState().selectManga("a");
      useLibraryStore.getState().clearSelection();
      useLibraryStore.getState().clearSelection();
    });

    expect(getSelectedIds()).toEqual([]);
  });

  it("updates view and sort settings", () => {
    act(() => {
      useLibraryStore.getState().setViewMode("list");
      useLibraryStore.getState().setSortBy("lastRead");
    });

    expect(useLibraryStore.getState().viewMode).toBe("list");
    expect(useLibraryStore.getState().sortBy).toBe("lastRead");
  });
});
