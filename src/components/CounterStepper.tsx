import { Stepper, type StepperProps } from "./Stepper.tsx";

export function formatCounters(n: number): string {
  const sign = n < 0 ? "−" : "+";
  const size = Math.abs(n);
  return `${sign}${size}/${sign}${size}`;
}

export function CounterStepper(props: Omit<StepperProps, "display">) {
  return <Stepper {...props} display={formatCounters} />;
}
