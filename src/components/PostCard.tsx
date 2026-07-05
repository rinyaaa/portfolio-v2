import type { Post } from "../types/post";
import { formatJaDate } from "../lib/formatDate";
import styles from "./PostCard.module.scss";

interface Props {
  post: Post;
}

/** 一覧に並ぶ記事カード（PostList island の中で使う React 版）。 */
export default function PostCard({ post }: Props) {
  return (
    <a href={`/post/${post.id}`} className={styles.card}>
      <div className={styles.thumb}>
          <img
            src={`${post.eyecatch.url}?w=800&fm=webp`}
            alt={post.title}
            width={post.eyecatch.width}
            height={post.eyecatch.height}
            loading="lazy"
          />
      </div>

      <div className={styles.body}>
        {post.date && (
          <time className={styles.date} dateTime={post.date}>
            <svg
              className={styles.calendarIcon}
              viewBox="0 0 24 24"
              width="1em"
              height="1em"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M19 4h-2V3a1 1 0 0 0-2 0v1H9V3a1 1 0 0 0-2 0v1H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3m1 15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7h16Zm0-9H4V7a1 1 0 0 1 1-1h2v1a1 1 0 0 0 2 0V6h6v1a1 1 0 0 0 2 0V6h2a1 1 0 0 1 1 1Z"
              />
            </svg>
            {formatJaDate(post.date)}
          </time>
        )}
        <h3 className={styles.title}>{post.title}</h3>
      </div>
    </a>
  );
}
