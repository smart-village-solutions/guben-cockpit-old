import BookingDivider from "./bookingDivider"
import { BookOpenIcon } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import sanitizeHtml from "sanitize-html"
import { useGatewayBookingFaqs } from "@/public-content/hooks"

type DisplayFaq = { id: string; question: string; answer: string; apiProvided: boolean }

export default function BookingFaq() {
  const { t } = useTranslation("booking");
  const faqQuery = useGatewayBookingFaqs()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [overflowingItems, setOverflowingItems] = useState<boolean[]>([])
  const answerRefs = useRef<Array<HTMLDivElement | null>>([])

  const localFaqs = useMemo(
    () => t("faq.items", { returnObjects: true }) as { question: string; answer: string }[],
    [t],
  )
  const faqs: DisplayFaq[] = useMemo(() => faqQuery.data?.items.length
    ? faqQuery.data.items.map((faq) => ({ ...faq, apiProvided: true }))
    : localFaqs.map((faq, index) => ({ id: `local-${index}`, ...faq, apiProvided: false })),
  [faqQuery.data?.items, localFaqs])

  useEffect(() => {
    const measureOverflow = () => {
      setOverflowingItems(
        answerRefs.current.map((answer) => {
          if (!answer) {
            return false
          }

          const hadClampClass = answer.classList.contains("line-clamp-2")

          if (!hadClampClass) {
            answer.classList.add("line-clamp-2")
          }

          const isOverflowing = answer.scrollHeight > answer.clientHeight

          if (!hadClampClass) {
            answer.classList.remove("line-clamp-2")
          }

          return isOverflowing
        }),
      )
    }

    measureOverflow()
    window.addEventListener("resize", measureOverflow)

    return () => {
      window.removeEventListener("resize", measureOverflow)
    }
  }, [faqs])

  useEffect(() => {
    if (expandedId && !faqs.some((faq) => faq.id === expandedId)) {
      setExpandedId(null)
    }
  }, [expandedId, faqs])

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <div>
      <BookingDivider icon={BookOpenIcon} text={t("faq.title")} />
      <div className="my-5 mx-10 mb-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {faqs.map((faq, index) => {
          const isExpanded = expandedId === faq.id
          const isOverflowing = overflowingItems[index] ?? false
          return (
            <div key={faq.id}>
              <div className="text-gubenAccent font-bold">{faq.question}</div>
              <div
                ref={(element) => {
                  answerRefs.current[index] = element
                }}
                className={`${isExpanded ? "" : "line-clamp-2"} text-gray-700 break-words whitespace-pre-wrap`}
                {...(faq.apiProvided
                  ? { dangerouslySetInnerHTML: { __html: sanitizeHtml(faq.answer) } }
                  : { children: faq.answer })}
              />
              {isOverflowing ? (
                <button
                  className="text-gubenAccent hover:underline"
                  onClick={() => toggleExpand(faq.id)} >
                  {isExpanded ? t("faq.showLess") : t("faq.showMore") }
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
