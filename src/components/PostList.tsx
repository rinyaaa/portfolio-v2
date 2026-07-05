import { useState } from "react";
import type { Post } from "../types/post";
import GenreFilter, { ALL_GENRES } from "./GenreFilter";
import PostCard from "./PostCard";
import styles from "./PostList.module.scss";

interface Props {
  posts: Post[];
  genres: string[];
}

export default function PostList({ posts, genres }: Props) {
  const [selected, setSelected] = useState<string>(ALL_GENRES);
  const filtered =
    selected === ALL_GENRES
      ? posts
      : posts.filter((post) => post.genres.includes(selected));

  return (
    <div className={styles.wrap}>
      <GenreFilter genres={genres} selected={selected} onSelect={setSelected} />
      {filtered.length === 0 ? (
        <p className={styles.empty}>このジャンルの記事はまだありません。</p>
      ) : (
        <ul className={styles.grid}>
          {filtered.map((post) => (
            <li key={post.id} className={styles.item}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
