import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  FRONT_ROTATION,
  isBackFace,
  rotationFromDrag,
  snapToNearestFace,
  toggleRotation,
} from "../lib/cardFlip";
import styles from "./BusinessCard.module.scss";

interface Props {
  /** Home の Skill セクションと同じ12技術（アイコンは使わずラベルのみ）。 */
  skills: string[];
  /** QRコード画像が用意できているか（#48時点では未着手のためプレースホルダーにする）。 */
  hasQrCode?: boolean;
}

const DRAG_MOVE_THRESHOLD = 3;

/** ドラッグで回転し、離すと表・裏の近い方に吸着するWeb名刺（#48）。
 * 回転の計算そのものは src/lib/cardFlip.ts の純粋関数に切り出してある。 */
export default function BusinessCard({ skills, hasQrCode = false }: Props) {
  const [rotation, setRotation] = useState(FRONT_ROTATION);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef({ pointerId: null as number | null, startX: 0, startRotation: 0, moved: false });

  const isBack = isBackFace(rotation);

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { pointerId: e.pointerId, startX: e.clientX, startRotation: rotation, moved: false };
    setDragging(true);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragState.current.pointerId !== e.pointerId) return;
    const deltaX = e.clientX - dragState.current.startX;
    if (Math.abs(deltaX) > DRAG_MOVE_THRESHOLD) dragState.current.moved = true;
    const width = e.currentTarget.getBoundingClientRect().width || 1;
    const sensitivity = 180 / width;
    setRotation(rotationFromDrag(dragState.current.startRotation, deltaX, sensitivity));
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragState.current.pointerId !== e.pointerId) return;
    setDragging(false);
    if (dragState.current.moved) {
      setRotation((prev) => snapToNearestFace(prev));
    }
    dragState.current.pointerId = null;
  };

  const handleClick = () => {
    if (dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }
    setRotation((prev) => toggleRotation(prev));
  };

  return (
    <div className={styles.stage}>
      {/* 表・裏の実コンテンツは button の外（兄弟要素）に置く。button の中に入れると
       * role=button は "Children Presentational" のためAT向けの見出し・alt・テキストが
       * すべて剪定され、aria-label だけが読み上げられて中身が伝わらなくなる（#48 レビュー指摘）。
       * button 自体は回転させず常に平面のまま全面に重ね、ドラッグ中も当たり判定を安定させる。 */}
      <button
        type="button"
        className={styles.flipControl}
        aria-pressed={isBack}
        aria-label="名刺を裏返す"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
      />

      <div className={`${styles.card} ${dragging ? styles.dragging : ""}`} style={{ transform: `rotateY(${rotation}deg)` }}>
        <div className={`${styles.face} ${styles.front}`} aria-hidden={isBack}>
          <h2 className={styles.visuallyHidden}>名刺の表</h2>
          <div className={styles.illustrationWrap}>
            <img
              src="/card/illustration.jpg"
              alt="白衣を着たキャラクターと白い動物2匹のイラスト"
              width={627}
              height={758}
              loading="lazy"
            />
          </div>
          <div className={styles.frontInfo}>
            <p className={styles.brand}>nenex</p>
            <p className={styles.role}>Frontend Engineer</p>
            <ul className={styles.tags}>
              <li>#SysHack 2026 運営</li>
              <li>#Matsuriba 運営</li>
              <li>#技育展2025 企業賞</li>
              <li>#React</li>
              <li>#辛い物好き</li>
              <li>#二郎ラーメン好き</li>
            </ul>
            <ul className={styles.socials}>
              <li>
                <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 2.247a10 10 0 0 0-3.162 19.487c.5.088.687-.212.687-.475c0-.237-.012-1.025-.012-1.862c-2.513.462-3.163-.613-3.363-1.175a3.64 3.64 0 0 0-1.025-1.413c-.35-.187-.85-.65-.013-.662a2 2 0 0 1 1.538 1.025a2.137 2.137 0 0 0 2.912.825a2.1 2.1 0 0 1 .638-1.338c-2.225-.25-4.55-1.112-4.55-4.937a3.9 3.9 0 0 1 1.025-2.688a3.6 3.6 0 0 1 .1-2.65s.837-.262 2.75 1.025a9.43 9.43 0 0 1 5 0c1.912-1.3 2.75-1.025 2.75-1.025a3.6 3.6 0 0 1 .1 2.65a3.87 3.87 0 0 1 1.025 2.688c0 3.837-2.338 4.687-4.562 4.937a2.37 2.37 0 0 1 .674 1.85c0 1.338-.012 2.413-.012 2.75c0 .263.187.575.687.475A10.005 10.005 0 0 0 12 2.247"
                  />
                </svg>
                <span>@rinyaaa</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M22 5.8a8.5 8.5 0 0 1-2.36.64a4.13 4.13 0 0 0 1.81-2.27a8.2 8.2 0 0 1-2.61 1a4.1 4.1 0 0 0-7 3.74a11.64 11.64 0 0 1-8.45-4.29a4.16 4.16 0 0 0-.55 2.07a4.09 4.09 0 0 0 1.82 3.41a4.05 4.05 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.3 4a4 4 0 0 1-1.1.17a5 5 0 0 1-.77-.07a4.11 4.11 0 0 0 3.83 2.84A8.22 8.22 0 0 1 3 18.34a8 8 0 0 1-1-.06a11.57 11.57 0 0 0 6.29 1.85A11.59 11.59 0 0 0 20 8.45v-.53a8.4 8.4 0 0 0 2-2.12"
                  />
                </svg>
                <span>@r2e8l</span>
              </li>
            </ul>
            <div className={styles.qr}>
              {hasQrCode ? (
                <img src="/card/qr.png" alt="https://nenex.me へのQRコード" width={96} height={96} loading="lazy" />
              ) : (
                <span className={styles.qrPlaceholder}>
                  QR
                  <br />
                  準備中
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={`${styles.face} ${styles.back}`} aria-hidden={!isBack}>
          <h2 className={styles.visuallyHidden}>名刺の裏</h2>
          <div className={styles.photoWrap}>
            <img
              src="/card/photo.jpg"
              alt="石丸凜弥の写真"
              width={502}
              height={795}
              loading="lazy"
            />
          </div>
          <div className={styles.backInfo}>
            <p className={styles.furigana}>いしまる　りんや</p>
            <p className={styles.name}>石丸 凜弥</p>
            <p className={styles.grade}>28卒</p>
            <p className={styles.affiliation}>
              愛知工業大学
              <br />
              システム工学研究会 代表
            </p>
            <p className={styles.email}>
              <svg viewBox="0 0 24 24" width="1.1em" height="1.1em" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M19 4H5a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3m-.41 2l-5.88 5.88a1 1 0 0 1-1.42 0L5.41 6ZM20 17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7.41l5.88 5.88a3 3 0 0 0 4.24 0L20 7.41Z"
                />
              </svg>
              <span>nenex.aitsysken@gmail.com</span>
            </p>
            <div className={styles.skillBlock}>
              <p className={styles.skillHeading}>Skill</p>
              <ul className={styles.skillList}>
                {skills.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
