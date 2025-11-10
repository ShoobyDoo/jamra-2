import { CloseButton, Input } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import React, { useState } from "react";

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState<string>("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.currentTarget.value);
  };

  const handleClearSearch = () => {
    setQuery("");
  };

  return (
    <div>
      <Input
        placeholder="Search manga..."
        radius="md"
        value={query}
        w={300}
        onChange={handleSearch}
        leftSection={<IconSearch size={16} />}
        rightSection={
          <CloseButton
            variant="transparent"
            aria-label="Clear input"
            onClick={handleClearSearch}
            style={{ display: query ? undefined : "none" }}
          />
        }
        rightSectionPointerEvents="all"
      />
    </div>
  );
};
