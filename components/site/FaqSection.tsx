import Link from "next/link";
import ExtLink from "./ExtLink";
import { Faq, type FaqItem as UiFaqItem } from "@/components/ui/faq";
import type { FaqItem } from "@/lib/content-types";

function FollowUp({ item }: { item: FaqItem }) {
  if (!item.href || !item.linkLabel) return null;
  return item.external ? (
    <ExtLink href={item.href} className="faq-link" context={item.linkLabel}>
      {item.linkLabel} <span aria-hidden="true">↗</span>
    </ExtLink>
  ) : (
    <Link href={item.href} className="faq-link">
      {item.linkLabel} <span aria-hidden="true">→</span>
    </Link>
  );
}

/**
 * The questions, as the RareUI FAQ: each question is a button, and its answer is sent back in a bubble
 * with its follow-up link. The copy comes from lib/content.ts. Until the page hydrates (or with JavaScript
 * off) a plain list of every question and answer is shown instead, so nothing is hidden.
 */
export default function FaqSection({ items }: { items: FaqItem[] }) {
  const ui: UiFaqItem[] = items.map((item, i) => ({
    id: `q${i + 1}`,
    question: item.q,
    answer: (
      <>
        <span className="faq-answer__text">{item.a}</span>
        <FollowUp item={item} />
      </>
    ),
  }));

  return (
    <>
      <div className="faq-js">
        <Faq items={ui} accent="#e8121a" avatar={<FaqCrest />} className="faq" />
      </div>
      <dl className="faq-static">
        {items.map((item) => (
          <div key={item.q}>
            <dt>{item.q}</dt>
            <dd>
              <p>{item.a}</p>
              <FollowUp item={item} />
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function FaqCrest() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/brand/crest-512.png" alt="" width={32} height={32} />;
}
