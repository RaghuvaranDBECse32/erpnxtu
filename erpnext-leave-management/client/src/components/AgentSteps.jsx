import React from "react";
import { CheckCircle2, Clock, AlertCircle, Cpu, Zap, ShieldCheck } from "lucide-react";

export default function AgentSteps({ activeStep = 0, steps = [] }) {
  const defaultSteps = [
    {
      title: "1. Signal Ingestion",
      desc: "Ingesting telemetry: failure code, payment gateway error, transaction history, customer tier",
      icon: Cpu,
    },
    {
      title: "2. Predictive Risk & Value Assessment",
      desc: "Evaluating recovery score, bank network health, customer fatigue limits, and expected revenue value",
      icon: ShieldCheck,
    },
    {
      title: "3. Action Formulation",
      desc: "Selecting optimal intervention: Dynamic Smart Retry, Tokenized Recovery Link, or Customer Notification",
      icon: Zap,
    },
    {
      title: "4. Execution & Audit Dispatch",
      desc: "Triggering API automation, recording cryptographic audit record to Exasol engine",
      icon: CheckCircle2,
    },
  ];

  const currentSteps = steps.length > 0 ? steps : defaultSteps;

  return (
    <div className="agent-steps-container">
      <div className="agent-steps-timeline">
        {currentSteps.map((step, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;
          const isUpcoming = idx > activeStep;
          const Icon = step.icon || (isDone ? CheckCircle2 : isCurrent ? Zap : Clock);

          let statusClass = "step-upcoming";
          if (isDone) statusClass = "step-done";
          if (isCurrent) statusClass = "step-current";

          return (
            <div key={idx} className={`agent-step-item ${statusClass}`}>
              <div className="step-indicator">
                <div className="step-icon-wrapper">
                  <Icon size={18} />
                </div>
                {idx < currentSteps.length - 1 && <div className="step-connector" />}
              </div>
              <div className="step-content">
                <div className="step-header">
                  <span className="step-title">{step.title}</span>
                  {isDone && <span className="step-badge done">Completed</span>}
                  {isCurrent && <span className="step-badge active">Processing</span>}
                  {isUpcoming && <span className="step-badge pending">Queued</span>}
                </div>
                <p className="step-desc">{step.desc}</p>
                {step.detail && <div className="step-detail-box">{step.detail}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
