// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// One sideways scroll for the registers of a workshop, with their heads held in view.
//
// The registers of a workshop share one minimum width (EntitySection, `groupMinWidth`), so
// below it they all overflow by the same amount - and each carried its own scrollbar at
// its own foot. A register of a thousand rows had that bar a thousand rows down, and
// reading two registers side by side meant scrolling each one on its own.
//
// Here the registers join a group moved by ONE bar, which stands in the study's head under
// the workshop bar, where it is in view whatever is being read. It is drawn here rather than
// being the browser's: a native bar is hidden by the desktop until the pointer happens to
// touch it (GNOME's overlay scrollbars, macOS), and a control nobody can see was reported as
// a control that does not exist.
//
// A register body is clipped, not scrolled, and its table is moved by `--hx`, a transform.
// That is what lets the heads stay put in the other direction - a sticky column head sticks
// to its nearest scroll container, and while every body scrolled sideways, that container
// was the body, which never scrolls vertically, so the heads went up with the rows. Now the
// nearest scroll container is the page, and a register's heading and its column heads stay
// under the study's head for as long as the register is on screen (the CSS under "One
// sideways scroll per workshop"). The whole table moves, title column included: a column
// held while the rest slid beneath it was correct and read as confusing.
//
// A wheel or trackpad moving sideways over a register moves the group too, and a control
// reached by the keyboard is brought into the part in view.
import { createContext, useCallback, useContext, useEffect, useRef, useState,
  type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { t as tr } from "../domain/i18n";

type Group = { add: (el: HTMLElement) => () => void };
const Ctx = createContext<Group | null>(null);

/** Pixels per arrow key, and the share of the view a page step takes. */
const KEY_STEP = 40, PAGE = 0.8;

export function HScrollGroup({ children, barSlot }: { children: ReactNode; barSlot?: HTMLElement | null }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const members = useRef(new Set<HTMLElement>());
  /** How far the registers run past their frame, and how wide the frame is. */
  const [span, setSpan] = useState(0);
  const spanRef = useRef(0), viewRef = useRef(0), pos = useRef(0);

  /** Draws the thumb for the current position; nothing here goes through React state, so a
   *  drag does not re-render the registers. */
  const paint = useCallback(() => {
    const track = trackRef.current, thumb = thumbRef.current, wrap = wrapRef.current;
    const span = spanRef.current, view = viewRef.current, x = pos.current;
    wrap?.style.setProperty("--hx", `${x}px`);
    if (!track || !thumb || !span) return;
    const tw = track.clientWidth;
    const w = Math.max(36, Math.round(tw * view / (view + span)));
    thumb.style.width = `${w}px`;
    thumb.style.transform = `translateX(${Math.round((tw - w) * x / span)}px)`;
    barRef.current?.setAttribute("aria-valuenow", String(Math.round(x)));
  }, []);

  const setPos = useCallback((x: number) => {
    pos.current = Math.max(0, Math.min(spanRef.current, x));
    paint();
  }, [paint]);

  const measure = useCallback(() => {
    let over = 0, view = 0;
    for (const m of members.current) {
      const table = m.firstElementChild as HTMLElement | null;
      if (table) over = Math.max(over, table.offsetWidth - m.clientWidth);
      view = Math.max(view, m.clientWidth);
    }
    // What spans the whole table - an opened detail - is held to the window it is read in.
    if (view) wrapRef.current?.style.setProperty("--hs-view", `${view}px`);
    spanRef.current = over > 1 ? over : 0;
    viewRef.current = view;
    setSpan(spanRef.current);
    setPos(pos.current);   // a narrower range clamps the position
  }, [setPos]);

  const onWheel = useCallback((e: WheelEvent) => {
    const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
    if (!dx || !spanRef.current) return;
    const before = pos.current;
    setPos(before + dx);
    // Taken only where the group actually moved; at either end the page gets the wheel back.
    if (pos.current !== before) e.preventDefault();
  }, [setPos]);

  /** A control reached by the keyboard is brought into the part of the table in view - the
   *  body cannot scroll itself there. */
  const onFocus = useCallback((e: FocusEvent) => {
    const body = e.currentTarget as HTMLElement, t = e.target as HTMLElement;
    if (!spanRef.current || t.closest(".detail-row")) return;
    const view = body.getBoundingClientRect(), r = t.getBoundingClientRect();
    if (r.right > view.right) setPos(pos.current + r.right - view.right + 16);
    else if (r.left < view.left) setPos(pos.current - (view.left - r.left + 16));
  }, [setPos]);

  // One object for the life of the group, so the members' ref callbacks stay stable.
  const group = useRef<Group>({ add: () => () => {} });
  group.current.add = (el: HTMLElement) => {
    members.current.add(el);
    // An attribute, not a class: React owns `className` and rewrites it whole.
    el.dataset.hs = "";
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("focusin", onFocus);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    measure();
    return () => {
      members.current.delete(el);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("focusin", onFocus);
      delete el.dataset.hs;
      ro.disconnect();
      measure();
    };
  };

  // The track changes width with the window; the thumb is drawn against it.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const ro = new ResizeObserver(paint);
    ro.observe(track);
    return () => ro.disconnect();
  }, [paint, span, barSlot]);

  // The bar takes the wheel too, in either direction: it only moves one way.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const wheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      e.preventDefault();
      setPos(pos.current + d);
    };
    bar.addEventListener("wheel", wheel, { passive: false });
    return () => bar.removeEventListener("wheel", wheel);
  }, [setPos, span, barSlot]);

  /** Pressing the thumb drags it; pressing the track beside it moves a page that way. */
  const onTrackDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current, thumb = thumbRef.current;
    if (!track || !thumb || !spanRef.current || e.button !== 0) return;
    e.preventDefault();
    const tr0 = track.getBoundingClientRect(), th = thumb.getBoundingClientRect();
    const room = tr0.width - th.width;
    if (e.target !== thumb) {
      const page = viewRef.current * PAGE;
      setPos(pos.current + (e.clientX < th.left ? -page : page));
      return;
    }
    const x0 = e.clientX, p0 = pos.current;
    thumb.setPointerCapture(e.pointerId);
    thumb.classList.add("dragging");
    const move = (ev: PointerEvent) => { if (room > 0) setPos(p0 + (ev.clientX - x0) * spanRef.current / room); };
    const up = () => {
      thumb.classList.remove("dragging");
      thumb.removeEventListener("pointermove", move);
      thumb.removeEventListener("pointerup", up);
      thumb.removeEventListener("pointercancel", up);
    };
    thumb.addEventListener("pointermove", move);
    thumb.addEventListener("pointerup", up);
    thumb.addEventListener("pointercancel", up);
  };

  const onKey = (e: KeyboardEvent) => {
    const page = viewRef.current * PAGE;
    const to: Record<string, number> = {
      ArrowLeft: pos.current - KEY_STEP, ArrowRight: pos.current + KEY_STEP,
      PageUp: pos.current - page, PageDown: pos.current + page, Home: 0, End: spanRef.current,
    };
    if (e.key in to) { e.preventDefault(); setPos(to[e.key]); }
  };

  const bar = (
    <div className="hbar" ref={barRef} hidden={!span} role="scrollbar" tabIndex={0}
      aria-orientation="horizontal" aria-valuemin={0} aria-valuemax={Math.round(span)}
      aria-label={tr("ui.hscroll.label", "Move the registers sideways")} onKeyDown={onKey}>
      <div className="hbar-track" ref={trackRef} onPointerDown={onTrackDown}>
        <div className="hbar-thumb" ref={thumbRef} />
      </div>
    </div>
  );

  return (
    <div className="hs-group" ref={wrapRef}>
      {barSlot ? createPortal(bar, barSlot) : bar}
      <Ctx.Provider value={group.current}>{children}</Ctx.Provider>
    </div>
  );
}

/** A ref callback that enrols a register body in the workshop's group, where there is one.
 *  Stable across renders, so a re-render does not leave and rejoin. */
export function useHScrollMember(): (el: HTMLElement | null) => void {
  const group = useContext(Ctx);
  const leave = useRef<(() => void) | null>(null);
  return useCallback((el: HTMLElement | null) => {
    leave.current?.();
    leave.current = el && group ? group.add(el) : null;
  }, [group]);
}

/** A ref callback that writes the element's height into a custom property on `on(el)`, and
 *  keeps it current - how a sticky element learns where the ones above it end. */
export function useHeightVar(name: string, on: (el: HTMLElement) => HTMLElement | null) {
  const ro = useRef<ResizeObserver | null>(null);
  useEffect(() => () => ro.current?.disconnect(), []);
  return useCallback((el: HTMLElement | null) => {
    ro.current?.disconnect();
    ro.current = null;
    if (!el) return;
    const write = () => on(el)?.style.setProperty(name, `${Math.round(el.getBoundingClientRect().height)}px`);
    ro.current = new ResizeObserver(write);
    ro.current.observe(el);
    write();
  // `on` is a lookup, fixed per call site.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
}
