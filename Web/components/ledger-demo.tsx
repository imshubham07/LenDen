"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  RotateCcw,
  Wallet,
} from "lucide-react";

const people = [
  {
    name: "Aarav Sharma",
    initials: "AS",
    lent: 15000,
    paid: 5000,
    color: "peach",
  },
  {
    name: "Priya Mehta",
    initials: "PM",
    lent: 8500,
    paid: 3500,
    color: "purple",
  },
  { name: "Rohan Patel", initials: "RP", lent: 12000, paid: 0, color: "blue" },
];
const rupees = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export function LedgerDemo() {
  const [selected, setSelected] = useState(0);
  const [payments, setPayments] = useState([0, 0, 0]);
  const [message, setMessage] = useState("");
  const person = people[selected];
  const extraPaid = payments.reduce((sum, payment) => sum + payment, 0);
  const outstanding = person.lent - person.paid - payments[selected];

  function recordPayment() {
    const amount = Math.min(1000, outstanding);
    if (!amount) return;
    setPayments((previous) =>
      previous.map((payment, i) =>
        i === selected ? payment + amount : payment,
      ),
    );
    setMessage(`${rupees(amount)} repayment recorded for ${person.name}.`);
  }

  return (
    <div className="ledger-scene" id="demo">
      <div className="scene-orbit" aria-hidden="true" />
      <span className="handwritten scene-note">
        a clearer picture, instantly <span>↴</span>
      </span>
      <div className="ledger-window">
        <div className="window-bar">
          <span className="window-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>YOUR EVERYDAY LEDGER</span>
          <span className="demo-label">DEMO</span>
        </div>
        <div className="ledger-content">
          <div className="ledger-heading">
            <div>
              <p>A LITTLE MORE ORGANISED</p>
              <h2>
                My ledger<span>.</span>
              </h2>
            </div>
            <span className="wallet-icon">
              <Wallet size={20} />
            </span>
          </div>
          <div className="balance-card">
            <span>
              Total outstanding <ArrowUpRight size={16} />
            </span>
            <strong aria-live="polite">
              {rupees(27000 - extraPaid)}
              <span>.00</span>
            </strong>
            <div className="balance-foot">
              <span>
                <i /> Across 3 borrowers
              </span>
              <span>INR ₹</span>
            </div>
          </div>
          <div className="ledger-totals">
            <div>
              <span>
                <ArrowUpRight size={14} /> Money given
              </span>
              <strong>₹35,500</strong>
            </div>
            <div>
              <span>
                <ArrowDownLeft size={14} /> Money returned
              </span>
              <strong>{rupees(8500 + extraPaid)}</strong>
            </div>
          </div>
          <div className="borrowers-title">
            <h3>Your borrowers</h3>
            <span>03 people</span>
          </div>
          <div className="borrowers-list">
            {people.map((borrower, index) => (
              <button
                className={`borrower ${selected === index ? "selected" : ""}`}
                key={borrower.name}
                onClick={() => {
                  setSelected(index);
                  setMessage("");
                }}
                aria-pressed={selected === index}
              >
                <span className={`avatar ${borrower.color}`}>
                  {borrower.initials}
                </span>
                <span className="borrower-info">
                  <strong>{borrower.name}</strong>
                  <span>
                    {borrower.lent - borrower.paid - payments[index] === 0
                      ? "All settled"
                      : "Outstanding balance"}
                  </span>
                </span>
                <strong className="borrower-amount">
                  {rupees(borrower.lent - borrower.paid - payments[index])}
                </strong>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
          <div className="demo-action">
            <span>Try a repayment for {person.name.split(" ")[0]}</span>
            <button onClick={recordPayment} disabled={outstanding === 0}>
              {outstanding === 0 ? (
                <>
                  <Check size={14} /> Settled
                </>
              ) : (
                <>
                  <span>+</span> Record {rupees(Math.min(1000, outstanding))}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="payment-note">
        <span className="payment-check">
          <Check size={19} />
        </span>
        <div>
          <strong>Every rupee, accounted for.</strong>
          <span>Small entries. A lot less guesswork.</span>
        </div>
      </div>
      <div className="demo-caption">
        <span>Illustrative preview · Click a borrower to explore</span>
        <button
          onClick={() => {
            setPayments([0, 0, 0]);
            setSelected(0);
            setMessage("Demo reset to its starting balances.");
          }}
          aria-label="Reset demo"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>
      <p className="sr-only" role="status">
        {message}
      </p>
    </div>
  );
}
