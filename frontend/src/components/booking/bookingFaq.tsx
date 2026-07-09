import BookingDivider from "./bookingDivider"
import { BookOpenIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

export default function BookingFaq() {
  const { t } = useTranslation("booking");

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [overflowingItems, setOverflowingItems] = useState<boolean[]>([])
  const answerRefs = useRef<Array<HTMLParagraphElement | null>>([])

  const faqs = t("faq.items", { returnObjects: true }) as { question: string; answer: string }[];

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

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index)
  }

  return (
    <div>
      <BookingDivider icon={BookOpenIcon} text={t("faq.title")} />
      <div className="my-5 mx-10 mb-10 grid grid-cols-1 md:grid-cols-2 gap-5">
        {faqs.map((faq, index) => {
          const isExpanded = expandedIndex === index
          const isOverflowing = overflowingItems[index] ?? false
          return (
            <div key={index}>
              <div className="text-gubenAccent font-bold">{faq.question}</div>
              <p
                ref={(element) => {
                  answerRefs.current[index] = element
                }}
                className={`${isExpanded ? "" : "line-clamp-2"} text-gray-700 break-words`}>
                {faq.answer}
              </p>
              {isOverflowing ? (
                <button
                  className="text-gubenAccent hover:underline"
                  onClick={() => toggleExpand(index)} >
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
