import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import type { Selection } from "react-aria-components";
import styles from "./GenreFilter.module.scss";

export const ALL_GENRES = "__all__";

interface Props {
  genres: string[];
  selected: string;
  onSelect: (genre: string) => void;
}

export default function GenreFilter({ genres, selected, onSelect }: Props) {
  const handleChange = (keys: Selection) => {
    if (keys === "all") return;
    const [first] = keys;
    if (first != null) onSelect(String(first));
  };

  return (
    <ToggleButtonGroup
      className={styles.group}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={new Set([selected])}
      onSelectionChange={handleChange}
      aria-label="ジャンルで絞り込み"
    >
      <ToggleButton id={ALL_GENRES} className={styles.chip}>
        All
      </ToggleButton>
      {genres.map((genre) => (
        <ToggleButton key={genre} id={genre} className={styles.chip}>
          {genre}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
