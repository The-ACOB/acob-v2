"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  Handshake,
  Mail,
  MessageCircle,
  X,
} from "lucide-react";

const WHATSAPP_NUMBER = "8801871949508";
const SUPPORT_EMAIL = "reachappliedcognitio@gmail.com";

const topics = [
  {
    label: "Olympiad registration",
    description: "Registration, eligibility, or rules",
    icon: GraduationCap,
    message:
      "Hello ACOB Support! I need help with Olympiad registration. Could you please assist me?",
  },
  {
    label: "Events and announcements",
    description: "Upcoming Olympiads and deadlines",
    icon: CalendarDays,
    message:
      "Hello ACOB Support! I have a question about upcoming events or announcements.",
  },
  {
    label: "Partnerships and collaboration",
    description: "Schools, clubs, media, and partners",
    icon: Handshake,
    message:
      "Hello ACOB Team! I would like to discuss a partnership or collaboration opportunity.",
  },
];

function whatsappUrl(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function WhatsAppSupport() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="acob-support-widget" aria-label="ACOB support">
      {open && (
        <section
          id="acob-support-panel"
          className="acob-support-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="acob-support-title"
        >
          <header className="acob-support-header">
            <div className="acob-support-brand-mark" aria-hidden="true">
              <MessageCircle size={22} strokeWidth={2} />
            </div>
            <div className="acob-support-heading">
              <p className="acob-support-eyebrow">APPLIED COGNITIO OLYMPIAD BANGLADESH</p>
              <h2 id="acob-support-title">How can we help?</h2>
              <p className="acob-support-status">
                <span className="acob-support-status-dot" />
                Chat with our team on WhatsApp
              </p>
            </div>
            <button
              type="button"
              className="acob-support-close"
              onClick={() => setOpen(false)}
              aria-label="Close support chat"
            >
              <X size={19} />
            </button>
          </header>

          <div className="acob-support-body">
            <div className="acob-support-welcome">
              <span className="acob-support-welcome-label">WELCOME TO ACOB</span>
              <p>
                Hello! Tell us what you need help with and we&apos;ll connect you
                with ACOB on WhatsApp.
              </p>
            </div>

            <p className="acob-support-section-label">CHOOSE A TOPIC</p>
            <div className="acob-support-topics">
              {topics.map((topic) => {
                const Icon = topic.icon;
                return (
                  <a
                    className="acob-support-topic"
                    href={whatsappUrl(topic.message)}
                    key={topic.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${topic.label}: open WhatsApp`}
                  >
                    <span className="acob-support-topic-icon" aria-hidden="true">
                      <Icon size={19} strokeWidth={1.7} />
                    </span>
                    <span className="acob-support-topic-copy">
                      <span className="acob-support-topic-title">{topic.label}</span>
                      <span className="acob-support-topic-description">
                        {topic.description}
                      </span>
                    </span>
                    <ChevronRight
                      className="acob-support-topic-arrow"
                      size={17}
                      aria-hidden="true"
                    />
                  </a>
                );
              })}
            </div>

            <a
              className="acob-support-whatsapp-cta"
              href={whatsappUrl(
                "Hello ACOB Support! I have a question and would appreciate your assistance.",
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={19} strokeWidth={2} aria-hidden="true" />
              <span>Chat with us on WhatsApp</span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>

            <div className="acob-support-email-row">
              <Mail size={15} aria-hidden="true" />
              <span>Prefer email?</span>
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </div>
          </div>
          <footer className="acob-support-footer">
            <span className="acob-support-footer-rule" />
            <span>Curiosity over memorisation.</span>
            <span className="acob-support-footer-rule" />
          </footer>
        </section>
      )}

      <button
        type="button"
        className={`acob-support-launcher${open ? " is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="acob-support-panel"
        aria-label={open ? "Close ACOB support chat" : "Chat with ACOB support"}
      >
        {open ? <X size={23} strokeWidth={1.9} /> : <MessageCircle size={24} strokeWidth={1.9} />}
        {!open && <span className="acob-support-launcher-label">Chat with us</span>}
        <span className="acob-support-launcher-pulse" aria-hidden="true" />
      </button>
    </div>
  );
}
